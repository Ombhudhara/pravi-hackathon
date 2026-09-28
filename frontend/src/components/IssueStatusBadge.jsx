import React from 'react';
import { getIssueStatusLabel } from '../config/labels';

export default function IssueStatusBadge({ status }) {
  const label = getIssueStatusLabel(status);
  
  let variantClass = 'neutral';
  if (status === 'OPEN') {
    // Open uses red text badge per spec, maybe just plain red badge
    variantClass = 'red';
  } else if (status === 'ASSIGNED' || status === 'IN_PROGRESS') {
    variantClass = 'amber';
  } else if (status === 'RESOLVED') {
    // Teal or blue? I'll use blue since we only have green/amber/red/blue/neutral in common.css
    // Or I'll create a badge-teal class in common.css if needed, wait spec says teal for RESOLVED.
    variantClass = 'teal';
  } else if (status === 'VERIFIED') {
    variantClass = 'green';
  }

  return (
    <span className={`badge badge-${variantClass}`}>
      {label}
    </span>
  );
}
