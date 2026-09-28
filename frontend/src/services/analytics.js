import { fetchApi } from './api';

export const getUtilizationAnalytics = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchApi(`/api/analytics/utilization?${query}`);
  return res.data;
};

export const getConditionAnalytics = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchApi(`/api/analytics/condition?${query}`);
  return res.data;
};

export const getMaintenanceAnalytics = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchApi(`/api/analytics/maintenance?${query}`);
  return res.data;
};

export const getInspectionsAnalytics = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetchApi(`/api/analytics/inspections?${query}`);
  return res.data;
};

export const downloadAnalyticsExport = async (reportType, params) => {
  const token = localStorage.getItem('gov_asset_token');
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const query = new URLSearchParams({ report: reportType, ...filtered }).toString();
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}/api/analytics/export?${query}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let msg = 'Export failed';
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch {
      // ignore parse errors
    }
    throw new Error(msg);
  }

  return res.blob();
};
