import React from 'react';
import { X } from 'lucide-react';

/**
 * AnalyticsFilterBar
 * Props: filters (object), onChange, onClear, showDateRange (bool), metaOptions ({districts, talukas, types, departments})
 */
export default function AnalyticsFilterBar({ filters = {}, onChange, onClear, showDateRange = false, metaOptions = {} }) {
  const { districts = [], talukas = [], types = [], departments = [] } = metaOptions;

  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  // Active chips (non-empty filter values)
  const chips = Object.entries(filters)
    .filter(([key, value]) => value && value !== '' && (showDateRange || !['dateFrom', 'dateTo'].includes(key)))
    .map(([k, v]) => ({ key: k, value: v }));

  const labelFor = (key) => {
    const labels = {
      district: 'District', taluka: 'Taluka', type: 'Type',
      department: 'Department', dateFrom: 'From', dateTo: 'To'
    };
    return labels[key] || key;
  };

  return (
    <div className="analytics-filter-bar">
      <div className="analytics-filter-controls">
        <div className="filter-group">
          <label htmlFor="af-district" className="filter-label">District</label>
          <select id="af-district" className="filter-select" value={filters.district || ''} onChange={handle('district')}>
            <option value="">All districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="af-taluka" className="filter-label">Taluka</label>
          <select id="af-taluka" className="filter-select" value={filters.taluka || ''} onChange={handle('taluka')}>
            <option value="">All talukas</option>
            {talukas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="af-type" className="filter-label">Type</label>
          <select id="af-type" className="filter-select" value={filters.type || ''} onChange={handle('type')}>
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="af-dept" className="filter-label">Department</label>
          <select id="af-dept" className="filter-select" value={filters.department || ''} onChange={handle('department')}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {showDateRange && (
          <>
            <div className="filter-group">
              <label htmlFor="af-from" className="filter-label">From</label>
              <input
                id="af-from"
                type="date"
                className="filter-input"
                value={filters.dateFrom || ''}
                onChange={handle('dateFrom')}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="af-to" className="filter-label">To</label>
              <input
                id="af-to"
                type="date"
                className="filter-input"
                value={filters.dateTo || ''}
                onChange={handle('dateTo')}
              />
            </div>
          </>
        )}

        {chips.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onClear} aria-label="Clear all filters">
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="filter-chips" aria-label="Active filters">
          {chips.map(chip => (
            <span key={chip.key} className="filter-chip">
              <span className="filter-chip-label">{labelFor(chip.key)}:</span>
              <span className="filter-chip-value">{chip.value}</span>
              <button
                className="filter-chip-remove"
                aria-label={`Remove ${labelFor(chip.key)} filter`}
                onClick={() => onChange({ ...filters, [chip.key]: '' })}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
