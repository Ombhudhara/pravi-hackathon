import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import PriorityBadge from '../components/PriorityBadge';
import IssueStatusBadge from '../components/IssueStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import api from '../services/api';
import { formatDate } from '../utils/format';

export default function MaintenanceList() {
  useDocumentTitle('Maintenance');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [issues, setIssues] = useState([]);
  const [statusCounts, setStatusCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Filters
  const currentTab = searchParams.get('status') || 'ALL';
  const searchTerm = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || '');
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get('assignedTo') || '');

  // Options
  const [assignees, setAssignees] = useState({ users: [], departments: [] });

  useEffect(() => {
    if (user.role === 'ADMIN') {
      api.get('/issues/assignees')
        .then(res => setAssignees(res.data))
        .catch(console.error);
    }
  }, [user.role]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (currentTab !== 'ALL') params.set('status', currentTab);
      if (searchTerm) params.set('search', searchTerm);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (departmentFilter) params.set('department', departmentFilter);
      if (assigneeFilter) params.set('assignedTo', assigneeFilter);
      params.set('page', page);

      const res = await api.get(`/issues?${params.toString()}`);
      setIssues(res.data.items);
      setPagination(res.data.pagination);
      setStatusCounts(res.data.statusCounts);
    } catch (err) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [currentTab, searchTerm, page, priorityFilter, departmentFilter, assigneeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get('search');
    
    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleTabChange = (status) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'ALL') newParams.delete('status');
    else newParams.set('status', status);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    if (priorityFilter) newParams.set('priority', priorityFilter);
    else newParams.delete('priority');
    
    if (departmentFilter) newParams.set('department', departmentFilter);
    else newParams.delete('department');
    
    if (assigneeFilter) newParams.set('assignedTo', assigneeFilter);
    else newParams.delete('assignedTo');
    
    newParams.set('page', '1');
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPriorityFilter('');
    setDepartmentFilter('');
    setAssigneeFilter('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('priority');
    newParams.delete('department');
    newParams.delete('assignedTo');
    newParams.set('page', '1');
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const tabs = [
    { id: 'ALL', label: 'All' },
    { id: 'OPEN', label: 'Open' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'IN_PROGRESS', label: 'In progress' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'VERIFIED', label: 'Verified' }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Maintenance" 
        description="Track and manage property maintenance issues."
      >
        <Button icon={Plus} onClick={() => navigate('/app/maintenance/new')}>
          Report issue
        </Button>
      </PageHeader>

      <div className="status-tabs-container">
        <div className="status-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`status-tab ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {statusCounts && (
                <span className="status-tab-count">{statusCounts[tab.id] || 0}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Card className="toolbar-card">
        <div className="toolbar">
          <form className="search-form" onSubmit={handleSearch}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              name="search"
              placeholder="Search by issue code, title, or asset..." 
              className="search-input"
              defaultValue={searchTerm}
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          
          <Button 
            variant="outline" 
            icon={Filter} 
            onClick={() => setShowFilters(!showFilters)}
            className={priorityFilter || departmentFilter || assigneeFilter ? 'btn-active' : ''}
          >
            Filters {(priorityFilter || departmentFilter || assigneeFilter) ? '(Active)' : ''}
          </Button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {user.role === 'ADMIN' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                      <option value="">All Departments</option>
                      {assignees.departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
                      <option value="">All Assignees</option>
                      <option value="UNASSIGNED">Unassigned</option>
                      {assignees.users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.department})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="filters-actions">
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card noPadding>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue Code</th>
                <th>Title</th>
                <th>Asset Code</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Department</th>
                <th>Assignee</th>
                <th>Age (Days)</th>
                <th>Reported Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">Loading issues...</td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted">
                    No issues found matching your criteria.
                  </td>
                </tr>
              ) : (
                issues.map(issue => (
                  <tr key={issue.id}>
                    <td>
                      <Link to={`/app/maintenance/${issue.id}`} className="text-primary font-mono font-medium">
                        {issue.issueCode}
                      </Link>
                    </td>
                    <td>{issue.title}</td>
                    <td>
                      <Link to={`/app/assets/${issue.assetId}`} className="text-primary hover-underline">
                        {issue.assetCode}
                      </Link>
                    </td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td><IssueStatusBadge status={issue.status} /></td>
                    <td>{issue.assignedDepartment || '-'}</td>
                    <td>{issue.assignedTo ? issue.assignedTo.fullName : '-'}</td>
                    <td>{issue.ageInDays}</td>
                    <td>{formatDate(issue.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="pagination-controls">
              <Button 
                variant="outline" 
                disabled={pagination.page <= 1}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', pagination.page - 1);
                  setSearchParams(p);
                }}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', pagination.page + 1);
                  setSearchParams(p);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
