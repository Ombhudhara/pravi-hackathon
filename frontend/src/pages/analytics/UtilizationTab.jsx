import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useUtilizationAnalytics } from '../../hooks/useAnalytics';
import SummaryCard from '../../components/SummaryCard';
import ChartCard from '../../components/ChartCard';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
};

// Flat solid color palette - teal/slate blue, no purple
const BUCKET_COLOR = 'var(--color-status-teal)';
const TYPE_COLOR   = 'var(--color-primary)';
const DIST_COLOR   = 'var(--color-primary)';

export default function UtilizationTab({ filters, filterParams, page, setPage }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortDir = searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc';
  const params = { ...filterParams, page, limit: 10, sortBy: 'utilization', sortDir };
  const { data, loading, error, refresh } = useUtilizationAnalytics(params);

  const toggleUtilizationSort = () => {
    const next = new URLSearchParams(searchParams);
    next.set('sortBy', 'utilization');
    next.set('sortDir', sortDir === 'asc' ? 'desc' : 'asc');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  if (loading) return <p className="analytics-loading" aria-live="polite">Loading utilization data...</p>;
  if (error)   return <div className="analytics-error" role="alert">{error} <button className="btn-link" onClick={refresh}>Retry</button></div>;
  if (!data)   return null;

  const { summary, buckets, byType, byDistrict, underutilizedList, generatedAt } = data;

  return (
    <div className="analytics-tab-content">
      {/* Header row */}
      <div className="analytics-section-header">
        <p className="analytics-last-updated">Last updated: {formatDate(generatedAt)}</p>
        <button className="btn btn-outline btn-sm" onClick={refresh} aria-label="Refresh utilization data">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="analytics-summary-grid">
        <SummaryCard title="Assets with utilization data" value={summary.totalWithData} />
        <SummaryCard
          title="Flagged for administrative review"
          value={summary.underutilizedCount}
          sub={`Below ${summary.threshold}% utilization (ACTIVE only)`}
          variant={summary.underutilizedCount > 0 ? 'warn' : 'default'}
        />
        <SummaryCard
          title="Average utilization"
          value={`${Number(summary.averageUtilization || 0).toFixed(1)}%`}
        />
        <SummaryCard
          title="Unknown (no area data)"
          value={summary.unknownCount}
          variant={summary.unknownCount > 0 ? 'warn' : 'default'}
        />
      </div>

      {/* Utilization bucket chart */}
      <ChartCard
        title="Utilization distribution"
        hasData={summary.totalWithData > 0}
        data={buckets}
        columnKeys={[{ key: 'name', label: 'Range' }, { key: 'count', label: 'Assets' }]}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={buckets} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill={BUCKET_COLOR} isAnimationActive={false} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="count" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* By type */}
      <ChartCard
        title="Average utilization by asset type"
        hasData={summary.totalWithData > 0}
        data={byType}
        columnKeys={[{ key: 'name', label: 'Type' }, { key: 'value', label: 'Avg %' }]}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 60 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
            <Tooltip formatter={(v) => `${parseFloat(v).toFixed(1)}%`} />
            <Bar dataKey="value" fill={TYPE_COLOR} isAnimationActive={false} radius={[0, 2, 2, 0]}>
              <LabelList dataKey="value" position="right" formatter={(v) => `${parseFloat(v).toFixed(1)}%`} style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* By district */}
      {byDistrict.length > 0 && (
        <ChartCard
          title="Average utilization by district (top 15)"
          hasData={summary.totalWithData > 0}
          data={byDistrict}
          columnKeys={[{ key: 'name', label: 'District' }, { key: 'value', label: 'Avg %' }]}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, byDistrict.length * 28)}>
            <BarChart data={byDistrict} layout="vertical" margin={{ top: 4, right: 50, bottom: 4, left: 80 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v) => `${parseFloat(v).toFixed(1)}%`} />
              <Bar dataKey="value" fill={DIST_COLOR} isAnimationActive={false} radius={[0, 2, 2, 0]}>
                <LabelList dataKey="value" position="right" formatter={(v) => `${parseFloat(v).toFixed(1)}%`} style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Flagged table */}
      <section aria-labelledby="flagged-heading">
        <div className="analytics-section-header">
          <h3 id="flagged-heading" className="analytics-section-title">Flagged for administrative review</h3>
          <ExportButton reportType="utilization" params={filterParams} label="Export CSV" />
        </div>

        {underutilizedList.items.length === 0 ? (
          <p className="analytics-empty">No assets flagged for the selected filters.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Assets flagged for administrative review">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Department</th>
                    <th className="text-right">Area (sq ft)</th>
                    <th className="text-right">Used (sq ft)</th>
                    <th className="text-right" aria-sort={sortDir === 'asc' ? 'ascending' : 'descending'}>
                      <button className="analytics-sort-button" type="button" onClick={toggleUtilizationSort} aria-label={`Sort utilization ${sortDir === 'asc' ? 'descending' : 'ascending'}`}>
                        <span>Utilization</span>
                        {sortDir === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {underutilizedList.items.map(row => (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/app/assets/${row.id}`} className="table-link">
                          {row.assetCode}
                        </Link>
                      </td>
                      <td>{row.name}</td>
                      <td>{row.type}</td>
                      <td>{row.district || '-'}</td>
                      <td>{row.department || '-'}</td>
                      <td className="text-right">
                        {(row.type === 'LAND' ? row.landAreaSqft : row.builtUpAreaSqft)?.toLocaleString() || '-'}
                      </td>
                      <td className="text-right">{row.usedAreaSqft?.toLocaleString() || '-'}</td>
                      <td className="text-right">
                        <span className="badge badge-amber">{row.utilizationPercent}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={underutilizedList.pagination.page}
              limit={10}
              totalPages={underutilizedList.pagination.totalPages}
              total={underutilizedList.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
