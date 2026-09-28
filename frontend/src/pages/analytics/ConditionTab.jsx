import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend, Cell
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useConditionAnalytics } from '../../hooks/useAnalytics';
import SummaryCard from '../../components/SummaryCard';
import ChartCard from '../../components/ChartCard';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';

// Flat solid token colors - no purple/violet
const CONDITION_COLORS = {
  GOOD:            'var(--color-status-green)',
  NEEDS_ATTENTION: 'var(--color-status-amber)',
  CRITICAL:        'var(--color-status-red)',
  NOT_APPLICABLE:  'var(--color-text-muted)',
};
const CONDITION_LABELS = {
  GOOD: 'Good',
  NEEDS_ATTENTION: 'Needs attention',
  CRITICAL: 'Critical',
  NOT_APPLICABLE: 'Not applicable',
};

const STACKED_KEYS = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
};

export default function ConditionTab({ filters, filterParams, page, setPage }) {
  const params = { ...filterParams, page, limit: 10 };
  const { data, loading, error, refresh } = useConditionAnalytics(params);

  if (loading) return <p className="analytics-loading" aria-live="polite">Loading condition data...</p>;
  if (error)   return <div className="analytics-error" role="alert">{error} <button className="btn-link" onClick={refresh}>Retry</button></div>;
  if (!data)   return null;

  const { summary, distribution, byType, byDistrict, components, attentionList, generatedAt } = data;

  return (
    <div className="analytics-tab-content">
      <div className="analytics-section-header">
        <p className="analytics-last-updated">Last updated: {formatDate(generatedAt)}</p>
        <button className="btn btn-outline btn-sm" onClick={refresh} aria-label="Refresh condition data">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="analytics-summary-grid">
        <SummaryCard title="Good" value={summary.goodCount} variant="good" />
        <SummaryCard title="Needs attention" value={summary.attentionCount} variant={summary.attentionCount > 0 ? 'warn' : 'default'} />
        <SummaryCard title="Critical" value={summary.criticalCount} variant={summary.criticalCount > 0 ? 'danger' : 'default'} />
        <SummaryCard title="Not applicable" value={summary.notApplicableCount} />
      </div>

      {/* Overall distribution */}
      <ChartCard
        title="Overall condition distribution"
        data={distribution}
        columnKeys={[{ key: 'name', label: 'Condition' }, { key: 'value', label: 'Assets' }]}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distribution} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {distribution.map((entry) => {
                const colorKey = Object.keys(CONDITION_LABELS).find(k => CONDITION_LABELS[k] === entry.name);
                return <Cell key={entry.name} fill={CONDITION_COLORS[colorKey] || 'var(--color-text-muted)'} />;
              })}
              <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* By type - stacked */}
      {byType.length > 0 && (
        <ChartCard
          title="Condition by asset type"
          data={byType}
          columnKeys={[
            { key: 'name', label: 'Type' },
            ...STACKED_KEYS.map(k => ({ key: k, label: CONDITION_LABELS[k] }))
          ]}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, byType.length * 40)}>
            <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 80 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Legend formatter={(v) => CONDITION_LABELS[v] || v} />
              {STACKED_KEYS.map(k => (
                <Bar key={k} dataKey={k} stackId="a" fill={CONDITION_COLORS[k]} isAnimationActive={false} name={k}>
                  <LabelList dataKey={k} position="center" style={{ fontSize: 10, fill: '#fff' }} formatter={(v) => v > 0 ? v : ''} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* By district */}
      {byDistrict.length > 0 && (
        <ChartCard
          title="Condition by district (top 15)"
          data={byDistrict}
          columnKeys={[
            { key: 'name', label: 'District' },
            ...STACKED_KEYS.map(k => ({ key: k, label: CONDITION_LABELS[k] }))
          ]}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, byDistrict.length * 32)}>
            <BarChart data={byDistrict} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 80 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Legend formatter={(v) => CONDITION_LABELS[v] || v} />
              {STACKED_KEYS.map(k => (
                <Bar key={k} dataKey={k} stackId="a" fill={CONDITION_COLORS[k]} isAnimationActive={false} name={k}>
                  <LabelList dataKey={k} position="center" style={{ fontSize: 10, fill: 'var(--color-surface)' }} formatter={(value) => value > 0 ? value : ''} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Component breakdown */}
      {components.length > 0 && (
        <ChartCard
          title="Component condition breakdown (latest inspection per asset)"
          hasData={components.some((component) => STACKED_KEYS.some((key) => component[key] > 0))}
          data={components}
          columnKeys={[
            { key: 'name', label: 'Component' },
            ...STACKED_KEYS.map(k => ({ key: k, label: CONDITION_LABELS[k] }))
          ]}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={components} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend formatter={(v) => CONDITION_LABELS[v] || v} />
              {STACKED_KEYS.map(k => (
                <Bar key={k} dataKey={k} stackId="a" fill={CONDITION_COLORS[k]} isAnimationActive={false} name={k}>
                  <LabelList dataKey={k} position="center" style={{ fontSize: 10, fill: 'var(--color-surface)' }} formatter={(value) => value > 0 ? value : ''} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Attention list */}
      <section aria-labelledby="attention-heading">
        <div className="analytics-section-header">
          <h3 id="attention-heading" className="analytics-section-title">Assets needing attention</h3>
          <ExportButton reportType="condition" params={filterParams} label="Export CSV" />
        </div>

        {attentionList.items.length === 0 ? (
          <p className="analytics-empty">No assets in critical or needs-attention condition for the selected filters.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Assets needing attention">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Condition</th>
                    <th>Last Inspection</th>
                    <th className="text-right">Open Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionList.items.map(row => (
                    <tr key={row.assetId}>
                      <td>
                        <Link to={`/app/assets/${row.assetId}`} className="table-link">{row.assetCode}</Link>
                      </td>
                      <td>{row.assetName}</td>
                      <td>{row.assetType}</td>
                      <td>{row.district || '-'}</td>
                      <td>
                        <span className={`badge badge-${row.condition === 'CRITICAL' ? 'red' : 'amber'}`}>
                          {CONDITION_LABELS[row.condition] || row.condition}
                        </span>
                      </td>
                      <td>{formatDate(row.lastInspectionDate)}</td>
                      <td className="text-right">{row.openIssues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={attentionList.pagination.page}
              totalPages={attentionList.pagination.totalPages}
              total={attentionList.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
