import React from 'react';

// Props: variant (primary|secondary|danger|ghost), size (sm|md|lg), icon
export default function Button({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
