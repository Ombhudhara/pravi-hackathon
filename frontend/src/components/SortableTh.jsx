import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function SortableTh({ 
  label, 
  field, 
  currentSortBy, 
  currentSortDir, 
  onSort 
}) {
  const isSorted = currentSortBy === field;
  
  const handleClick = () => {
    if (isSorted) {
      onSort(field, currentSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  return (
    <th 
      onClick={handleClick} 
      className="sortable-th"
      aria-sort={isSorted ? (currentSortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {label}
        {isSorted && (
          <span className="sort-icon" style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            {currentSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </span>
        )}
      </div>
    </th>
  );
}
