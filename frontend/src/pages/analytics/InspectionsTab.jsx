import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useInspectionsAnalytics } from '../../hooks/useAnalytics';
import SummaryCard from '../../components/SummaryCard';
import ChartCard from '../../components/ChartCard';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-IN', { timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
};

export default function InspectionsTab({ filters, filterParams, page, setPage }) {
  const params = { ...filterParams, page, limit: 10 };
  const { data, loading, error, refresh } = useInspectionsAnalytics(params);

  if (loading) return <p className="analytics-loading" aria-live="polite">Loading inspections data...</p>;
  if (error)   return <div className="analytics-error" role="alert">{error} <button className="btn-link" onClick={refresh}>Retry</button></div>;
  if (!data)   return null;

  const { summary, monthlyTrend, neverInspected, overdue, generatedAt } = data;

  return (
    <div className="analytics-tab-content">
      <div className="analytics-section-header">
        <p className="analytics-last-updated">Last updated: {formatDate(generatedAt)}</p>
        <button className="btn btn-outline btn-sm" onClick={refresh} aria-label="Refresh inspections data">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="analytics-summary-grid">
        <SummaryCard title="Inspections in range" value={summary.inspectionsInRange} />
        <SummaryCard
          title="Never inspected"
          value={summary.neverInspectedCount}
          sub="Active / vacant / available / under maintenance"
          variant={summary.neverInspectedCount > 0 ? 'warn' : 'default'}
        />
        <SummaryCard
          title="Overdue"
          value={summary.overdueCount}
          sub={`Last inspection older than ${summary.intervalDays} days`}
          variant={summary.overdueCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Monthly chart */}
      <ChartCard
        title="Inspections per month"
        data={monthlyTrend}
        columnKeys={[{ key: 'name', label: 'Month' }, { key: 'value', label: 'Inspections' }]}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyTrend} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-status-teal)" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Never inspected */}
      <section aria-labelledby="never-heading">
        <div className="analytics-section-header">
          <h3 id="never-heading" className="analytics-section-title">
            Never inspected ({summary.neverInspectedCount})
          </h3>
          <ExportButton reportType="never-inspected" params={filterParams} label="Export CSV" />
        </div>

        {neverInspected.items.length === 0 ? (
          <p className="analytics-empty">No assets without an inspection record for the selected filters.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Assets never inspected">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {neverInspected.items.map(row => (
                    <tr key={row.id}>
                      <td><Link to={`/app/assets/${row.id}`} className="table-link">{row.assetCode}</Link></td>
                      <td>{row.name}</td>
                      <td>{row.type}</td>
                      <td>{row.district || '-'}</td>
                      <td>{row.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={neverInspected.pagination.page}
              totalPages={neverInspected.pagination.totalPages}
              total={neverInspected.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      {/* Overdue */}
      <section aria-labelledby="overdue-heading">
        <div className="analytics-section-header">
          <h3 id="overdue-heading" className="analytics-section-title">
            Overdue ({summary.overdueCount}) - last inspection older than {summary.intervalDays} days
          </h3>
          <ExportButton reportType="overdue" params={filterParams} label="Export CSV" />
        </div>

        {overdue.items.length === 0 ? (
          <p className="analytics-empty">No overdue inspections for the selected filters.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Assets with overdue inspections">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>District</th>
                    <th>Department</th>
                    <th>Last Inspected</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.items.map(row => (
                    <tr key={row.id}>
                      <td><Link to={`/app/assets/${row.id}`} className="table-link">{row.assetCode}</Link></td>
                      <td>{row.name}</td>
                      <td>{row.type}</td>
                      <td>{row.district || '-'}</td>
                      <td>{row.department || '-'}</td>
                      <td>{formatDate(row.lastInspectionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={overdue.pagination.page}
              totalPages={overdue.pagination.totalPages}
              total={overdue.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
