import { getScopedAssets } from './helper.js';
import { config } from '../../config/env.js';
import { calculateUtilization } from '../../utils/utilization.js';

const ASSET_TYPES = ['LAND', 'BUILDING', 'SCHOOL', 'PHC', 'OFFICE', 'COMMUNITY_HALL', 'WAREHOUSE', 'STAFF_QUARTERS'];

export async function getUtilizationAnalytics(user, queryParams) {
  const threshold = config.underutilizedThreshold;
  const assets = await getScopedAssets(user, queryParams);
  const calculated = assets.map((asset) => ({ asset, ...calculateUtilization(asset, threshold) }));
  const known = calculated.filter(({ utilizationPercent }) => utilizationPercent != null);
  const direction = queryParams.sortDir === 'desc' ? -1 : 1;
  const underutilized = calculated.filter(({ asset, isUnderutilized }) => asset.status === 'ACTIVE' && isUnderutilized)
    .sort((a, b) => direction * (a.utilizationPercent - b.utilizationPercent));
  const buckets = [['0-20%', (v) => v >= 0 && v <= 20], ['>20-40%', (v) => v > 20 && v <= 40], ['>40-60%', (v) => v > 40 && v <= 60], ['>60-80%', (v) => v > 60 && v <= 80], ['>80-100%', (v) => v > 80 && v <= 100], ['>100%', (v) => v > 100]].map(([name, test]) => ({ name, count: known.filter(({ utilizationPercent }) => test(utilizationPercent)).length }));
  buckets.push({ name: 'Unknown', count: calculated.length - known.length });
  const average = (rows) => rows.length ? rows.reduce((sum, row) => sum + row.utilizationPercent, 0) / rows.length : 0;
  const byType = ASSET_TYPES.map((type) => ({ name: type, value: average(known.filter(({ asset }) => asset.type === type)) }));
  const districts = [...new Set(known.map(({ asset }) => asset.district))].map((district) => ({ name: district, value: average(known.filter(({ asset }) => asset.district === district)), count: known.filter(({ asset }) => asset.district === district).length })).sort((a, b) => b.count - a.count);
  const byDistrict = districts.slice(0, 15).map(({ name, value }) => ({ name, value }));
  if (districts.length > 15) byDistrict.push({ name: 'Other', value: average(known.filter(({ asset }) => !districts.slice(0, 15).some((row) => row.name === asset.district))) });
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  return { generatedAt: new Date().toISOString(), filters: queryParams, summary: { totalWithData: known.length, underutilizedCount: underutilized.length, unknownCount: calculated.length - known.length, averageUtilization: average(known), threshold }, buckets, byType, byDistrict, underutilizedList: { items: underutilized.slice((page - 1) * limit, page * limit).map(({ asset, utilizationPercent }) => ({ id: asset._id, assetCode: asset.asset_code, name: asset.name, type: asset.type, district: asset.district, department: asset.department, builtUpAreaSqft: asset.built_up_area_sqft, landAreaSqft: asset.land_area_sqft, usedAreaSqft: asset.used_area_sqft, utilizationPercent: Number(utilizationPercent.toFixed(2)) })), pagination: { page, limit, total: underutilized.length, totalPages: Math.ceil(underutilized.length / limit) } } };
}
