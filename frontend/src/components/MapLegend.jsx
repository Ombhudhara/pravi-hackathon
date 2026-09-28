import React from 'react';

export default function MapLegend() {
  const legendItems = [
    { label: 'Active', shape: 'circle', color: 'var(--color-status-green)' },
    { label: 'Vacant', shape: 'square', color: 'var(--color-status-amber)' },
    { label: 'Maintenance', shape: 'diamond', color: 'var(--color-status-red)' },
    { label: 'Available', shape: 'ring', color: 'var(--color-status-teal)' },
    { label: 'Inactive/Other', shape: 'circle', color: 'var(--color-text-disabled)' }
  ];

  return (
    <div className="map-legend">
      <h4 className="text-xs font-semibold mb-2">Legend</h4>
      <div className="legend-items">
        {legendItems.map((item, idx) => (
          <div key={idx} className="legend-item flex items-center gap-2">
            <div className="legend-icon-wrapper" style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                {item.shape === 'circle' && <circle cx="6" cy="6" r="5" fill={item.color} />}
                {item.shape === 'square' && <rect x="1" y="1" width="10" height="10" fill={item.color} />}
                {item.shape === 'diamond' && <polygon points="6,1 11,6 6,11 1,6" fill={item.color} />}
                {item.shape === 'ring' && (
                  <>
                    <circle cx="6" cy="6" r="4" fill="none" stroke={item.color} strokeWidth="2" />
                  </>
                )}
              </svg>
            </div>
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
