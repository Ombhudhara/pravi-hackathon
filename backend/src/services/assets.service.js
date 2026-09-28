import { Asset, AssetEvent, Attachment, Inspection, MaintenanceIssue, User, Counter } from '../models/index.js';
import { calculateUtilization } from '../utils/utilization.js';
import { config } from '../config/env.js';

const THRESHOLD = config.underutilizedThreshold;
const sortFields = { asset_code: 'asset_code', name: 'name', type: 'type', district: 'district', status: 'status', condition: 'condition', updated_at: 'updated_at' };
const values = (input) => input?.split(',').map((value) => value.trim()).filter(Boolean) || [];
const publicDoc = (doc) => {
  if (!doc) return null;
  const result = doc.toObject ? doc.toObject() : { ...doc };
  result.id = result._id;
  delete result._id;
  return result;
};
const utilization = (asset) => calculateUtilization(asset, THRESHOLD);

function scopeForUser(user) {
  return user.role === 'OFFICER' ? { assigned_officer_id: user.id } : {};
}

export const getAssets = async (query, user) => {
  let { search, type, status, condition, district, taluka, department, assignedOfficerId, utilization: utilFilter, hasCoordinates, page = 1, limit = 20, sortBy = 'updated_at', sortDir = 'desc' } = query;
  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const filter = scopeForUser(user);
  if (search) filter.$or = ['asset_code', 'name', 'survey_number', 'village', 'district'].map((field) => ({ [field]: { $regex: search, $options: 'i' } }));
  for (const [field, raw] of Object.entries({ type, status, condition })) {
    const selected = values(raw);
    if (selected.length) filter[field] = { $in: selected };
  }
  for (const [field, value] of Object.entries({ district, taluka, department })) if (value) filter[field] = value;
  if (assignedOfficerId && user.role === 'ADMIN') filter.assigned_officer_id = assignedOfficerId;
  if (hasCoordinates === 'true') { filter.latitude = { $ne: null }; filter.longitude = { $ne: null }; }
  if (hasCoordinates === 'false') filter.$and = [...(filter.$and || []), { $or: [{ latitude: null }, { longitude: null }] }];

  let rows = await Asset.find(filter).lean();
  if (utilFilter) rows = rows.filter((asset) => {
    const { utilizationPercent, isUnderutilized } = utilization(asset);
    if (utilFilter === 'underutilized') return asset.status === 'ACTIVE' && isUnderutilized;
    if (utilFilter === 'normal') return asset.status === 'ACTIVE' && utilizationPercent != null && !isUnderutilized;
    return utilizationPercent == null;
  });
  const direction = sortDir.toLowerCase() === 'asc' ? 1 : -1;
  if (sortBy === 'utilization') rows.sort((a, b) => direction * ((utilization(a).utilizationPercent ?? Infinity) - (utilization(b).utilizationPercent ?? Infinity)));
  else rows.sort((a, b) => direction * String(a[sortFields[sortBy] || 'updated_at'] ?? '').localeCompare(String(b[sortFields[sortBy] || 'updated_at'] ?? '')));
  const total = rows.length;
  const items = await Promise.all(rows.slice((page - 1) * limit, page * limit).map(async (asset) => {
    const officer = asset.assigned_officer_id ? await User.findById(asset.assigned_officer_id).select('full_name').lean() : null;
    const { utilizationPercent, isUnderutilized } = utilization(asset);
    return { id: asset._id, assetCode: asset.asset_code, name: asset.name, type: asset.type, department: asset.department, district: asset.district, taluka: asset.taluka, village: asset.village, status: asset.status, condition: asset.condition, utilizationPercent, isUnderutilized, assignedOfficer: officer ? { id: officer._id, fullName: officer.full_name } : null, updatedAt: asset.updated_at };
  }));
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAssetFilters = async (user) => {
  const match = scopeForUser(user);
  const [districts, talukas, departments, officers] = await Promise.all([
    Asset.distinct('district', { ...match, district: { $ne: null } }),
    Asset.distinct('taluka', { ...match, taluka: { $ne: null } }),
    Asset.distinct('department', { ...match, department: { $ne: null } }),
    user.role === 'ADMIN' ? User.find({ role: 'OFFICER' }).select('full_name').sort({ full_name: 1 }).lean() : []
  ]);
  return { districts: districts.sort(), talukas: talukas.sort(), departments: departments.sort(), officers: officers.map(({ _id, full_name }) => ({ id: _id, fullName: full_name })) };
};

export const getAssetById = async (id, user) => {
  const asset = await Asset.findById(id).lean();
  if (!asset || (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id)) return null;
  const [officer, creator, openIssueCount, eventCount, inspection] = await Promise.all([
    asset.assigned_officer_id ? User.findById(asset.assigned_officer_id).select('full_name').lean() : null,
    asset.created_by ? User.findById(asset.created_by).select('full_name').lean() : null,
    MaintenanceIssue.countDocuments({ asset_id: id, status: { $nin: ['RESOLVED', 'VERIFIED'] } }),
    AssetEvent.countDocuments({ asset_id: id }),
    Inspection.findOne({ asset_id: id, status: 'COMPLETED' }).sort({ inspected_at: -1 }).lean()
  ]);
  const { utilizationPercent, isUnderutilized } = utilization(asset);
  return { ...asset, id: asset._id, utilizationPercent, isUnderutilized, assignedOfficer: officer ? { id: officer._id, fullName: officer.full_name } : null, createdBy: creator ? { id: creator._id, fullName: creator.full_name } : null, lastInspectionAt: inspection?.inspected_at || null, latestInspection: inspection ? { id: inspection._id, inspectionDate: inspection.inspected_at, overallCondition: inspection.overall_condition, buildingCondition: inspection.building_condition, electricity: inspection.electricity, water: inspection.water, plumbing: inspection.plumbing, fireSafety: inspection.fire_safety } : null, openIssueCount, eventCount };
};

async function generateAssetCode(type) {
  const prefixes = { LAND: 'LAND', BUILDING: 'BLD', SCHOOL: 'SCH', PHC: 'PHC', OFFICE: 'OFC', COMMUNITY_HALL: 'HALL', WAREHOUSE: 'WHS', STAFF_QUARTERS: 'QTR' };
  const counter = await Counter.findOneAndUpdate({ name: `asset-${type}` }, { $inc: { value: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return `GOV-${prefixes[type] || 'GEN'}-${String(counter.value).padStart(3, '0')}`;
}

export const createAsset = async (data, user) => {
  const asset = await Asset.create({ ...data, asset_code: await generateAssetCode(data.type), created_by: user.id });
  await AssetEvent.create({ asset_id: asset.id, event_type: 'REGISTERED', description: 'Asset registered', performed_by: user.id, event_date: new Date() });
  return publicDoc(asset);
};

export const updateAsset = async (id, data, user) => {
  const oldAsset = await Asset.findById(id);
  if (!oldAsset) return null;
  const updated = await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (data.assigned_officer_id !== undefined && String(data.assigned_officer_id) !== String(oldAsset.assigned_officer_id)) {
    const officer = data.assigned_officer_id ? await User.findById(data.assigned_officer_id).select('full_name').lean() : null;
    await AssetEvent.create({ asset_id: id, event_type: 'ALLOCATED', description: officer ? `Asset allocated to ${officer.full_name}` : 'Asset allocation removed', performed_by: user.id, event_date: new Date(), metadata: { fromOfficerId: oldAsset.assigned_officer_id || null, toOfficerId: data.assigned_officer_id || null } });
  }
  if (data.status && data.status !== oldAsset.status) await AssetEvent.create({ asset_id: id, event_type: 'STATUS_CHANGED', description: `Status changed from ${oldAsset.status} to ${data.status}`, performed_by: user.id, event_date: new Date(), metadata: { fromStatus: oldAsset.status, toStatus: data.status } });
  return publicDoc(updated);
};

export const changeAssetStatus = async (id, data, user) => {
  const { status, note } = data;
  const oldAsset = await Asset.findById(id);
  if (!oldAsset || (user.role === 'OFFICER' && String(oldAsset.assigned_officer_id) !== user.id)) return null;
  if (user.role === 'OFFICER' && !['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE'].includes(status)) throw new Error('Status change not allowed for OFFICER');
  if (oldAsset.status === status) throw new Error('Asset is already in this status');
  const previousStatus = oldAsset.status;
  oldAsset.status = status;
  await oldAsset.save();
  const description = note ? `Status changed from ${previousStatus} to ${status}. Note: ${note}` : `Status changed from ${previousStatus} to ${status}`;
  await AssetEvent.create({ asset_id: id, event_type: 'STATUS_CHANGED', description, performed_by: user.id, event_date: new Date(), metadata: { fromStatus: previousStatus, toStatus: status } });
  return publicDoc(oldAsset);
};
