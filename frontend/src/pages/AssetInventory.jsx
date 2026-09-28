import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import TypeLabel from '../components/TypeLabel';
import UtilizationCell from '../components/UtilizationCell';
import StatusChangeModal from '../components/StatusChangeModal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAssets from '../hooks/useAssets';
import useAssetFilters from '../hooks/useAssetFilters';
import { useAuth } from '../contexts/AuthContext';
import { changeAssetStatus } from '../services/assets';

export default function AssetInventory() {
  useDocumentTitle('Asset Inventory');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [statusChangeSuccess, setStatusChangeSuccess] = useState('');

  // Sync state from URL
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
    setSortBy(searchParams.get('sortBy') || 'updated_at');
    setSortDir(searchParams.get('sortDir') || 'desc');
  }, [location.search]);

  const { assets, pagination, loading, error, refresh } = useAssets(filters, page, limit, sortBy, sortDir);
  const { filterOptions } = useAssetFilters();

  const updateUrl = (newFilters, newPage, newLimit, newSortBy, newSortDir) => {
    const searchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) searchParams.set(k, v);
    });
    if (newPage !== 1) searchParams.set('page', newPage);
    if (newLimit !== 20) searchParams.set('limit', newLimit);
    if (newSortBy !== 'updated_at') searchParams.set('sortBy', newSortBy);
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

  const handlePageChange = (newPage) => {
    updateUrl(filters, newPage, limit, sortBy, sortDir);
  };

  const handleLimitChange = (newLimit) => {
    updateUrl(filters, 1, newLimit, sortBy, sortDir);
  };

  const handleStatusChangeConfirm = async (id, data) => {
    await changeAssetStatus(id, data);
    setStatusChangeSuccess('Asset status updated successfully');
    setTimeout(() => setStatusChangeSuccess(''), 3000);
    refresh();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      <PageHeader 
        title="Asset Inventory" 
        description="Register of all public properties and land assets."
        action={(
          <Button variant="primary" onClick={() => navigate('/app/assets/new')} icon={<Plus size={16} />}>
            Add asset
          </Button>
        )}
      />

      {statusChangeSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', backgroundColor: 'var(--color-status-green-bg)', color: 'var(--color-status-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          {statusChangeSuccess}
        </div>
      )}

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
            title="Error loading assets"
            description={error}
            action={<Button onClick={refresh}>Retry</Button>}
          />
        ) : loading && assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }} aria-live="polite">Loading assets...</div>
        ) : assets.length === 0 ? (
          Object.keys(filters).length === 0 ? (
            <EmptyState 
              title="No assets recorded yet."
              description="There are currently no assets in the register."
              action={isAdmin && (
                <Button variant="primary" onClick={() => navigate('/app/assets/new')}>
                  Add asset
                </Button>
              )}
            />
          ) : (
            <EmptyState 
              title="No assets match the current filters."
              description="Try removing some filters or adjusting your search."
              action={<Button variant="outline" onClick={handleClearFilters}>Clear filters</Button>}
            />
          )
        ) : (
          <div className="table-responsive">
            <Table>
              <caption className="visually-hidden">Asset Inventory List</caption>
              <thead>
                <tr>
                  <SortableTh label="Asset Code" field="asset_code" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Name" field="name" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Type" field="type" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="District" field="district" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <th>Department</th>
                  <SortableTh label="Status" field="status" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Condition" field="condition" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="Utilization" field="utilization" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />
                  <th>Assigned Officer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="stacked-card-row">
                    <td data-label="Asset Code" className="text-mono">
                      {/* Asset details page is not in this module, but we can link to edit if admin */}
                      {isAdmin ? (
                        <span className="row-link" onClick={() => navigate(`/app/assets/${asset.id}/edit`)} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                          {asset.assetCode}
                        </span>
                      ) : (
                        asset.assetCode
                      )}
                    </td>
                    <td data-label="Name" style={{ fontWeight: 'var(--font-weight-medium)' }}>{asset.name}</td>
                    <td data-label="Type"><TypeLabel type={asset.type} /></td>
                    <td data-label="District">{asset.district}</td>
                    <td data-label="Department">{asset.department || '-'}</td>
                    <td data-label="Status"><StatusBadge status={asset.status} /></td>
                    <td data-label="Condition"><ConditionBadge condition={asset.condition} /></td>
                    <td data-label="Utilization"><UtilizationCell percent={asset.utilizationPercent} isUnderutilized={asset.isUnderutilized} /></td>
                    <td data-label="Assigned Officer">{asset.assignedOfficer?.fullName || '-'}</td>
                    <td data-label="Actions">
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setStatusModalOpen(true); }}
                      >
                        Change status
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/assets/${asset.id}/edit`); }}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {assets.length > 0 && (
          <Pagination 
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </Card>

      <StatusChangeModal 
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        asset={selectedAsset}
        onConfirm={handleStatusChangeConfirm}
        userRole={user?.role}
      />
    </div>
  );
}
