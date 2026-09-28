import React from 'react';

// Props: label, id, options ({value, label}), error
export default function Select({ label, id, options, error, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <select id={id} className="form-select" {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="form-error-text">{error}</span>}
    </div>
  );
}
