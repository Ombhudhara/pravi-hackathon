import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, History, Activity, FileText } from 'lucide-react';
import { getGlobalEvents } from '../services/lifecycle';
import { getEventLabel, EVENT_TYPES } from '../config/labels';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';

export default function LifecycleHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Form states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [eventTypeStr, setEventTypeStr] = useState(searchParams.get('eventType') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGlobalEvents(Object.fromEntries(searchParams.entries()));
      setEvents(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    document.title = 'Lifecycle History | PropertyNexus';
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    
    if (eventTypeStr) newParams.set('eventType', eventTypeStr);
    else newParams.delete('eventType');
    
    if (dateFrom) newParams.set('dateFrom', dateFrom);
    else newParams.delete('dateFrom');
    
    if (dateTo) newParams.set('dateTo', dateTo);
    else newParams.delete('dateTo');
    
    if (district) newParams.set('district', district);
    else newParams.delete('district');
    
    newParams.set('page', '1');
    setSearchParams(newParams);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearch('');
    setEventTypeStr('');
    setDateFrom('');
    setDateTo('');
    setDistrict('');
    setSearchParams(new URLSearchParams());
    setIsFilterOpen(false);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit.toString());
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const tz = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';

  return (
    <div className="lifecycle-history-page">
      <div className="page-header">
        <div className="header-title-row">
          <h1 className="page-title"><History className="page-icon" size={24} /> Lifecycle History</h1>
        </div>
        {user.role === 'OFFICER' && (
          <p className="page-subtitle">Showing lifecycle events for assets assigned to you.</p>
        )}
      </div>

      <div className="card">
        <div className="card-header filter-bar-header">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search by asset code or name..."
                className="form-control"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="button button-secondary mobile-only" onClick={() => setIsFilterOpen(true)}>
              <Filter size={16} /> Filters
            </button>
            <button type="submit" className="button button-primary">Search</button>
          </form>
          <button type="button" className="button button-secondary desktop-only" onClick={() => setIsFilterOpen(true)}>
            <Filter size={16} /> Advanced Filters
          </button>
        </div>

        {error && <div className="alert alert-error m-4">{error}</div>}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event Type</th>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Description</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">Loading events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">No events found matching your criteria.</td>
                </tr>
              ) : (
                events.map(ev => {
                  const dateStr = new Intl.DateTimeFormat('en-IN', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ev.eventDate));
                  return (
                    <tr key={ev.id}>
                      <td className="whitespace-nowrap">{dateStr}</td>
                      <td>
                        <span className="badge badge-default">
                          <Activity size={12} className="mr-1" />
                          {getEventLabel(ev.eventType)}
                        </span>
                      </td>
                      <td>
                        <Link to={`/app/assets/${ev.assetId}?tab=lifecycle`} className="table-link monospace-code">
                          {ev.assetCode}
                        </Link>
                      </td>
                      <td>{ev.assetName}</td>
                      <td className="max-w-xs truncate" title={ev.description}>{ev.description}</td>
                      <td>{ev.performedBy ? ev.performedBy.fullName : 'System'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && events.length > 0 && (
          <div className="card-footer">
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <div className={`filter-drawer-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}></div>
      <div className={`filter-drawer ${isFilterOpen ? 'open' : ''}`}>
        <div className="filter-drawer-header">
          <h3>Filters</h3>
          <button className="modal-close" onClick={() => setIsFilterOpen(false)} aria-label="Close filters">×</button>
        </div>
        <div className="filter-drawer-body">
          <form id="filter-form" onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="form-group">
              <label>Event Types (comma separated)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. ALLOCATED, ACQUIRED"
                value={eventTypeStr} 
                onChange={e => setEventTypeStr(e.target.value)} 
              />
              <span className="help-text">Valid types: {Object.keys(EVENT_TYPES).join(', ')}</span>
            </div>
            
            <div className="form-group">
              <label>Date From</label>
              <input 
                type="date" 
                className="form-control" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label>Date To</label>
              <input 
                type="date" 
                className="form-control" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>District</label>
              <input 
                type="text" 
                className="form-control" 
                value={district} 
                onChange={e => setDistrict(e.target.value)} 
              />
            </div>
          </form>
        </div>
        <div className="modal-footer flex gap-2 p-4 border-t border-border">
          <button type="button" className="button button-secondary flex-1" onClick={clearFilters}>Clear All</button>
          <button type="submit" form="filter-form" className="button button-primary flex-1">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
