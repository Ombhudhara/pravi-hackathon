import React from 'react';

export default function UtilizationCell({ percent, isUnderutilized }) {
  if (percent === null || percent === undefined) {
    return <span className="text-muted">-</span>;
  }
  
  const formatted = `${Math.round(percent)}%`;
  
  if (isUnderutilized) {
    return <span style={{ color: 'var(--color-status-amber)', fontWeight: 'var(--font-weight-medium)' }}>{formatted}</span>;
  }
  
  return <span>{formatted}</span>;
}
