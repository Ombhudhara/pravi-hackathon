import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import ActiveFilterChips from '../components/ActiveFilterChips';
import Pagination from '../components/Pagination';
import SortableTh from '../components/SortableTh';
import StatusBadge from '../components/StatusBadge';
import ConditionBadge from '../components/ConditionBadge';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useInspections from '../hooks/useInspections';
import useAssetFilters from '../hooks/useAssetFilters';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/format';

export default function InspectionList() {
  useDocumentTitle('Inspections | PropertyNexus');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('inspected_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'limit', 'sortBy', 'sortDir'].includes(key)) {
        newFilters[key] = value;
      }
    }
    setFilters(newFilters);
    setPage(Number(searchParams.get('page')) || 1);
    setLimit(Number(searchParams.get('limit')) || 20);
    setSortBy(searchParams.get('sortBy') || 'inspected_at');
    setSortDir(searchParams.get('sortDir') || 'desc');
  }, [location.search]);

  const { inspections, pagination, loading, error, refresh } = useInspections(filters, page, limit, sortBy, sortDir);
  const { filterOptions } = useAssetFilters();

  const updateUrl = (newFilters, newPage, newLimit, newSortBy, newSortDir) => {
    const searchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) searchParams.set(k, v);
    });
    if (newPage !== 1) searchParams.set('page', newPage);
    if (newLimit !== 20) searchParams.set('limit', newLimit);
    if (newSortBy !== 'inspected_at') searchParams.set('sortBy', newSortBy);
    if (newSortDir !== 'desc') searchParams.set('sortDir', newSortDir);
    
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    if (!value) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    updateUrl(newFilters, 1, limit, sortBy, sortDir);
  };

  const handleClearFilters = () => {
    updateUrl({}, 1, limit, sortBy, sortDir);
  };

  const handleSort = (field, dir) => {
    updateUrl(filters, page, limit, field, dir);
  };

  const canInspect = true;

  return (
    <div>
      <PageHeader 
        title="Inspections" 
        description="Records of property condition and site inspections."
        action={canInspect && (
          <Button variant="primary" onClick={() => navigate('/app/inspections/new')} icon={<Plus size={16} />}>
            New inspection
          </Button>
        )}
      />

      <Card>
        <FilterBar 
          filters={filters}
          filterOptions={filterOptions}
          onChange={handleFilterChange}
          role={user?.role}
          isAdmin={isAdmin}
        />
        
        <ActiveFilterChips 
          filters={filters}
          onRemove={handleFilterChange}
          onClearAll={handleClearFilters}
        />

        {error ? (
          <EmptyState 
            title="Error loading inspections"
            description={error}
            action={<Button onClick={refresh}>Retry</Button>}
          />
        ) : loading && inspections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }} aria-live="polite">Loading inspections...</div>
        ) : inspections.length === 0 ? (
          Object.keys(filters).length === 0 ? (
            <EmptyState 
              title="No inspections recorded yet."
              description="There are currently no inspection records."
              action={canInspect && (
                <Button variant="primary" onClick={() => navigate('/app/inspections/new')}>
                  New inspection
                </Button>
              )}
            />
          ) : (
            <EmptyState 
              title="No inspections match the current filters."
              description="Try removing some filters or adjusting your search."
              action={<Button variant="outline" onClick={handleClearFilters}>Clear filters</Button>}
            />
          )
        ) : (
          <div className="table-responsive">
            <Table>
              <caption className="visually-hidden">Inspections List</caption>
              <thead>
                <tr>
                  <SortableTh label="Date" field="inspected_at" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Asset Code" field="asset_code" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <th>Asset Name</th>
                  <th>District</th>
                  <th>Inspector</th>
                  <SortableTh label="Overall Condition" field="overall_condition" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <th>Attachments</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map(insp => (
                  <tr key={insp.id} className="stacked-card-row" onClick={() => navigate(`/app/inspections/${insp.id}`)} style={{ cursor: 'pointer' }}>
                    <td data-label="Date" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {formatDate(insp.inspectedAt)}
                    </td>
                    <td data-label="Asset Code" className="text-mono">
                      <Link to={`/app/assets/${insp.assetId}`} onClick={(e) => e.stopPropagation()} className="row-link" style={{ color: 'var(--color-primary)' }}>
                        {insp.assetCode}
                      </Link>
                    </td>
                    <td data-label="Asset Name">{insp.assetName}</td>
                    <td data-label="District">{insp.district}</td>
                    <td data-label="Inspector">{insp.inspectorName}</td>
                    <td data-label="Overall Condition"><ConditionBadge condition={insp.overallCondition} /></td>
                    <td data-label="Attachments">{insp.attachmentCount}</td>
                    <td data-label="Issues">{insp.issueCount}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {inspections.length > 0 && (
          <Pagination 
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(p) => updateUrl(filters, p, limit, sortBy, sortDir)}
            onLimitChange={(l) => updateUrl(filters, 1, l, sortBy, sortDir)}
          />
        )}
      </Card>
    </div>
  );
}
