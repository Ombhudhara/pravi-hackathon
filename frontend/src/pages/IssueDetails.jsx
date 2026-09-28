import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, CheckCircle, Play, UserPlus, XCircle, ArrowLeft, Download, Edit } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import PriorityBadge from '../components/PriorityBadge';
import IssueStatusBadge from '../components/IssueStatusBadge';
import Lightbox from '../components/Lightbox';
import FileDropzone from '../components/FileDropzone';
import { useAuth } from '../contexts/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import api from '../services/api';
import { formatDateTime } from '../utils/format';

export default function IssueDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  
  useDocumentTitle(issue ? `${issue.issueCode} | Maintenance` : 'Maintenance');

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
    if (user.role === 'ADMIN') {
      api.get('/issues/assignees')
        .then(res => {
          setDepartments(res.data.data.departments || []);
          setUsers(res.data.data.users || []);
        })
        .catch(console.error);
    }
  }, [id, user.role]);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  const [assignDept, setAssignDept] = useState('');
  const [assignUser, setAssignUser] = useState('');
  
  const [resolveNote, setResolveNote] = useState('');
  const [resolveEvidence, setResolveEvidence] = useState([]);
  
  const [rejectNote, setRejectNote] = useState('');

  const [showModal, setShowModal] = useState('');

  const handleAction = async (actionType) => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      const formData = new FormData();
      
      if (actionType === 'ASSIGN') {
        formData.append('toStatus', 'ASSIGNED');
        if (assignDept) formData.append('assignedDepartment', assignDept);
        if (assignUser) formData.append('assignedTo', assignUser);
      } else if (actionType === 'START') {
        formData.append('toStatus', 'IN_PROGRESS');
      } else if (actionType === 'RESOLVE') {
        if (resolveNote.length < 10) {
          throw new Error('Resolution note must be at least 10 characters.');
        }
        // Check if evidence is provided OR already exists
        const existingEvidence = issue.attachments.filter(a => a.category === 'COMPLETION_EVIDENCE');
        if (resolveEvidence.length === 0 && existingEvidence.length === 0) {
          throw new Error('At least one completion evidence photo is required.');
        }
        formData.append('toStatus', 'RESOLVED');
        formData.append('note', resolveNote);
        resolveEvidence.forEach(f => formData.append('evidence', f));
      } else if (actionType === 'VERIFY') {
        formData.append('toStatus', 'VERIFIED');
      } else if (actionType === 'REJECT') {
        if (!rejectNote) {
          throw new Error('Note is required to reject the repair.');
        }
        formData.append('toStatus', 'IN_PROGRESS');
        formData.append('note', rejectNote);
      }

      await api.post(`/issues/${id}/transition`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh issue
      setShowModal('');
      setResolveNote('');
      setResolveEvidence([]);
      setRejectNote('');
      await fetchIssue();
    } catch (err) {
      if (err.response?.status === 409) {
        setActionError('The issue was updated by someone else. Refreshing...');
        setTimeout(() => {
          setShowModal('');
          fetchIssue();
        }, 2000);
      } else {
        setActionError(err.message || err.response?.data?.message || 'Failed to perform action');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (attachmentId, originalName) => {
    try {
      const res = await api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (loading) return <div className="page-container"><p>Loading issue details...</p></div>;
  if (error || !issue) return <div className="page-container"><div className="error-alert"><AlertCircle /><span>{error || 'Issue not found'}</span></div><Link to="/app/maintenance" className="mt-4 inline-block text-primary">← Back to issues</Link></div>;

  const photos = issue.attachments.filter(a => a.category === 'PHOTO');
  const evidence = issue.attachments.filter(a => a.category === 'COMPLETION_EVIDENCE');

  const steps = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];
  const currentIndex = steps.indexOf(issue.status);

  return (
    <div className="page-container max-w-4xl">
      <Link to="/app/maintenance" className="back-link mb-4 inline-flex items-center gap-1 text-primary hover-underline">
        <ArrowLeft size={16} /> Back to Maintenance
      </Link>
      
      <div className="issue-header flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono font-bold text-xl">{issue.issueCode}</span>
            <PriorityBadge priority={issue.priority} />
            <IssueStatusBadge status={issue.status} />
          </div>
          <h1 className="text-2xl font-bold mb-2">{issue.title}</h1>
          <p className="text-muted">
            Reported by {issue.reportedByName} on {formatDateTime(issue.createdAt)}
          </p>
        </div>
        
        <div className="header-actions">
          {(user.role === 'ADMIN' || (user.role === 'OFFICER' && issue.status === 'OPEN')) && (
            <Button variant="outline" icon={Edit} onClick={() => navigate(`/app/maintenance/${id}/edit`)}>
              Edit Issue
            </Button>
          )}
        </div>
      </div>

      <div className="step-indicator mb-8">
        <div className="step-progress-bar">
          <div 
            className="step-progress-fill" 
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        <div className="step-nodes flex justify-between relative z-10">
          {['Open', 'Assigned', 'In progress', 'Resolved', 'Verified'].map((label, idx) => (
            <div key={label} className={`step-node flex flex-col items-center ${idx <= currentIndex ? 'completed' : ''} ${idx === currentIndex ? 'current' : ''}`}>
              <div className="step-dot mb-2 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border text-border">
                {idx < currentIndex ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <span className="text-sm font-medium text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Details">
            <dl className="details-list">
              <div className="details-row">
                <dt>Asset</dt>
                <dd><Link to={`/app/assets/${issue.assetId}`} className="text-primary hover-underline">{issue.assetCode} - {issue.assetName}</Link></dd>
              </div>
              <div className="details-row">
                <dt>Asset Type</dt>
                <dd>{issue.assetType}</dd>
              </div>
              <div className="details-row">
                <dt>Description</dt>
                <dd>{issue.description || <span className="text-muted">No description provided</span>}</dd>
              </div>
              {issue.inspectionId && (
                <div className="details-row">
                  <dt>Linked Inspection</dt>
                  <dd><Link to={`/app/inspections/${issue.inspectionId}`} className="text-primary hover-underline">View Inspection Report</Link></dd>
                </div>
              )}
            </dl>
          </Card>

          {photos.length > 0 && (
            <Card title="Issue Photos">
              <div className="gallery-grid">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="gallery-item" onClick={() => setActivePhotoIndex(index)}>
                    <img src={`/api/attachments/${photo.id}/download?inline=1`} alt="Issue photo" className="gallery-img" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {evidence.length > 0 && (
            <Card title="Completion Evidence">
              <div className="gallery-grid">
                {evidence.map((photo, index) => (
                  <div key={photo.id} className="gallery-item" onClick={() => setActivePhotoIndex(photos.length + index)}>
                    <img src={`/api/attachments/${photo.id}/download?inline=1`} alt="Evidence" className="gallery-img" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="History">
            <div className="history-list space-y-4">
              {issue.history.map(item => (
                <div key={item.id} className="history-item flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="history-icon mt-1 text-muted">
                    <HistoryIcon status={item.toStatus} />
                  </div>
                  <div>
                    <p className="font-medium">
                      Status changed to <IssueStatusBadge status={item.toStatus} /> by {item.changedByName}
                    </p>
                    <p className="text-sm text-muted mb-1">{formatDateTime(item.createdAt)}</p>
                    {item.note && (
                      <div className="bg-background p-3 rounded-md text-sm mt-2 border border-border">
                        {item.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Assignment">
            <dl className="details-list">
              <div className="details-row flex-col items-start gap-1">
                <dt className="w-full text-muted">Department</dt>
                <dd className="w-full font-medium">{issue.assignedDepartment || 'Unassigned'}</dd>
              </div>
              <div className="details-row flex-col items-start gap-1">
                <dt className="w-full text-muted">Assignee</dt>
                <dd className="w-full font-medium">{issue.assignedToName || 'Unassigned'}</dd>
              </div>
            </dl>
          </Card>

          <ActionPanel 
            issue={issue} 
            user={user} 
            onShowModal={setShowModal}
          />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="modal-header">
              <h2 className="text-lg font-bold">
                {showModal === 'ASSIGN' && 'Assign Issue'}
                {showModal === 'START' && 'Start Work'}
                {showModal === 'RESOLVE' && 'Mark as Resolved'}
                {showModal === 'VERIFY' && 'Verify Repair'}
                {showModal === 'REJECT' && 'Reject Repair'}
              </h2>
              <button className="icon-btn" onClick={() => !actionLoading && setShowModal('')}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body p-4 space-y-4">
              {actionError && (
                <div className="error-alert mb-4">
                  <AlertCircle size={20} />
                  <span>{actionError}</span>
                </div>
              )}

              {showModal === 'ASSIGN' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={assignDept} onChange={e => setAssignDept(e.target.value)}>
                      <option value="">Select department...</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee (Optional)</label>
                    <select className="form-select" value={assignUser} onChange={e => setAssignUser(e.target.value)}>
                      <option value="">Select assignee...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                </>
              )}

              {showModal === 'START' && (
                <p>Are you sure you want to start work on this issue? The asset status will be set to Under maintenance.</p>
              )}

              {showModal === 'VERIFY' && (
                <p>Confirm that the maintenance issue has been properly resolved.</p>
              )}

              {showModal === 'RESOLVE' && (
                <>
                  <div className="form-group">
                    <label className="form-label required">Resolution Note</label>
                    <textarea 
                      className="form-textarea" 
                      rows={3} 
                      value={resolveNote} 
                      onChange={e => setResolveNote(e.target.value)}
                      placeholder="Describe the work done..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Completion Evidence Photos</label>
                    <FileDropzone 
                      onFilesSelected={setResolveEvidence}
                      maxFiles={5}
                      accept="image/*"
                      maxSizeMB={5}
                    />
                  </div>
                </>
              )}

              {showModal === 'REJECT' && (
                <div className="form-group">
                  <label className="form-label required">Reason for Rejection</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    value={rejectNote} 
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Why is this repair being rejected?"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowModal('')} disabled={actionLoading}>Cancel</Button>
              <Button onClick={() => handleAction(showModal)} isLoading={actionLoading}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {activePhotoIndex !== null && (
        <Lightbox 
          images={[...photos, ...evidence].map(p => ({
            id: p.id,
            url: `/api/attachments/${p.id}/download?inline=1`,
            caption: p.originalName
          }))}
          initialIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
        />
      )}
    </div>
  );
}

function HistoryIcon({ status }) {
  if (status === 'OPEN') return <AlertCircle size={20} />;
  if (status === 'ASSIGNED') return <UserPlus size={20} />;
  if (status === 'IN_PROGRESS') return <Play size={20} />;
  if (status === 'RESOLVED') return <CheckCircle size={20} />;
  if (status === 'VERIFIED') return <CheckCircle size={20} className="text-green-600" />;
  return <FileText size={20} />;
}

function ActionPanel({ issue, user, onShowModal }) {
  const isAdmin = user.role === 'ADMIN';
  const isAssigned = user.role === 'MAINTENANCE' && (issue.assignedTo === user.id || (!issue.assignedTo && issue.assignedDepartment === user.department));
  const isAssetOfficer = user.role === 'OFFICER'; // Validated at page level

  const actions = [];

  if (issue.status === 'VERIFIED') return null; // Terminal state

  // ADMIN sees all available forward actions at every stage
  if (isAdmin) {
    if (issue.status === 'OPEN') {
      actions.push({ id: 'ASSIGN', label: 'Assign Issue', icon: UserPlus, primary: true });
      actions.push({ id: 'START', label: 'Start Work (Skip Assign)', icon: Play, primary: false });
    }
    if (issue.status === 'ASSIGNED') {
      actions.push({ id: 'START', label: 'Start Work', icon: Play, primary: true });
      actions.push({ id: 'RESOLVE', label: 'Mark as Resolved', icon: CheckCircle, primary: false });
    }
    if (issue.status === 'IN_PROGRESS') {
      actions.push({ id: 'RESOLVE', label: 'Mark as Resolved', icon: CheckCircle, primary: true });
    }
    if (issue.status === 'RESOLVED') {
      actions.push({ id: 'VERIFY', label: 'Verify Repair', icon: CheckCircle, primary: true });
      actions.push({ id: 'REJECT', label: 'Reject Repair', icon: XCircle, primary: false });
    }
  } else {
    // Non-admin roles — original restricted logic
    if (issue.status === 'ASSIGNED' && isAssigned) {
      actions.push({ id: 'START', label: 'Start Work', icon: Play, primary: true });
    }
    if (issue.status === 'IN_PROGRESS' && isAssigned) {
      actions.push({ id: 'RESOLVE', label: 'Mark as Resolved', icon: CheckCircle, primary: true });
    }
    if (issue.status === 'RESOLVED' && isAssetOfficer) {
      actions.push({ id: 'VERIFY', label: 'Verify Repair', icon: CheckCircle, primary: true });
      actions.push({ id: 'REJECT', label: 'Reject Repair', icon: XCircle, primary: false });
    }
  }

  if (actions.length === 0) return null;

  return (
    <Card title="Actions" className="bg-background">
      <div className="flex flex-col gap-3">
        {actions.map(action => (
          <Button 
            key={action.id} 
            variant={action.primary ? 'primary' : 'outline'} 
            icon={action.icon}
            onClick={() => onShowModal(action.id)}
            className="w-full justify-center"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
