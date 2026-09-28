export const ISSUE_STATUSES = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  VERIFIED: 'VERIFIED'
};

export const ISSUE_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const isValidTransition = (fromStatus, toStatus, userRole, issueAssigneeId, userId) => {
  if (fromStatus === toStatus) return false;

  const isAssignedUser = issueAssigneeId != null && String(issueAssigneeId) === String(userId);
  const isAdmin = userRole === 'ADMIN';

  // ADMIN can transition to any status except from terminal VERIFIED state
  if (isAdmin) {
    return fromStatus !== ISSUE_STATUSES.VERIFIED;
  }

  switch (fromStatus) {
    case ISSUE_STATUSES.OPEN:
      // Only ADMIN (handled above) can assign
      return false;

    case ISSUE_STATUSES.ASSIGNED:
      // Assigned MAINTENANCE user can move to IN_PROGRESS
      return toStatus === ISSUE_STATUSES.IN_PROGRESS && isAssignedUser;

    case ISSUE_STATUSES.IN_PROGRESS:
      // Assigned MAINTENANCE user can resolve
      return toStatus === ISSUE_STATUSES.RESOLVED && isAssignedUser;

    case ISSUE_STATUSES.RESOLVED:
      // OFFICER can verify or send back to IN_PROGRESS
      if (toStatus === ISSUE_STATUSES.VERIFIED || toStatus === ISSUE_STATUSES.IN_PROGRESS) {
        return userRole === 'OFFICER';
      }
      return false;

    case ISSUE_STATUSES.VERIFIED:
      // Terminal state
      return false;

    default:
      return false;
  }
};
