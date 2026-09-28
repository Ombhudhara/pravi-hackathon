export const ASSET_TYPES = {
  LAND: 'Land',
  BUILDING: 'Building',
  SCHOOL: 'School',
  PHC: 'Primary Health Center',
  OFFICE: 'Office',
  COMMUNITY_HALL: 'Community Hall',
  WAREHOUSE: 'Warehouse',
  STAFF_QUARTERS: 'Staff Quarters'
};

export const ASSET_STATUSES = {
  ACTIVE: 'Active',
  VACANT: 'Vacant',
  UNDER_MAINTENANCE: 'Under maintenance',
  AVAILABLE: 'Available',
  RETIRED: 'Retired',
  TRANSFERRED: 'Transferred',
  DISPOSED: 'Disposed'
};

export const ASSET_CONDITIONS = {
  GOOD: 'Good',
  NEEDS_ATTENTION: 'Needs attention',
  CRITICAL: 'Critical',
  NOT_APPLICABLE: 'Not applicable'
};

export const ISSUE_STATUSES = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  VERIFIED: 'Verified'
};

export const ISSUE_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export function getTypeLabel(type) {
  return ASSET_TYPES[type] || type;
}

export function getStatusLabel(status) {
  return ASSET_STATUSES[status] || status;
}

export function getConditionLabel(condition) {
  return ASSET_CONDITIONS[condition] || condition;
}

export function getIssueStatusLabel(status) {
  return ISSUE_STATUSES[status] || status;
}

export function getIssuePriorityLabel(priority) {
  return ISSUE_PRIORITIES[priority] || priority;
}

export const EVENT_TYPES = {
  ACQUIRED: 'Acquired',
  REGISTERED: 'Registered',
  ALLOCATED: 'Allocated',
  RE_ALLOCATED: 'Re-allocated',
  STATUS_CHANGED: 'Status changed',
  INSPECTED: 'Inspected',
  ISSUE_REPORTED: 'Issue reported',
  MAINTENANCE_STARTED: 'Maintenance started',
  MAINTENANCE_COMPLETED: 'Maintenance completed',
  ISSUE_VERIFIED: 'Issue verified',
  NOTE: 'Note'
};

export function getEventLabel(type) {
  return EVENT_TYPES[type] || type;
}
