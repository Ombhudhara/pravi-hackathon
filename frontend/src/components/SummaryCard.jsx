import React from 'react';

/**
 * SummaryCard - single metric card for analytics
 * Props: title, value, sub, variant (default|good|warn|danger)
 */
export default function SummaryCard({ title, value, sub, variant = 'default' }) {
  return (
    <div className={`analytics-summary-card analytics-summary-card--${variant}`}>
      <p className="analytics-summary-label">{title}</p>
      <p className="analytics-summary-value">{value ?? '-'}</p>
      {sub && <p className="analytics-summary-sub">{sub}</p>}
    </div>
  );
}
