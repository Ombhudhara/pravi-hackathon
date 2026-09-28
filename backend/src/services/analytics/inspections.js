import { Asset, Inspection } from '../../models/index.js';
import { buildAnalyticsScope, getAnalyticsDateRange, getMonthKey, getMonthLabel, localDateKey, shiftDateKey } from './helper.js';
import { config } from '../../config/env.js';

const INSPECTABLE = ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE', 'AVAILABLE'];

function monthKeys(fromDate, toDate) {
  const keys = [];
  let [year, month] = fromDate.slice(0, 7).split('-').map(Number);
  const [lastYear, lastMonth] = toDate.slice(0, 7).split('-').map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month === 13) { month = 1; year += 1; }
  }
  return keys;
}

export async function getInspectionsAnalytics(user, queryParams) {
  const now = new Date();
  const range = getAnalyticsDateRange(queryParams, now);
  const assetFilter = { ...buildAnalyticsScope(user, queryParams), status: { $in: INSPECTABLE } };
  const assets = await Asset.find(assetFilter).lean();
  const inspections = await Inspection.find({ asset_id: { $in: assets.map((asset) => asset._id) } }).sort({ inspected_at: -1 }).lean();
  const latestByAsset = new Map();
  const monthlyCounts = new Map();
  inspections.forEach((inspection) => {
    if (!latestByAsset.has(inspection.asset_id)) latestByAsset.set(inspection.asset_id, inspection.inspected_at);
    if (inspection.inspected_at >= range.from && inspection.inspected_at <= range.to) {
      const key = getMonthKey(inspection.inspected_at);
      monthlyCounts.set(key, (monthlyCounts.get(key) || 0) + 1);
    }
  });
  const never = assets.filter((asset) => !latestByAsset.has(asset._id)).sort((a, b) => a.created_at - b.created_at);
  const overdueBefore = shiftDateKey(localDateKey(now), { days: -config.inspectionIntervalDays });
  const overdue = assets.filter((asset) => latestByAsset.has(asset._id) && localDateKey(latestByAsset.get(asset._id)) < overdueBefore)
    .sort((a, b) => latestByAsset.get(a._id) - latestByAsset.get(b._id));
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const toAsset = (asset) => ({ id: asset._id, assetCode: asset.asset_code, name: asset.name, type: asset.type, district: asset.district, department: asset.department });
  const monthlyTrend = monthKeys(range.filters.dateFrom, range.filters.dateTo).map((key) => ({ name: getMonthLabel(key), value: monthlyCounts.get(key) || 0 }));
  return {
    generatedAt: now.toISOString(),
    filters: range.filters,
    summary: { inspectionsInRange: monthlyTrend.reduce((sum, item) => sum + item.value, 0), neverInspectedCount: never.length, overdueCount: overdue.length, intervalDays: config.inspectionIntervalDays },
    monthlyTrend,
    neverInspected: { items: never.slice((page - 1) * limit, page * limit).map(toAsset), pagination: { page, limit, total: never.length, totalPages: Math.ceil(never.length / limit) } },
    overdue: { items: overdue.slice((page - 1) * limit, page * limit).map((asset) => ({ ...toAsset(asset), lastInspectionDate: latestByAsset.get(asset._id) })), pagination: { page, limit, total: overdue.length, totalPages: Math.ceil(overdue.length / limit) } }
  };
}
