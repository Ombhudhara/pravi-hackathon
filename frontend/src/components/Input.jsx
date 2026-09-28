import React from 'react';

// Props: label, id, error, helperText
export default function Input({ label, id, error, helperText, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input id={id} className="form-input" {...props} />
      {error && <span className="form-error-text">{error}</span>}
      {helperText && !error && <span className="form-helper-text">{helperText}</span>}
    </div>
  );
}
