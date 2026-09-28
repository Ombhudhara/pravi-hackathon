import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import AnalyticsFilterBar from '../components/AnalyticsFilterBar';
import UtilizationTab from './analytics/UtilizationTab';
import ConditionTab from './analytics/ConditionTab';
import MaintenanceTab from './analytics/MaintenanceTab';
import InspectionsTab from './analytics/InspectionsTab';
import { fetchApi } from '../services/api';
import { ASSET_TYPES } from '../config/labels';

const TABS = [
  { id: 'utilization',  label: 'Utilization' },
  { id: 'condition',    label: 'Condition' },
  { id: 'maintenance',  label: 'Maintenance' },
  { id: 'inspections',  label: 'Inspections' },
];

const DATE_TABS = new Set(['maintenance', 'inspections']);
const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';

function localDateKey(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function shiftMonth(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export default function Analytics() {
  useDocumentTitle('Analytics');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') || 'utilization';
  const activeTab = TABS.some(({ id }) => id === requestedTab) ? requestedTab : 'utilization';

  // Meta options for filter dropdowns - hooks must be before any early return
  const [metaOptions, setMetaOptions] = useState({
    districts: [], talukas: [], types: Object.keys(ASSET_TYPES), departments: []
  });

  useEffect(() => {
    fetchApi('/api/assets/filters')
      .then(res => {
        const d = res.data || {};
        setMetaOptions(prev => ({
          ...prev,
          districts:   d.districts   || [],
          talukas:     d.talukas     || [],
          departments: d.departments || [],
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('tab') && !TABS.some(({ id }) => id === searchParams.get('tab'))) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'utilization');
      setSearchParams(next, { replace: true });
      return;
    }
    if (!DATE_TABS.has(activeTab)) return;
    const next = new URLSearchParams(searchParams);
    const dateTo = isDateKey(next.get('dateTo')) ? next.get('dateTo') : localDateKey();
    let dateFrom = isDateKey(next.get('dateFrom')) ? next.get('dateFrom') : shiftMonth(dateTo, -12);
    const earliest = shiftMonth(dateTo, -36);
    if (dateFrom < earliest) dateFrom = earliest;
    if (dateFrom > dateTo) dateFrom = dateTo;
    if (next.get('dateFrom') !== dateFrom || next.get('dateTo') !== dateTo) {
      next.set('dateFrom', dateFrom);
      next.set('dateTo', dateTo);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);



  // Filters from URL
  const getFilter = (key) => searchParams.get(key) || '';
  const filters = {
    district:   getFilter('district'),
    taluka:     getFilter('taluka'),
    type:       getFilter('type'),
    department: getFilter('department'),
    dateFrom:   getFilter('dateFrom'),
    dateTo:     getFilter('dateTo'),
  };

  // Pagination: per tab
  const page = parseInt(searchParams.get('page') || '1', 10);

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const updateFilters = (newFilters) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set('tab', activeTab);
    setSearchParams(next, { replace: true });
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next, { replace: true });
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    else return;
    event.preventDefault();
    const button = event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex];
    button?.focus();
    setTab(TABS[nextIndex].id);
  };

  // Build params for API calls - strip empty strings
  const filterParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '')
  );

  const showDateRange = DATE_TABS.has(activeTab);

  return (
    <div className="page-container">
      {/* Page heading */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-description">Reporting across all government assets.</p>
        </div>
      </div>

      {/* Global filter bar */}
      <AnalyticsFilterBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        showDateRange={showDateRange}
        metaOptions={metaOptions}
      />

      {/* Tabs */}
      <div className="analytics-tabs-container" role="tablist" aria-label="Analytics sections">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {TABS.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} tabIndex={0} hidden={activeTab !== tab.id}>
          {activeTab === tab.id && tab.id === 'utilization' && <UtilizationTab filters={filters} filterParams={filterParams} page={page} setPage={setPage} />}
          {activeTab === tab.id && tab.id === 'condition' && <ConditionTab filters={filters} filterParams={filterParams} page={page} setPage={setPage} />}
          {activeTab === tab.id && tab.id === 'maintenance' && <MaintenanceTab filters={filters} filterParams={filterParams} />}
          {activeTab === tab.id && tab.id === 'inspections' && <InspectionsTab filters={filters} filterParams={filterParams} page={page} setPage={setPage} />}
        </div>
      ))}
    </div>
  );
}
