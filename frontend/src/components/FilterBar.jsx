import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { ASSET_TYPES, ASSET_STATUSES, ASSET_CONDITIONS } from '../config/labels';
import useMediaQuery from '../hooks/useMediaQuery';

export default function FilterBar({ 
  filters, 
  filterOptions, 
  onChange, 
  role,
  isAdmin 
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange('search', localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Drawer accessibility and trap
  const drawerRef = useRef(null);
  useEffect(() => {
    const handleEscape = (e) => {
      if (drawerOpen && e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [drawerOpen]);

  const handleSelectChange = (key, value) => {
    onChange(key, value);
  };

  const getOptions = (obj) => Object.entries(obj).map(([k, v]) => ({ value: k, label: v }));

  const filterControls = (
    <div className="filter-controls-grid">
      <Select 
        id="filter-type"
        label="Type"
        value={filters.type || ''}
        onChange={(e) => handleSelectChange('type', e.target.value)}
        options={[{value: '', label: 'All types'}, ...getOptions(ASSET_TYPES)]}
      />
      <Select 
        id="filter-status"
        label="Status"
        value={filters.status || ''}
        onChange={(e) => handleSelectChange('status', e.target.value)}
        options={[{value: '', label: 'All statuses'}, ...getOptions(ASSET_STATUSES)]}
      />
      <Select 
        id="filter-condition"
        label="Condition"
        value={filters.condition || ''}
        onChange={(e) => handleSelectChange('condition', e.target.value)}
        options={[{value: '', label: 'All conditions'}, ...getOptions(ASSET_CONDITIONS)]}
      />
      <Select 
        id="filter-utilization"
        label="Utilization"
        value={filters.utilization || ''}
        onChange={(e) => handleSelectChange('utilization', e.target.value)}
        options={[
          {value: '', label: 'All'},
          {value: 'underutilized', label: 'Underutilized'},
          {value: 'normal', label: 'Normal'},
          {value: 'unknown', label: 'Unknown'}
        ]}
      />
      <Select 
        id="filter-has-coordinates"
        label="Coordinates"
        value={filters.hasCoordinates || ''}
        onChange={(e) => handleSelectChange('hasCoordinates', e.target.value)}
        options={[
          {value: '', label: 'All'},
          {value: 'true', label: 'Has Coordinates'},
          {value: 'false', label: 'Missing Coordinates'}
        ]}
      />
      <Select 
        id="filter-district"
        label="District"
        value={filters.district || ''}
        onChange={(e) => handleSelectChange('district', e.target.value)}
        options={[{value: '', label: 'All districts'}, ...(filterOptions?.districts || []).map(d => ({value: d, label: d}))]}
      />
      <Select 
        id="filter-taluka"
        label="Taluka"
        value={filters.taluka || ''}
        onChange={(e) => handleSelectChange('taluka', e.target.value)}
        options={[{value: '', label: 'All talukas'}, ...(filterOptions?.talukas || []).map(d => ({value: d, label: d}))]}
      />
      <Select 
        id="filter-department"
        label="Department"
        value={filters.department || ''}
        onChange={(e) => handleSelectChange('department', e.target.value)}
        options={[{value: '', label: 'All departments'}, ...(filterOptions?.departments || []).map(d => ({value: d, label: d}))]}
      />
      {isAdmin && (
        <Select 
          id="filter-officer"
          label="Assigned Officer"
          value={filters.assignedOfficerId || ''}
          onChange={(e) => handleSelectChange('assignedOfficerId', e.target.value)}
          options={[{value: '', label: 'All officers'}, ...(filterOptions?.officers || []).map(o => ({value: o.id, label: o.fullName}))]}
        />
      )}
    </div>
  );

  return (
    <div className="toolbar" style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px', position: 'relative' }}>
          <Input 
            id="search-assets"
            placeholder="Search by asset code, name, survey number or village"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '12px', color: 'var(--color-text-muted)' }} />
        </div>
        
        {isMobile ? (
          <Button variant="outline" onClick={() => setDrawerOpen(true)} icon={<Filter size={16} />}>
            Filters
          </Button>
        ) : (
          <div style={{ flex: 2 }}>
            {filterControls}
          </div>
        )}
      </div>

      {isMobile && (
        <>
          <div className={`filter-drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className={`filter-drawer ${drawerOpen ? 'open' : ''}`} ref={drawerRef} tabIndex="-1">
            <div className="filter-drawer-header">
              <h3>Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="filter-drawer-body">
              {filterControls}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
