import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Building, Edit, Activity, Calendar, User, AlignLeft, Flag, Plus, CheckCircle2, History 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../hooks/useAsset';
import { useAssetEvents } from '../hooks/useAssetEvents';
import { useLifecycle } from '../hooks/useLifecycle';
import { getTypeLabel, getEventLabel, EVENT_TYPES } from '../config/labels';
import StatusBadge from '../components/StatusBadge';
import ConditionBadge from '../components/ConditionBadge';
import UtilizationCell from '../components/UtilizationCell';
import ConditionBreakdown from '../components/ConditionBreakdown';
import StatusChangeModal from '../components/StatusChangeModal';
import PriorityBadge from '../components/PriorityBadge';
import IssueStatusBadge from '../components/IssueStatusBadge';
import useInspections from '../hooks/useInspections';
import { formatDate } from '../utils/format';
import api from '../services/api';
import { changeAssetStatus } from '../services/assets';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'issues', label: 'Issues' },
  { id: 'lifecycle', label: 'Lifecycle' }
];

const ICONS = {
  'ACQUIRED': Building,
  'REGISTERED': CheckCircle2,
  'ALLOCATED': User,
  'RE_ALLOCATED': User,
  'STATUS_CHANGED': Activity,
  'INSPECTED': Activity,
  'ISSUE_REPORTED': Flag,
  'MAINTENANCE_STARTED': Activity,
  'MAINTENANCE_COMPLETED': CheckCircle2,
  'ISSUE_VERIFIED': CheckCircle2,
  'NOTE': AlignLeft
};

export default function AssetDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const previousListFilters = location.state?.fromList || '';

  const { asset, loading, error, refresh: refreshAsset } = useAsset(id);
  const { events, loading: eventsLoading, refresh: refreshEvents, addEvent } = useAssetEvents(id);
  const { lifecycle, loading: lifecycleLoading, refresh: refreshLifecycle } = useLifecycle(id);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const handleTabChange = (tabId) => {
    searchParams.set('tab', tabId);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true, state: location.state });
  };

  const handleStatusChange = () => {
    refreshAsset();
    refreshEvents();
    refreshLifecycle();
  };

  React.useEffect(() => {
    if (asset) {
      document.title = `${asset.assetCode} | PropertyNexus`;
    } else {
      document.title = 'Asset Details | PropertyNexus';
    }
  }, [asset]);

  if (loading) {
    return <div className="loading-state">Loading asset details...</div>;
  }

  if (error && error.status === 404) {
    return (
      <div className="error-state">
        <Activity className="error-icon" size={48} />
        <h2>Asset Not Found</h2>
        <p>The requested asset does not exist or you do not have permission to view it.</p>
        <Link to="/app/assets" className="button button-primary">Back to Inventory</Link>
      </div>
    );
  }

  if (error || !asset) {
    return <div className="error-state">Failed to load asset: {error?.message}</div>;
  }

  const canEdit = true;
  const canChangeStatus = true;
  const canAddEvent = true;

  return (
    <div className="asset-details-page">
      <div className="page-header">
        <div className="header-breadcrumbs">
          <Link to={`/app/assets${previousListFilters}`} className="breadcrumb-link">
            <ArrowLeft size={16} /> Asset Inventory
          </Link>
          <span className="dot-separator mx-2 text-muted">/</span>
          <span className="breadcrumb-current text-sm text-muted font-medium">{asset.assetCode}</span>
        </div>
        
        <div className="header-title-row">
          <div className="title-info">
            <h1 className="page-title">{asset.name}</h1>
            <div className="title-meta">
              <span className="monospace-code">{asset.assetCode}</span>
              <span className="dot-separator">•</span>
              <span className="type-label-text">{getTypeLabel(asset.type)}</span>
              <span className="dot-separator">•</span>
              <StatusBadge status={asset.status} />
              {asset.type !== 'LAND' && (
                <>
                  <span className="dot-separator">•</span>
                  <ConditionBadge condition={asset.condition} />
                </>
              )}
              {asset.isUnderutilized && (
                <>
                  <span className="dot-separator">•</span>
                  <span className="badge badge-warning">Underutilized</span>
                </>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            {canChangeStatus && (
              <button className="button button-secondary" onClick={() => setIsStatusModalOpen(true)}>
                Change Status
              </button>
            )}
            {canAddEvent && (
              <button className="button button-secondary" onClick={() => setIsEventModalOpen(true)}>
                Add Event
              </button>
            )}
            {canEdit && (
              <Link to={`/app/assets/${asset.id}/edit`} className="button button-primary">
                <Edit size={16} /> Edit Asset
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-list" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab asset={asset} />
        )}
        {activeTab === 'inspections' && (
          <InspectionsTab asset={asset} />
        )}
        {activeTab === 'issues' && (
          <IssuesTab asset={asset} />
        )}
        {activeTab === 'lifecycle' && (
          <LifecycleTab 
            asset={asset} 
            events={events} 
            lifecycle={lifecycle} 
            loading={eventsLoading || lifecycleLoading} 
          />
        )}
      </div>

      {isStatusModalOpen && (
        <StatusChangeModal
          isOpen={isStatusModalOpen}
          asset={asset}
          userRole={user?.role}
          onClose={() => setIsStatusModalOpen(false)}
          onConfirm={async (assetId, payload) => {
            await changeAssetStatus(assetId, payload);
            handleStatusChange();
          }}
        />
      )}

      {isEventModalOpen && (
        <AddEventModal
          assetId={asset.id}
          userRole={user.role}
          onClose={() => setIsEventModalOpen(false)}
          onSuccess={() => {
            setIsEventModalOpen(false);
            refreshEvents();
            refreshLifecycle();
          }}
          addEvent={addEvent}
        />
      )}
    </div>
  );
}

function OverviewTab({ asset }) {
  const tz = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(dateStr));
  };

  const formatSimpleDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Basic Details</h2>
        </div>
        <div className="card-body">
          <dl className="def-list">
            <div className="def-item">
              <dt>Asset Code</dt>
              <dd className="monospace-code">{asset.assetCode}</dd>
            </div>
            <div className="def-item">
              <dt>Name</dt>
              <dd>{asset.name}</dd>
            </div>
            <div className="def-item">
              <dt>Type</dt>
              <dd>{getTypeLabel(asset.type)}</dd>
            </div>
            <div className="def-item">
              <dt>Status</dt>
              <dd><StatusBadge status={asset.status} /></dd>
            </div>
            <div className="def-item full-width">
              <dt>Condition breakdown</dt>
              <dd>
                <ConditionBreakdown inspection={asset.latestInspection} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Location</h2>
        </div>
        <div className="card-body">
          <dl className="def-list">
            <div className="def-item">
              <dt>District</dt>
              <dd>{asset.district}</dd>
            </div>
            <div className="def-item">
              <dt>Taluka</dt>
              <dd>{asset.taluka || '-'}</dd>
            </div>
            <div className="def-item">
              <dt>Village</dt>
              <dd>{asset.village || '-'}</dd>
            </div>
            {asset.type === 'LAND' && (
              <div className="def-item">
                <dt>Survey Number</dt>
                <dd>{asset.survey_number || '-'}</dd>
              </div>
            )}
            <div className="def-item">
              <dt>Coordinates</dt>
              <dd>
                {(asset.latitude && asset.longitude) 
                  ? (
                    <div className="flex items-center gap-2">
                      <span>{asset.latitude}, {asset.longitude}</span>
                      <Link to={`/app/map?assetId=${asset.id}`} className="text-primary text-xs hover:underline flex items-center gap-1">
                        <MapPin size={12} /> View on map
                      </Link>
                    </div>
                  ) 
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Area and Utilization</h2>
        </div>
        <div className="card-body">
          <dl className="def-list">
            {asset.type === 'LAND' ? (
              <div className="def-item">
                <dt>Land Area (sq ft)</dt>
                <dd>{asset.land_area_sqft ? asset.land_area_sqft.toLocaleString() : '-'}</dd>
              </div>
            ) : (
              <div className="def-item">
                <dt>Built-up Area (sq ft)</dt>
                <dd>{asset.built_up_area_sqft ? asset.built_up_area_sqft.toLocaleString() : '-'}</dd>
              </div>
            )}
            <div className="def-item">
              <dt>Used Area (sq ft)</dt>
              <dd>{asset.used_area_sqft ? asset.used_area_sqft.toLocaleString() : '-'}</dd>
            </div>
            <div className="def-item full-width">
              <dt>Utilization</dt>
              <dd>
                {asset.utilizationPercent !== null ? (
                  <div className="utilization-bar-wrapper">
                    <div className="utilization-bar">
                      <div 
                        className={`utilization-fill ${asset.isUnderutilized ? 'warning' : 'normal'}`}
                        style={{ width: `${Math.min(asset.utilizationPercent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="utilization-text">
                      <span>{asset.utilizationPercent}% used</span>
                      <span className="utilization-threshold">(Threshold: {asset.isUnderutilized ? '<' : '>='} 40%)</span>
                    </div>
                  </div>
                ) : '-'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Assignment</h2>
        </div>
        <div className="card-body">
          <dl className="def-list">
            <div className="def-item">
              <dt>Department</dt>
              <dd>{asset.department || '-'}</dd>
            </div>
            <div className="def-item">
              <dt>Assigned Officer</dt>
              <dd>{asset.assignedOfficer ? asset.assignedOfficer.fullName : 'Unassigned'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Record Information</h2>
        </div>
        <div className="card-body">
          <dl className="def-list">
            <div className="def-item">
              <dt>Created By</dt>
              <dd>{asset.createdBy ? asset.createdBy.fullName : '-'}</dd>
            </div>
            <div className="def-item">
              <dt>Created At</dt>
              <dd>{formatDate(asset.created_at)}</dd>
            </div>
            <div className="def-item">
              <dt>Last Updated</dt>
              <dd>{formatDate(asset.updated_at)}</dd>
            </div>
            <div className="def-item">
              <dt>Last Inspection</dt>
              <dd>{formatSimpleDate(asset.lastInspectionAt)}</dd>
            </div>
            <div className="def-item">
              <dt>Open Issues</dt>
              <dd>{asset.openIssueCount !== null ? asset.openIssueCount : '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function LifecycleTab({ asset, events, lifecycle, loading }) {
  if (loading) {
    return <div className="loading-state">Loading lifecycle...</div>;
  }

  const { currentStage, stages } = lifecycle;

  // Group events by year
  const tz = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';
  const groupedEvents = {};
  
  events.forEach(event => {
    const d = new Date(event.eventDate);
    const year = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(d);
    if (!groupedEvents[year]) {
      groupedEvents[year] = [];
    }
    groupedEvents[year].push(event);
  });

  const sortedYears = Object.keys(groupedEvents).sort((a, b) => b - a);

  return (
    <div className="lifecycle-container">
      <div className="card stage-tracker-card">
        <div className="card-header">
          <h2 className="card-title">Current Stage: {currentStage}</h2>
        </div>
        <div className="card-body">
          <div className="stage-tracker">
            {stages.map((stage, idx) => {
              const Icon = stage.reached ? CheckCircle2 : Activity;
              return (
                <div key={stage.key} className={`stage-item ${stage.reached ? 'reached' : 'pending'} ${stage.label === currentStage ? 'current' : ''}`}>
                  <div className="stage-icon-wrapper">
                    <Icon size={16} />
                  </div>
                  <div className="stage-label">{stage.label}</div>
                  {idx < stages.length - 1 && <div className="stage-connector"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="timeline-section">
        <h3 className="timeline-title">Event Timeline</h3>
        {events.length === 0 ? (
          <div className="empty-state">No lifecycle events recorded for this asset.</div>
        ) : (
          <div className="timeline">
            {sortedYears.map(year => (
              <div key={year} className="timeline-year-group">
                <div className="timeline-year-label">{year}</div>
                <ol className="timeline-list">
                  {groupedEvents[year].map(event => {
                    const EventIcon = ICONS[event.eventType] || Activity;
                    const dateStr = new Intl.DateTimeFormat('en-IN', { timeZone: tz, day: 'numeric', month: 'short' }).format(new Date(event.eventDate));
                    return (
                      <li key={event.id} className="timeline-event" tabIndex="0">
                        <div className="timeline-event-date">{dateStr}</div>
                        <div className="timeline-event-icon">
                          <EventIcon size={16} />
                        </div>
                        <div className="timeline-event-content">
                          <div className="timeline-event-header">
                            <span className="timeline-event-type">{getEventLabel(event.eventType)}</span>
                            {event.performedBy && <span className="timeline-event-author">by {event.performedBy.fullName}</span>}
                          </div>
                          <div className="timeline-event-desc">{event.description}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddEventModal({ assetId, userRole, onClose, onSuccess, addEvent }) {
  const [eventType, setEventType] = useState(userRole === 'OFFICER' ? 'NOTE' : 'ACQUIRED');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const allowedTypes = userRole === 'OFFICER' ? ['NOTE'] : ['ACQUIRED', 'ALLOCATED', 'RE_ALLOCATED', 'NOTE'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.length < 3 || description.length > 500) {
      setError('Description must be between 3 and 500 characters');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await addEvent({ eventType, eventDate, description });
      setSuccessMsg('Event added successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-labelledby="add-event-title">
        <div className="modal-header">
          <h2 id="add-event-title">Add Lifecycle Event</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="alert alert-error" aria-live="assertive">{error}</div>}
          {successMsg && <div className="alert alert-success" aria-live="polite">{successMsg}</div>}
          
          <form id="add-event-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="eventType">Event Type *</label>
              <select 
                id="eventType" 
                className="form-control" 
                value={eventType} 
                onChange={e => setEventType(e.target.value)}
                disabled={userRole === 'OFFICER'}
              >
                {allowedTypes.map(t => (
                  <option key={t} value={t}>{EVENT_TYPES[t]}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="eventDate">Date *</label>
              <input 
                type="date" 
                id="eventDate" 
                className="form-control" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea 
                id="description" 
                className="form-control" 
                rows="3" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter event details..."
                required 
              />
              <div className="char-counter">{description.length}/500</div>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="add-event-form" className="button button-primary" disabled={submitting || successMsg}>
            {submitting ? 'Adding...' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InspectionsTab({ asset }) {
  const { inspections, loading, error, refresh } = useInspections({ assetId: asset.id }, 1, 100);
  const navigate = useNavigate();

  return (
    <div className="tab-pane">
      <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="pane-title" style={{ margin: 0 }}>Inspections</h2>
        <button 
          className="button button-primary"
          onClick={() => navigate(`/app/assets/${asset.id}/inspect`)}
        >
          <Plus size={16} /> New Inspection
        </button>
      </div>

      {error ? (
        <div className="error-state">Failed to load inspections. <button onClick={refresh} className="button button-secondary" style={{ marginTop: '1rem' }}>Retry</button></div>
      ) : loading ? (
        <div className="loading-state">Loading inspections...</div>
      ) : inspections.length === 0 ? (
        <div className="empty-state">
          <p className="text-muted">No inspections have been recorded for this asset yet.</p>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Inspector</th>
                <th>Overall Condition</th>
                <th>Attachments</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(insp => (
                <tr key={insp.id} onClick={() => navigate(`/app/inspections/${insp.id}`)} style={{ cursor: 'pointer' }} className="stacked-card-row">
                  <td data-label="Date" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    {formatDate(insp.inspectedAt)}
                  </td>
                  <td data-label="Inspector">{insp.inspectorName}</td>
                  <td data-label="Overall Condition"><ConditionBadge condition={insp.overallCondition} /></td>
                  <td data-label="Attachments">{insp.attachmentCount}</td>
                  <td data-label="Issues">{insp.issueCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IssuesTab({ asset }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get(`/assets/${asset.id}/issues`);
        setIssues(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch issues', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [asset.id]);

  const canReportIssue = true;

  if (loading) {
    return <div className="p-4 text-center">Loading issues...</div>;
  }

  return (
    <div className="tab-pane active">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Maintenance Issues</h2>
        {canReportIssue && (
          <button 
            className="button button-primary"
            onClick={() => navigate(`/app/maintenance/new?assetId=${asset.id}`)}
          >
            <Plus size={16} /> Report issue
          </button>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <p>No maintenance issues reported for this asset.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Issue Code</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(issue => (
                <tr key={issue.id} onClick={() => navigate(`/app/maintenance/${issue.id}`)} style={{ cursor: 'pointer' }} className="stacked-card-row">
                  <td data-label="Issue Code" className="font-mono text-primary font-medium">{issue.issueCode}</td>
                  <td data-label="Title">{issue.title}</td>
                  <td data-label="Priority"><PriorityBadge priority={issue.priority} /></td>
                  <td data-label="Status"><IssueStatusBadge status={issue.status} /></td>
                  <td data-label="Date">{formatDate(issue.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
