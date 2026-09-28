import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { 
  Building, Map, AlertTriangle, CheckCircle, 
  RefreshCw, ClipboardCheck, Wrench, Home, Briefcase
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import useDashboard from '../hooks/useDashboard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';

// Simple Stat Card
const StatCard = ({ title, value, icon, helperText, alert }) => (
  <Card className={`stat-card ${alert ? 'stat-card-alert' : ''}`}>
    <div className="stat-card-header">
      <h3 className="stat-card-title">{title}</h3>
      <div className="stat-card-icon">{icon}</div>
    </div>
    <div className="stat-card-value">{value !== undefined ? value : '-'}</div>
    {helperText && <div className="stat-card-helper">{helperText}</div>}
  </Card>
);

// Chart wrapper with table toggle
const ChartCard = ({ title, data, dataKey, nameKey, color, children }) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        <button 
          className="chart-toggle" 
          onClick={() => setShowTable(!showTable)}
          aria-pressed={showTable}
        >
          {showTable ? 'View as Chart' : 'View as Table'}
        </button>
      </div>
      <div className="chart-card-content">
        {showTable ? (
          <div className="chart-table-container">
            <table className="chart-table">
              <thead>
                <tr>
                  <th>{nameKey}</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td>{item[nameKey]}</td>
                    <td>{item[dataKey]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDashboard();

  const isMaintenance = user?.role === 'MAINTENANCE';

  if (loading) {
    return (
      <div aria-live="polite">
        <PageHeader title="Dashboard" />
        <div className="loading-state">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="error-state">
          <AlertTriangle size={24} className="error-icon" />
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <Button onClick={refresh} variant="primary" icon={<RefreshCw size={16} />}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { assets, issues, underutilized, generatedAt } = data;
  
  const lastUpdated = new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // CSS variables for charts
  const colors = {
    primary: 'var(--color-primary)',
    green: 'var(--color-status-green)',
    amber: 'var(--color-status-amber)',
    red: 'var(--color-status-red)',
    neutral: 'var(--color-text-muted)'
  };

  const getCountByType = (type) => assets?.byType?.find(t => t.type === type)?.count || 0;
  const getCountByStatus = (status) => assets?.byStatus?.find(s => s.status === status)?.count || 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-row">
        <PageHeader 
          title="Dashboard" 
          description="Overview of system activity and key metrics."
        />
        <div className="dashboard-actions">
          <span className="last-updated">Last updated: {lastUpdated}</span>
          <Button variant="outline" onClick={refresh} icon={<RefreshCw size={16} />}>
            Refresh
          </Button>
        </div>
      </div>

      {!isMaintenance && assets && assets.total === 0 ? (
        <div className="empty-state">
          <Building size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No assets recorded yet.</h3>
          <p className="empty-state-description">Get started by adding property records to the system.</p>
          {user?.role === 'ADMIN' && (
            <Link to="/app/assets">
              <Button variant="primary">Manage Assets</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Asset Stats - Hidden for Maintenance */}
          {!isMaintenance && assets && (
            <>
              <div className="dashboard-grid stats-grid">
                <StatCard title="Total Assets" value={assets.total} icon={<Building size={20} />} />
                <StatCard title="Land Parcels" value={getCountByType('LAND')} icon={<Map size={20} />} />
                <StatCard title="Buildings" value={getCountByType('BUILDING')} icon={<Home size={20} />} />
                <StatCard title="Schools" value={getCountByType('SCHOOL')} icon={<Briefcase size={20} />} />
                <StatCard title="PHCs" value={getCountByType('PHC')} icon={<ClipboardCheck size={20} />} />
              </div>
              <div className="dashboard-grid stats-grid" style={{ marginTop: 'var(--space-6)' }}>
                <StatCard title="Active" value={getCountByStatus('ACTIVE')} icon={<CheckCircle size={20} />} />
                <StatCard title="Vacant" value={getCountByStatus('VACANT')} icon={<AlertTriangle size={20} />} />
                <StatCard title="Under Maintenance" value={getCountByStatus('UNDER_MAINTENANCE')} icon={<Wrench size={20} />} />
                <StatCard 
                  title="Flagged for administrative review" 
                  value={assets.underutilizedCount} 
                  icon={<AlertTriangle size={20} />}
                  helperText="Below configured threshold on active assets"
                  alert={assets.underutilizedCount > 0}
                />
              </div>

              <div className="dashboard-grid charts-grid" style={{ marginTop: 'var(--space-8)' }}>
                <ChartCard title="Assets by Type" data={assets.byType} dataKey="count" nameKey="type">
                  <BarChart data={assets.byType} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{fill: 'var(--color-bg-subtle)'}} />
                    <Bar dataKey="count" fill={colors.primary} isAnimationActive={false}>
                      <LabelList dataKey="count" position="right" style={{ fill: colors.neutral, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ChartCard>

                <ChartCard title="Assets by District (Top 10)" data={assets.byDistrict} dataKey="count" nameKey="district">
                  <BarChart data={assets.byDistrict} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="district" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{fill: 'var(--color-bg-subtle)'}} />
                    <Bar dataKey="count" fill={colors.primary} isAnimationActive={false}>
                      <LabelList dataKey="count" position="right" style={{ fill: colors.neutral, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ChartCard>

                <ChartCard title="Asset Status" data={assets.byStatus} dataKey="count" nameKey="status">
                  <BarChart data={assets.byStatus} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip cursor={{fill: 'var(--color-bg-subtle)'}} />
                    <Bar dataKey="count" fill={colors.amber} isAnimationActive={false}>
                      <LabelList dataKey="count" position="top" style={{ fill: colors.neutral, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ChartCard>

                <ChartCard title="Asset Condition" data={assets.byCondition} dataKey="count" nameKey="condition">
                  <BarChart data={assets.byCondition} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="condition" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip cursor={{fill: 'var(--color-bg-subtle)'}} />
                    <Bar dataKey="count" fill={colors.primary} isAnimationActive={false}>
                      <LabelList dataKey="count" position="top" style={{ fill: colors.neutral, fontSize: 12 }} />
                    </Bar>
                  </BarChart>
                </ChartCard>
              </div>
            </>
          )}

          {/* Issues Section - Visible to all */}
          <div className="section-title-row" style={{ marginTop: 'var(--space-10)', marginBottom: 'var(--space-6)' }}>
            <h2>Maintenance Issues</h2>
          </div>

          {isMaintenance && (
            <div className="dashboard-grid stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
              <StatCard title="Total Assigned Issues" value={issues.total} icon={<Wrench size={20} />} />
              <StatCard title="Open" value={issues.byStatus.find(s => s.status === 'OPEN')?.count || 0} icon={<AlertTriangle size={20} />} />
              <StatCard title="In Progress" value={issues.byStatus.find(s => s.status === 'IN_PROGRESS')?.count || 0} icon={<RefreshCw size={20} />} />
              <StatCard title="Resolved" value={issues.byStatus.find(s => s.status === 'RESOLVED')?.count || 0} icon={<CheckCircle size={20} />} />
            </div>
          )}

          <div className="dashboard-grid" style={{ gridTemplateColumns: isMaintenance ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <ChartCard title="Issues by Status" data={issues.byStatus} dataKey="count" nameKey="status">
              <BarChart data={issues.byStatus} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip cursor={{fill: 'var(--color-bg-subtle)'}} />
                <Bar dataKey="count" fill={colors.red} isAnimationActive={false}>
                  <LabelList dataKey="count" position="top" style={{ fill: colors.neutral, fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ChartCard>

            <Card>
              <div className="card-header">
                <h3>Open High Priority Issues</h3>
              </div>
              <div className="card-content" style={{ padding: 0 }}>
                {issues.openHighPriority.length === 0 ? (
                  <div className="empty-list">No open high priority issues.</div>
                ) : (
                  <div className="list-group">
                    {issues.openHighPriority.map(issue => (
                      <Link to="/app/maintenance" key={issue.id} className="list-item">
                        <div className="list-item-main">
                          <span className="text-mono">{issue.issueCode}</span>
                          <span className="list-item-title">{issue.title}</span>
                          <span className="list-item-subtitle">{issue.assetCode} - {issue.assetName}</span>
                        </div>
                        <div className="list-item-side">
                          <Badge variant="red">{issue.priority}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Underutilized Assets - Hidden for Maintenance */}
          {!isMaintenance && (
            <>
              <div className="section-title-row" style={{ marginTop: 'var(--space-10)', marginBottom: 'var(--space-6)' }}>
                <h2>Assets flagged for administrative review (lowest 10)</h2>
              </div>
              <Card>
                <div className="card-content" style={{ padding: 0, overflowX: 'auto' }}>
                  {underutilized.length === 0 ? (
                    <div className="empty-list">No assets flagged for administrative review.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Asset Code</th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>District</th>
                          <th>Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {underutilized.map(asset => (
                          <tr key={asset.assetId}>
                            <td>
                              <Link to={`/app/assets/${asset.assetId}`} className="text-mono table-link">
                                {asset.assetCode}
                              </Link>
                            </td>
                            <td>{asset.name}</td>
                            <td>{asset.type}</td>
                            <td>{asset.district}</td>
                            <td>
                              <Badge variant="amber">{asset.utilizationPercent}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
