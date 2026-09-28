import { Asset, MaintenanceIssue } from '../../models/index.js';
import { buildAnalyticsScope, getAnalyticsDateRange, getDateDifferenceInDays, getMonthKey, getMonthLabel } from './helper.js';

const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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

function countDistribution(rows, field, keys) {
  return keys.map((name) => ({ name, value: rows.filter((row) => row[field] === name).length }));
}

export async function getMaintenanceAnalytics(user, queryParams) {
  const now = new Date();
  const range = getAnalyticsDateRange(queryParams, now);
  const assets = await Asset.find(buildAnalyticsScope(user, queryParams)).select('_id asset_code name').lean();
  const issues = await MaintenanceIssue.find({ asset_id: { $in: assets.map((asset) => asset._id) } }).lean();
  const inRange = issues.filter((issue) => issue.created_at >= range.from && issue.created_at <= range.to);
  const resolvedInRange = issues.filter((issue) => ['RESOLVED', 'VERIFIED'].includes(issue.status) && issue.resolved_at && issue.resolved_at >= range.from && issue.resolved_at <= range.to);
  const openedByMonth = new Map();
  const resolvedByMonth = new Map();
  inRange.forEach((issue) => {
    const key = getMonthKey(issue.created_at);
    openedByMonth.set(key, (openedByMonth.get(key) || 0) + 1);
  });
  resolvedInRange.forEach((issue) => {
    const key = getMonthKey(issue.resolved_at);
    resolvedByMonth.set(key, (resolvedByMonth.get(key) || 0) + 1);
  });
  const monthlyTrend = monthKeys(range.filters.dateFrom, range.filters.dateTo).map((key) => ({ name: getMonthLabel(key), opened: openedByMonth.get(key) || 0, resolved: resolvedByMonth.get(key) || 0 }));
  const unresolved = issues.filter((issue) => !['RESOLVED', 'VERIFIED'].includes(issue.status));
  const ages = unresolved.map((issue) => getDateDifferenceInDays(issue.created_at, now));
  const resolvedDays = resolvedInRange.map((issue) => (issue.resolved_at - issue.created_at) / 86400000).sort((a, b) => a - b);
  const median = resolvedDays.length === 0 ? 0 : resolvedDays.length % 2 === 1
    ? resolvedDays[Math.floor(resolvedDays.length / 2)]
    : (resolvedDays[resolvedDays.length / 2 - 1] + resolvedDays[resolvedDays.length / 2]) / 2;
  const departmentNames = [...new Set(inRange.map((issue) => issue.assigned_department || 'Unassigned'))];
  if (!departmentNames.includes('Unassigned')) departmentNames.push('Unassigned');
  const byId = new Map(assets.map((asset) => [asset._id, asset]));
  const oldestUnresolved = [...unresolved].sort((a, b) => a.created_at - b.created_at).slice(0, 10).map((issue) => {
    const asset = byId.get(issue.asset_id);
    return { id: issue._id, issueCode: issue.issue_code, title: issue.title, priority: issue.priority, status: issue.status, assetId: issue.asset_id, assetCode: asset?.asset_code, assetName: asset?.name, ageDays: getDateDifferenceInDays(issue.created_at, now), createdAt: issue.created_at };
  });
  const agingCount = (test) => ages.filter(test).length;
  return {
    generatedAt: now.toISOString(),
    filters: range.filters,
    summary: {
      openIssues: unresolved.length,
      resolvedInRange: resolvedInRange.length,
      averageResolutionDays: (resolvedDays.reduce((sum, value) => sum + value, 0) / (resolvedDays.length || 1)).toFixed(1),
      medianResolutionDays: median.toFixed(1),
      oldestOpenAgeDays: ages.length ? Math.max(...ages) : 0
    },
    monthlyTrend,
    byStatus: countDistribution(inRange, 'status', STATUSES),
    byPriority: countDistribution(inRange, 'priority', PRIORITIES),
    byDepartment: departmentNames.sort().map((name) => ({ name, value: inRange.filter((issue) => (issue.assigned_department || 'Unassigned') === name).length })),
    agingBuckets: [
      { name: '0-7 days', value: agingCount((age) => age >= 0 && age <= 7) },
      { name: '8-30 days', value: agingCount((age) => age > 7 && age <= 30) },
      { name: '31-90 days', value: agingCount((age) => age > 30 && age <= 90) },
      { name: '>90 days', value: agingCount((age) => age > 90) }
    ],
    oldestUnresolved
  };
}
