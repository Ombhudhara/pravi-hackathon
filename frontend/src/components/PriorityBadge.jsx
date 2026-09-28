import React from 'react';
import { getIssuePriorityLabel } from '../config/labels';

export default function PriorityBadge({ priority }) {
  const label = getIssuePriorityLabel(priority);
  
  let variantClass = 'neutral';
  if (priority === 'CRITICAL' || priority === 'HIGH') {
    variantClass = 'red';
  } else if (priority === 'MEDIUM') {
    variantClass = 'amber';
  }

  return (
    <span className={`badge badge-${variantClass}`}>
      {label}
    </span>
  );
}
