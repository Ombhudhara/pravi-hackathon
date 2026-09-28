import { Asset, AssetEvent, MaintenanceIssue, User } from '../models/index.js';
import { config } from '../config/env.js';
import { calculateUtilization } from '../utils/utilization.js';

const ASSET_TYPES = ['LAND', 'BUILDING', 'SCHOOL', 'PHC', 'OFFICE', 'COMMUNITY_HALL', 'WAREHOUSE', 'STAFF_QUARTERS'];
const ASSET_STATUSES = ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE', 'AVAILABLE', 'RETIRED', 'TRANSFERRED', 'DISPOSED'];
const ASSET_CONDITIONS = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];
const ISSUE_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];
const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const EVENT_TYPES = ['ACQUIRED', 'REGISTERED', 'ALLOCATED', 'RE_ALLOCATED', 'STATUS_CHANGED', 'INSPECTED', 'ISSUE_REPORTED', 'MAINTENANCE_STARTED', 'MAINTENANCE_COMPLETED', 'ISSUE_VERIFIED', 'NOTE'];
const countBy = (docs, field, keys) => keys.map((key) => ({ [field]: key, count: docs.filter((doc) => doc[field] === key).length }));

export const getDashboardSummary = async (user) => {
  if (user.role === 'MAINTENANCE') {
    const issues = await MaintenanceIssue.find({ assigned_to: user.id }).lean();
    return { assets: null, underutilized: [], issues: await issueSummary(issues), generatedAt: new Date().toISOString() };
  }
  const assetFilter = user.role === 'OFFICER' ? { assigned_officer_id: user.id } : {};
  const assets = await Asset.find(assetFilter).lean();
  const issueFilter = user.role === 'OFFICER' ? { asset_id: { $in: assets.map((asset) => asset._id) } } : {};
  const issues = await MaintenanceIssue.find(issueFilter).lean();
  const underutilized = assets.filter((asset) => asset.status === 'ACTIVE' && calculateUtilization(asset, config.underutilizedThreshold).isUnderutilized).sort((a, b) => calculateUtilization(a, config.underutilizedThreshold).utilizationPercent - calculateUtilization(b, config.underutilizedThreshold).utilizationPercent);
  const districtCounts = new Map();
  assets.forEach((asset) => districtCounts.set(asset.district, (districtCounts.get(asset.district) || 0) + 1));
  const districts = [...districtCounts].sort((a, b) => b[1] - a[1]);
  const byDistrict = districts.slice(0, 10).map(([district, count]) => ({ district, count }));
  if (districts.length > 10) byDistrict.push({ district: 'Other', count: districts.slice(10).reduce((sum, [, count]) => sum + count, 0) });
  const assetsSummary = { total: assets.length, byType: countBy(assets, 'type', ASSET_TYPES), byStatus: countBy(assets, 'status', ASSET_STATUSES), byCondition: countBy(assets, 'condition', ASSET_CONDITIONS), byDistrict, underutilizedCount: underutilized.length };
  const underutilizedItems = underutilized.slice(0, 10).map((asset) => ({ assetId: asset._id, assetCode: asset.asset_code, name: asset.name, type: asset.type, district: asset.district, utilizationPercent: Math.round(calculateUtilization(asset, config.underutilizedThreshold).utilizationPercent) }));
  return { assets: assetsSummary, underutilized: underutilizedItems, issues: await issueSummary(issues), generatedAt: new Date().toISOString() };
};

async function issueSummary(issues) {
  const openHighPriority = issues.filter((issue) => issue.status === 'OPEN' && ['HIGH', 'CRITICAL'].includes(issue.priority)).sort((a, b) => a.created_at - b.created_at).slice(0, 5);
  const formattedIssues = await Promise.all(openHighPriority.map(async (issue) => {
    const asset = await Asset.findById(issue.asset_id).select('asset_code name').lean();
    return { id: issue._id, issueCode: issue.issue_code, title: issue.title, assetCode: asset?.asset_code, assetName: asset?.name, priority: issue.priority, status: issue.status, createdAt: issue.created_at };
  }));
  return { total: issues.length, byStatus: countBy(issues, 'status', ISSUE_STATUSES), byPriority: countBy(issues, 'priority', ISSUE_PRIORITIES), openHighPriority: formattedIssues };
}

export const getEnums = () => ({ assetTypes: ASSET_TYPES, assetStatuses: ASSET_STATUSES, assetConditions: ASSET_CONDITIONS, issueStatuses: ISSUE_STATUSES, issuePriorities: ISSUE_PRIORITIES, eventTypes: EVENT_TYPES, underutilizedThreshold: config.underutilizedThreshold });
