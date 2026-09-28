import { Asset, Inspection, MaintenanceIssue } from '../../models/index.js';
import { calculateOverallCondition } from '../../utils/condition.js';
import { buildAnalyticsScope } from './helper.js';

const CONDITIONS = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];
const CONDITION_LABELS = { GOOD: 'Good', NEEDS_ATTENTION: 'Needs attention', CRITICAL: 'Critical', NOT_APPLICABLE: 'Not applicable' };
const ASSET_TYPES = ['LAND', 'BUILDING', 'SCHOOL', 'PHC', 'OFFICE', 'COMMUNITY_HALL', 'WAREHOUSE', 'STAFF_QUARTERS'];
const COMPONENTS = [
  { key: 'building_condition', name: 'Building' },
  { key: 'electricity', name: 'Electricity' },
  { key: 'water', name: 'Water' },
  { key: 'plumbing', name: 'Plumbing' },
  { key: 'fire_safety', name: 'Fire Safety' }
];

function groupByCondition(assets) {
  return Object.fromEntries(CONDITIONS.map((condition) => [condition, assets.filter((asset) => asset.condition === condition).length]));
}

export async function getConditionAnalytics(user, queryParams) {
  const assets = await Asset.find(buildAnalyticsScope(user, queryParams)).lean();
  const assetIds = assets.map((asset) => asset._id);
  const inspections = await Inspection.find({ asset_id: { $in: assetIds } }).sort({ inspected_at: -1 }).lean();
  const latestByAsset = new Map();
  inspections.forEach((inspection) => {
    if (!latestByAsset.has(inspection.asset_id)) latestByAsset.set(inspection.asset_id, inspection);
  });

  const distributionCounts = groupByCondition(assets);
  const distribution = CONDITIONS.map((condition) => ({ name: CONDITION_LABELS[condition], value: distributionCounts[condition] }));
  const byType = ASSET_TYPES.map((type) => {
    const typeAssets = assets.filter((asset) => asset.type === type);
    return { name: type, ...groupByCondition(typeAssets) };
  });
  const districtGroups = [...new Set(assets.map((asset) => asset.district))]
    .map((district) => ({ district, assets: assets.filter((asset) => asset.district === district) }))
    .sort((left, right) => right.assets.length - left.assets.length);
  const byDistrict = districtGroups.slice(0, 15).map(({ district, assets: districtAssets }) => ({ name: district, ...groupByCondition(districtAssets) }));
  if (districtGroups.length > 15) {
    const topDistricts = new Set(districtGroups.slice(0, 15).map(({ district }) => district));
    byDistrict.push({ name: 'Other', ...groupByCondition(assets.filter((asset) => !topDistricts.has(asset.district))) });
  }

  const latestInspections = [...latestByAsset.values()];
  const components = COMPONENTS.map(({ key, name }) => {
    const counts = Object.fromEntries(CONDITIONS.map((condition) => [condition, latestInspections.filter((inspection) => (inspection[key] || 'NOT_APPLICABLE') === condition).length]));
    return { name, ...counts };
  });

  const attention = assets.filter((asset) => ['CRITICAL', 'NEEDS_ATTENTION'].includes(asset.condition))
    .sort((left, right) => (latestByAsset.get(left._id)?.inspected_at || left.updated_at || left.created_at) - (latestByAsset.get(right._id)?.inspected_at || right.updated_at || right.created_at));
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const pageAssets = attention.slice((page - 1) * limit, page * limit);
  const issueCounts = await MaintenanceIssue.aggregate([
    { $match: { asset_id: { $in: pageAssets.map((asset) => asset._id) }, status: { $nin: ['RESOLVED', 'VERIFIED'] } } },
    { $group: { _id: '$asset_id', count: { $sum: 1 } } }
  ]);
  const issueCountByAsset = new Map(issueCounts.map(({ _id, count }) => [_id, count]));
  const attentionItems = pageAssets.map((asset) => {
    const inspection = latestByAsset.get(asset._id);
    const condition = asset.condition || (inspection ? calculateOverallCondition(inspection) : 'NOT_APPLICABLE');
    return {
      assetId: asset._id,
      assetCode: asset.asset_code,
      assetName: asset.name,
      assetType: asset.type,
      district: asset.district,
      condition,
      lastInspectionDate: inspection?.inspected_at || null,
      openIssues: issueCountByAsset.get(asset._id) || 0
    };
  });
  const total = attention.length;
  return {
    generatedAt: new Date().toISOString(),
    filters: queryParams,
    summary: {
      goodCount: distributionCounts.GOOD,
      attentionCount: distributionCounts.NEEDS_ATTENTION,
      criticalCount: distributionCounts.CRITICAL,
      notApplicableCount: distributionCounts.NOT_APPLICABLE
    },
    distribution,
    byType,
    byDistrict,
    components,
    attentionList: { items: attentionItems, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  };
}
