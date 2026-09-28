import React from 'react';
import { X } from 'lucide-react';
import { getStatusLabel, getConditionLabel, getTypeLabel } from '../config/labels';

export default function ActiveFilterChips({ filters, onRemove, onClearAll }) {
  const chips = [];

  const addChip = (key, value, label) => {
    chips.push({ key, value, label });
  };

  if (filters.search) addChip('search', filters.search, `Search: "${filters.search}"`);
  if (filters.district) addChip('district', filters.district, `District: ${filters.district}`);
  if (filters.taluka) addChip('taluka', filters.taluka, `Taluka: ${filters.taluka}`);
  if (filters.department) addChip('department', filters.department, `Department: ${filters.department}`);
  if (filters.assignedOfficerId) addChip('assignedOfficerId', filters.assignedOfficerId, 'Assigned Officer'); // Usually map to name if available
  
  if (filters.utilization) {
    const utilMap = { underutilized: 'Underutilized', normal: 'Normal', unknown: 'Unknown' };
    addChip('utilization', filters.utilization, `Utilization: ${utilMap[filters.utilization] || filters.utilization}`);
  }

  const multiFilters = [
    { key: 'type', format: getTypeLabel },
    { key: 'status', format: getStatusLabel },
    { key: 'condition', format: getConditionLabel }
  ];

  multiFilters.forEach(({ key, format }) => {
    if (filters[key]) {
      const vals = filters[key].split(',');
      vals.forEach(val => {
        addChip(key, val, `${key.charAt(0).toUpperCase() + key.slice(1)}: ${format(val)}`);
      });
    }
  });

  if (chips.length === 0) return null;

  return (
    <div className="active-filters-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
      {chips.map(chip => (
        <span 
          key={`${chip.key}-${chip.value}`} 
          className="filter-chip"
        >
          {chip.label}
          <button 
            onClick={() => onRemove(chip.key, chip.value)}
            aria-label={`Remove filter ${chip.label}`}
            className="filter-chip-remove"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button 
        onClick={onClearAll} 
        className="btn-link"
        style={{ fontSize: 'var(--text-sm)', marginLeft: '0.5rem' }}
      >
        Clear all
      </button>
    </div>
  );
}
