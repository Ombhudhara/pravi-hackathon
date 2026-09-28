import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ConditionBadge from './ConditionBadge';

export default function AssetSummaryCard({ asset, onClose }) {
  if (!asset) return null;

  return (
    <div className="asset-summary-card">
      <div className="card-header flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-mono text-muted block">{asset.assetCode}</span>
          <h3 className="text-sm font-semibold">{asset.name}</h3>
          <p className="text-xs text-muted">{asset.district}{asset.taluka ? `, ${asset.taluka}` : ''}</p>
        </div>
        {onClose && (
          <button className="button-icon ml-2" onClick={onClose} aria-label="Close summary">
            ×
          </button>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <StatusBadge status={asset.status} />
        <ConditionBadge condition={asset.condition} />
      </div>

      <dl className="def-list text-xs mb-3">
        <div className="def-item">
          <dt>Utilization</dt>
          <dd>
            {asset.utilizationPercent !== null ? `${asset.utilizationPercent.toFixed(1)}%` : '-'}
            {asset.isUnderutilized && <span className="text-status-red ml-1">(Underutilized)</span>}
          </dd>
        </div>
        <div className="def-item">
          <dt>Open Issues</dt>
          <dd>{asset.openIssueCount}</dd>
        </div>
        <div className="def-item">
          <dt>Last Inspection</dt>
          <dd>
            {asset.lastInspectionAt 
              ? new Date(asset.lastInspectionAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) 
              : '-'}
          </dd>
        </div>
      </dl>

      <Link to={`/app/assets/${asset.id}`} className="button button-secondary w-full text-center text-xs">
        View details
      </Link>
    </div>
  );
}
