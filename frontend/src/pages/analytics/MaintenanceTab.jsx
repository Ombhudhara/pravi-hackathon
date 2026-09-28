import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useMaintenanceAnalytics } from '../../hooks/useAnalytics';
import SummaryCard from '../../components/SummaryCard';
import ChartCard from '../../components/ChartCard';
import ExportButton from '../../components/ExportButton';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
};

const STATUS_COLORS = {
  OPEN:        'var(--color-primary)',
  ASSIGNED:    'var(--color-status-teal)',
  IN_PROGRESS: 'var(--color-status-amber)',
  RESOLVED:    'var(--color-status-green)',
  VERIFIED:    'var(--color-status-green)',
};

const PRIORITY_COLORS = {
  LOW:      'var(--color-text-muted)',
  MEDIUM:   'var(--color-status-teal)',
  HIGH:     'var(--color-status-amber)',
  CRITICAL: 'var(--color-status-red)',
};

export default function MaintenanceTab({ filters, filterParams }) {
  const params = { ...filterParams };
  const { data, loading, error, refresh } = useMaintenanceAnalytics(params);

  if (loading) return <p className="analytics-loading" aria-live="polite">Loading maintenance data...</p>;
  if (error)   return <div className="analytics-error" role="alert">{error} <button className="btn-link" onClick={refresh}>Retry</button></div>;
  if (!data)   return null;

  const { summary, monthlyTrend, byStatus, byPriority, byDepartment, agingBuckets, oldestUnresolved, generatedAt } = data;

  return (
    <div className="analytics-tab-content">
      <div className="analytics-section-header">
        <p className="analytics-last-updated">Last updated: {formatDate(generatedAt)}</p>
        <button className="btn btn-outline btn-sm" onClick={refresh} aria-label="Refresh maintenance data">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="analytics-summary-grid">
        <SummaryCard title="Open issues" value={summary.openIssues} variant={summary.openIssues > 0 ? 'warn' : 'default'} />
        <SummaryCard title="Resolved in range" value={summary.resolvedInRange} variant="good" />
        <SummaryCard title="Avg. resolution" value={`${summary.averageResolutionDays} days`} />
        <SummaryCard
          title="Oldest open issue"
          value={`${summary.oldestOpenAgeDays} days`}
          variant={summary.oldestOpenAgeDays > 90 ? 'danger' : summary.oldestOpenAgeDays > 30 ? 'warn' : 'default'}
        />
      </div>

      {/* Monthly opened vs resolved */}
      <ChartCard
        title="Issues opened vs. resolved per month"
        data={monthlyTrend}
        columnKeys={[{ key: 'name', label: 'Month' }, { key: 'opened', label: 'Opened' }, { key: 'resolved', label: 'Resolved' }]}
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyTrend} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="opened" stroke="var(--color-primary)" dot={false} isAnimationActive={false} name="Opened" strokeWidth={2} />
            <Line type="monotone" dataKey="resolved" stroke="var(--color-status-green)" dot={false} isAnimationActive={false} name="Resolved" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Status distribution */}
      <ChartCard
        title="Issues by status"
        data={byStatus}
        columnKeys={[{ key: 'name', label: 'Status' }, { key: 'value', label: 'Count' }]}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byStatus} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {byStatus.map(entry => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || 'var(--color-text-muted)'} />
              ))}
              <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Priority + Department side by side */}
      <div className="analytics-two-col">
        <ChartCard
          title="Issues by priority"
          data={byPriority}
          columnKeys={[{ key: 'name', label: 'Priority' }, { key: 'value', label: 'Count' }]}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byPriority} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                {byPriority.map(entry => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || 'var(--color-text-muted)'} />
                ))}
                <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Issues by department"
          data={byDepartment}
          columnKeys={[{ key: 'name', label: 'Department' }, { key: 'value', label: 'Count' }]}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDepartment} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 80 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-primary)" isAnimationActive={false} radius={[0, 2, 2, 0]}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Aging buckets */}
      <ChartCard
        title="Unresolved issues by age"
        data={agingBuckets}
        columnKeys={[{ key: 'name', label: 'Age range' }, { key: 'value', label: 'Issues' }]}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agingBuckets} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-status-amber)" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Oldest unresolved list */}
      <section aria-labelledby="oldest-heading">
        <div className="analytics-section-header">
          <h3 id="oldest-heading" className="analytics-section-title">Oldest unresolved issues (up to 10)</h3>
          <ExportButton reportType="maintenance" params={filterParams} label="Export CSV" />
        </div>

        {oldestUnresolved.length === 0 ? (
          <p className="analytics-empty">No unresolved issues for the selected filters.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" aria-label="Oldest unresolved issues">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Asset</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-right">Age (days)</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {oldestUnresolved.map(row => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/app/maintenance/${row.id}`} className="table-link">{row.issueCode}</Link>
                    </td>
                    <td>
                      <Link to={`/app/assets/${row.assetId}`} className="table-link">{row.assetCode}</Link>
                    </td>
                    <td>{row.title}</td>
                    <td>
                      <span className={`badge badge-${row.priority === 'CRITICAL' ? 'red' : row.priority === 'HIGH' ? 'amber' : 'neutral'}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td>{row.status}</td>
                    <td className="text-right font-mono">{Math.round(row.ageDays)}</td>
                    <td>{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
