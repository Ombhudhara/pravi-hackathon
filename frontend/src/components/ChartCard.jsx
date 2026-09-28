import React, { useId, useState } from 'react';
import { Table2, BarChart2 } from 'lucide-react';

/**
 * ChartCard - wraps a recharts chart with a "View as table" toggle.
 * Props:
 *   title       - card heading
 *   data        - array of objects (same format as chart)
 *   columnKeys  - array of { key, label } for the table view
 *   lastUpdated - ISO string
 *   children    - the chart JSX (rendered when table not shown)
 */
export default function ChartCard({ title, data = [], columnKeys = [], children, className = '', hasData }) {
  const [showTable, setShowTable] = useState(false);
  const contentId = useId();
  const hasChartData = hasData ?? data.some((row) => Object.entries(row).some(([key, value]) => key !== 'id' && key !== 'name' && typeof value === 'number' && value !== 0));

  return (
    <div className={`analytics-chart-card ${className}`}>
      <div className="analytics-chart-header">
        <h3 className="analytics-chart-title">{title}</h3>
        <button
          className="btn-icon-text"
          type="button"
          onClick={() => setShowTable(v => !v)}
          aria-pressed={showTable}
          aria-controls={contentId}
          title={showTable ? 'Show chart' : 'View as table'}
        >
          {showTable ? <BarChart2 size={15} /> : <Table2 size={15} />}
          <span>{showTable ? 'Chart' : 'Table'}</span>
        </button>
      </div>

      <div id={contentId}>
      {showTable ? (
        <div className="chart-table-view">
          {data.length === 0 ? (
            <p className="chart-empty-text">No data for the selected filters.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {columnKeys.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {columnKeys.map(col => (
                      <td key={col.key}>{row[col.key] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="analytics-chart-body">
          {!hasChartData ? (
            <p className="chart-empty-text">No data for the selected filters.</p>
          ) : (
            children
          )}
        </div>
      )}
      </div>
    </div>
  );
}
