import { Asset, Inspection, MaintenanceIssue } from '../models/index.js';
import { calculateUtilization } from '../utils/utilization.js';
import { config } from '../config/env.js';

const THRESHOLD = config.underutilizedThreshold;
const split = (value) => value?.split(',').map((item) => item.trim()).filter(Boolean) || [];

export const getMapAssets = async (query, user) => {
  const { search, type, status, condition, district, taluka, department, assignedOfficerId, utilization, bbox } = query;
  const filter = {};
  if (user.role === 'OFFICER') filter.assigned_officer_id = user.id;
  else if (assignedOfficerId && user.role === 'ADMIN') filter.assigned_officer_id = assignedOfficerId;
  if (search) filter.$or = ['asset_code', 'name', 'survey_number', 'village', 'district'].map((field) => ({ [field]: { $regex: search, $options: 'i' } }));
  for (const [field, raw] of Object.entries({ type, status, condition })) { const items = split(raw); if (items.length) filter[field] = { $in: items }; }
  for (const [field, value] of Object.entries({ district, taluka, department })) if (value) filter[field] = value;
  let assets = await Asset.find(filter).sort({ updated_at: -1 }).lean();
  if (utilization) assets = assets.filter((asset) => {
    const { utilizationPercent, isUnderutilized } = calculateUtilization(asset, THRESHOLD);
    if (utilization === 'underutilized') return asset.status === 'ACTIVE' && isUnderutilized;
    if (utilization === 'normal') return asset.status === 'ACTIVE' && utilizationPercent != null && !isUnderutilized;
    return utilizationPercent == null;
  });
  const missingCoordinatesCount = assets.filter((asset) => asset.latitude == null || asset.longitude == null).length;
  let located = assets.filter((asset) => asset.latitude != null && asset.longitude != null);
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    if ([minLng, minLat, maxLng, maxLat].every(Number.isFinite)) located = located.filter((asset) => asset.longitude >= minLng && asset.latitude >= minLat && asset.longitude <= maxLng && asset.latitude <= maxLat);
  }
  const total = located.length;
  const items = await Promise.all(located.slice(0, 5000).map(async (asset) => {
    const [{ utilizationPercent, isUnderutilized }, lastInspection, openIssueCount] = await Promise.all([
      Promise.resolve(calculateUtilization(asset, THRESHOLD)),
      Inspection.findOne({ asset_id: asset._id, status: 'COMPLETED' }).sort({ inspected_at: -1 }).select('inspected_at').lean(),
      MaintenanceIssue.countDocuments({ asset_id: asset._id, status: { $nin: ['RESOLVED', 'VERIFIED'] } })
    ]);
    return { id: asset._id, assetCode: asset.asset_code, name: asset.name, type: asset.type, status: asset.status, condition: asset.condition, latitude: Number(asset.latitude), longitude: Number(asset.longitude), district: asset.district, utilizationPercent, isUnderutilized, lastInspectionAt: lastInspection?.inspected_at || null, openIssueCount };
  }));
  return { items, total, missingCoordinatesCount, truncated: total > 5000 };
};
