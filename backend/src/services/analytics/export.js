import { Asset, Inspection, MaintenanceIssue } from '../../models/index.js';
import { calculateUtilization } from '../../utils/utilization.js';
import { buildAnalyticsScope, getAnalyticsDateRange, localDateKey, shiftDateKey } from './helper.js';
import { generateCsv } from '../../utils/csv.js';
import { config } from '../../config/env.js';

const INSPECTABLE = ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE', 'AVAILABLE'];
const CAP = 50000;

export async function exportAnalytics(user, reportType, queryParams) {
  const assets = await Asset.find(buildAnalyticsScope(user, queryParams)).lean();
  const assetById = new Map(assets.map((asset) => [asset._id, asset]));
  let headers;
  let rows;

  if (reportType === 'utilization') {
    headers = ['Asset Code', 'Name', 'Type', 'District', 'Department', 'Built Up Area', 'Land Area', 'Used Area', 'Utilization %'];
    rows = assets.filter((asset) => asset.status === 'ACTIVE' && calculateUtilization(asset, config.underutilizedThreshold).isUnderutilized)
      .sort((left, right) => calculateUtilization(left, config.underutilizedThreshold).utilizationPercent - calculateUtilization(right, config.underutilizedThreshold).utilizationPercent)
      .slice(0, CAP)
      .map((asset) => [asset.asset_code, asset.name, asset.type, asset.district, asset.department, asset.built_up_area_sqft, asset.land_area_sqft, asset.used_area_sqft, calculateUtilization(asset, config.underutilizedThreshold).utilizationPercent]);
  } else if (reportType === 'condition') {
    headers = ['Asset Code', 'Name', 'Type', 'District', 'Overall Condition', 'Last Inspection Date', 'Open Issues'];
    const inspections = await Inspection.find({ asset_id: { $in: assets.map((asset) => asset._id) } }).sort({ inspected_at: -1 }).lean();
    const latestByAsset = new Map();
    inspections.forEach((inspection) => { if (!latestByAsset.has(inspection.asset_id)) latestByAsset.set(inspection.asset_id, inspection); });
    const attention = assets.filter((asset) => ['CRITICAL', 'NEEDS_ATTENTION'].includes(asset.condition)).slice(0, CAP);
    const counts = await MaintenanceIssue.aggregate([
      { $match: { asset_id: { $in: attention.map((asset) => asset._id) }, status: { $nin: ['RESOLVED', 'VERIFIED'] } } },
      { $group: { _id: '$asset_id', count: { $sum: 1 } } }
    ]);
    const countByAsset = new Map(counts.map(({ _id, count }) => [_id, count]));
    rows = attention.map((asset) => [asset.asset_code, asset.name, asset.type, asset.district, asset.condition, latestByAsset.get(asset._id)?.inspected_at, countByAsset.get(asset._id) || 0]);
  } else if (reportType === 'maintenance') {
    headers = ['Issue Code', 'Asset Code', 'Title', 'Status', 'Priority', 'Department', 'Created At', 'Resolved At', 'Age Days'];
    const range = getAnalyticsDateRange(queryParams);
    const issues = await MaintenanceIssue.find({ asset_id: { $in: assets.map((asset) => asset._id) }, created_at: { $gte: range.from, $lte: range.to } }).sort({ created_at: -1 }).limit(CAP).lean();
    rows = issues.map((issue) => [issue.issue_code, assetById.get(issue.asset_id)?.asset_code, issue.title, issue.status, issue.priority, issue.assigned_department || 'Unassigned', issue.created_at, issue.resolved_at, Math.floor((new Date() - issue.created_at) / 86400000)]);
  } else if (reportType === 'inspections') {
    headers = ['Asset Code', 'Name', 'Type', 'District', 'Inspection Date', 'Overall Condition', 'Remarks'];
    const range = getAnalyticsDateRange(queryParams);
    const activeAssets = assets.filter((asset) => INSPECTABLE.includes(asset.status));
    const inspections = await Inspection.find({ asset_id: { $in: activeAssets.map((asset) => asset._id) }, inspected_at: { $gte: range.from, $lte: range.to } }).sort({ inspected_at: -1 }).limit(CAP).lean();
    rows = inspections.map((inspection) => {
      const asset = assetById.get(inspection.asset_id);
      return [asset?.asset_code, asset?.name, asset?.type, asset?.district, inspection.inspected_at, inspection.overall_condition, inspection.remarks];
    });
  } else if (reportType === 'never-inspected' || reportType === 'overdue') {
    const activeAssets = assets.filter((asset) => INSPECTABLE.includes(asset.status));
    const activeIds = activeAssets.map((asset) => asset._id);
    const inspections = await Inspection.find({ asset_id: { $in: activeIds } }).select('asset_id inspected_at').sort({ inspected_at: -1 }).lean();
    const latestByAsset = new Map();
    inspections.forEach((inspection) => { if (!latestByAsset.has(inspection.asset_id)) latestByAsset.set(inspection.asset_id, inspection.inspected_at); });
    if (reportType === 'never-inspected') {
      headers = ['Asset Code', 'Name', 'Type', 'District', 'Department'];
      rows = activeAssets.filter((asset) => !latestByAsset.has(asset._id)).sort((left, right) => left.created_at - right.created_at).slice(0, CAP)
        .map((asset) => [asset.asset_code, asset.name, asset.type, asset.district, asset.department]);
    } else {
      headers = ['Asset Code', 'Name', 'Type', 'District', 'Department', 'Last Inspection Date'];
      const overdueBefore = shiftDateKey(localDateKey(), { days: -config.inspectionIntervalDays });
      rows = activeAssets.filter((asset) => latestByAsset.has(asset._id) && localDateKey(latestByAsset.get(asset._id)) < overdueBefore)
        .sort((left, right) => latestByAsset.get(left._id) - latestByAsset.get(right._id)).slice(0, CAP)
        .map((asset) => [asset.asset_code, asset.name, asset.type, asset.district, asset.department, latestByAsset.get(asset._id)]);
    }
  } else {
    throw { status: 400, message: 'Invalid report type' };
  }

  return generateCsv(headers, rows.map((row) => row.map((value) => value instanceof Date ? value.toISOString() : value)));
}
