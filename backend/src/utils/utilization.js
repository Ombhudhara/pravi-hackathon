/**
 * Calculates the utilization percentage and checks if it's underutilized.
 * Derived using the same rule and threshold as Module 4.
 * @param {Object} asset - The asset record.
 * @param {number} threshold - The threshold percentage (e.g., 50 for 50%).
 * @returns {Object} { utilizationPercent, isUnderutilized }
 */
export function calculateUtilization(asset, threshold = 50) {
  let utilizationPercent = null;
  let isUnderutilized = false;

  if (asset.type === 'LAND') {
    if (asset.land_area_sqft > 0 && asset.used_area_sqft != null) {
      utilizationPercent = (asset.used_area_sqft / asset.land_area_sqft) * 100;
    }
  } else {
    if (asset.built_up_area_sqft > 0 && asset.used_area_sqft != null) {
      utilizationPercent = (asset.used_area_sqft / asset.built_up_area_sqft) * 100;
    }
  }

  if (utilizationPercent !== null) {
    utilizationPercent = Math.round(utilizationPercent * 100) / 100; // Round to 2 decimals
    isUnderutilized = utilizationPercent < threshold;
  }

  return { utilizationPercent, isUnderutilized };
}
