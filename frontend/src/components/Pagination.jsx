import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import Select from './Select';

export default function Pagination({ page, limit, total, totalPages, onPageChange, onLimitChange }) {
  const pageSize = Number.isFinite(limit) ? limit : 10;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: 'var(--space-6)' }}>
      <div className="pagination-info" aria-live="polite" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        {total > 0 ? (
          <span>Showing {start} to {end} of {total} assets</span>
        ) : (
          <span>No assets</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="per-page" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Per page:</label>
            <select
              id="per-page"
              value={pageSize}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)'
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(page - 1)} 
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= totalPages || total === 0}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
