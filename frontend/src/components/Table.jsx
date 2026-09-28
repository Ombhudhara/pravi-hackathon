import React from 'react';

// Props: headers (string array), rows (data array), renderRow (function returning tr)
export default function Table({ headers, rows, renderRow, className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => renderRow(row, idx))}
        </tbody>
      </table>
    </div>
  );
}
