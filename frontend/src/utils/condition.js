export const COMPONENT_OPTIONS = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];

export function calculateOverallCondition({
  building_condition,
  electricity,
  water,
  plumbing,
  fire_safety
}) {
  const values = [building_condition, electricity, water, plumbing, fire_safety];
  
  if (values.includes('CRITICAL')) {
    return 'CRITICAL';
  }
  if (values.includes('NEEDS_ATTENTION')) {
    return 'NEEDS_ATTENTION';
  }
  if (values.includes('GOOD')) {
    return 'GOOD';
  }
  
  return 'NOT_APPLICABLE';
}

export function getDecidingSentence(condition) {
  if (condition === 'CRITICAL') {
    return 'The overall condition is Critical because at least one component is marked as Critical.';
  }
  if (condition === 'NEEDS_ATTENTION') {
    return 'The overall condition is Needs attention because at least one component needs attention.';
  }
  if (condition === 'GOOD') {
    return 'The overall condition is Good because at least one component is good and none are worse.';
  }
  return 'The overall condition is Not applicable because all components are not applicable.';
}
