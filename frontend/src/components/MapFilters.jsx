import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EVENT_TYPES } from '../config/labels';

export default function MapFilters({ isOpen, onClose }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Similar state as other filters
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [type, setType] = React.useState(searchParams.get('type') || '');
  const [status, setStatus] = React.useState(searchParams.get('status') || '');
  const [condition, setCondition] = React.useState(searchParams.get('condition') || '');
  const [district, setDistrict] = React.useState(searchParams.get('district') || '');
  const [taluka, setTaluka] = React.useState(searchParams.get('taluka') || '');
  const [department, setDepartment] = React.useState(searchParams.get('department') || '');
  const [utilization, setUtilization] = React.useState(searchParams.get('utilization') || '');

  const applyFilters = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    
    if (search) newParams.set('search', search); else newParams.delete('search');
    if (type) newParams.set('type', type); else newParams.delete('type');
    if (status) newParams.set('status', status); else newParams.delete('status');
    if (condition) newParams.set('condition', condition); else newParams.delete('condition');
    if (district) newParams.set('district', district); else newParams.delete('district');
    if (taluka) newParams.set('taluka', taluka); else newParams.delete('taluka');
    if (department) newParams.set('department', department); else newParams.delete('department');
    if (utilization) newParams.set('utilization', utilization); else newParams.delete('utilization');
    
    setSearchParams(newParams);
    if (onClose) onClose();
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
    setCondition('');
    setDistrict('');
    setTaluka('');
    setDepartment('');
    setUtilization('');
    setSearchParams(new URLSearchParams());
    if (onClose) onClose();
  };

  return (
    <div className={`filter-drawer ${isOpen ? 'open' : ''}`}>
      <div className="filter-drawer-header">
        <h3>Map Filters</h3>
        {onClose && <button className="modal-close" onClick={onClose} aria-label="Close filters">×</button>}
      </div>
      <div className="filter-drawer-body">
        <form id="map-filter-form" onSubmit={applyFilters} className="flex flex-col gap-4">
          <div className="form-group">
            <label>Search</label>
            <input type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Code, Name, Village..." />
          </div>
          <div className="form-group">
            <label>Type</label>
            <input type="text" className="form-control" value={type} onChange={e => setType(e.target.value)} placeholder="e.g. LAND, BUILDING" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <input type="text" className="form-control" value={status} onChange={e => setStatus(e.target.value)} placeholder="e.g. ACTIVE" />
          </div>
          <div className="form-group">
            <label>Condition</label>
            <input type="text" className="form-control" value={condition} onChange={e => setCondition(e.target.value)} />
          </div>
          <div className="form-group">
            <label>District</label>
            <input type="text" className="form-control" value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Taluka</label>
            <input type="text" className="form-control" value={taluka} onChange={e => setTaluka(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input type="text" className="form-control" value={department} onChange={e => setDepartment(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Utilization</label>
            <select className="form-control" value={utilization} onChange={e => setUtilization(e.target.value)}>
              <option value="">All</option>
              <option value="underutilized">Underutilized</option>
              <option value="normal">Normal</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </form>
      </div>
      <div className="modal-footer flex gap-2 p-4 border-t border-border">
        <button type="button" className="button button-secondary flex-1" onClick={clearFilters}>Clear</button>
        <button type="submit" form="map-filter-form" className="button button-primary flex-1">Apply</button>
      </div>
    </div>
  );
}
