import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, MinusCircle } from 'lucide-react';

const ICONS = {
  GOOD: CheckCircle2,
  NEEDS_ATTENTION: AlertTriangle,
  CRITICAL: AlertOctagon,
  NOT_APPLICABLE: MinusCircle
};

const TEXT = {
  GOOD: 'Good',
  NEEDS_ATTENTION: 'Needs attention',
  CRITICAL: 'Critical',
  NOT_APPLICABLE: 'Not applicable'
};

const DESC = {
  GOOD: 'No issues, functioning well.',
  NEEDS_ATTENTION: 'Minor to moderate issues found.',
  CRITICAL: 'Severe issues, requires immediate action.',
  NOT_APPLICABLE: 'Does not apply to this asset.'
};

export default function ChecklistRadioGroup({ label, name, value, onChange, disabled }) {
  const options = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];

  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', marginBottom: '1.5rem' }} disabled={disabled}>
      <legend style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
        {label}
      </legend>
      <div className="checklist-group">
        {options.map((opt) => {
          const isSelected = value === opt;
          const Icon = ICONS[opt];
          
          return (
            <label 
              key={opt} 
              className={`checklist-option ${opt} ${isSelected ? 'selected' : ''}`}
              style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <input 
                type="radio" 
                name={name} 
                value={opt} 
                checked={isSelected} 
                onChange={() => onChange(opt)} 
                disabled={disabled}
                style={{ 
                  opacity: 0, 
                  position: 'absolute', 
                  width: 0, 
                  height: 0 
                }} 
              />
              <div className="checklist-option-icon">
                <Icon size={16} aria-hidden="true" />
              </div>
              <div className="checklist-option-content">
                <div className="checklist-option-title">{TEXT[opt]}</div>
                <div className="checklist-option-desc">{DESC[opt]}</div>
              </div>
              <div style={{ padding: '0 0.5rem' }}>
                <div style={{ 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  borderRadius: '50%', 
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
