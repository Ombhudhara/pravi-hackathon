import React from 'react';

// Props: variant (green|amber|red|neutral)
export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
