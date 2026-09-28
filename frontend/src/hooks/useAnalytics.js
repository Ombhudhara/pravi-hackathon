import { useState, useEffect, useCallback } from 'react';
import {
  getUtilizationAnalytics,
  getConditionAnalytics,
  getMaintenanceAnalytics,
  getInspectionsAnalytics,
} from '../services/analytics';

function makeHook(fetcher) {
  return function useAnalyticsTab(params, enabled = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const key = JSON.stringify(params);

    const load = useCallback(async () => {
      if (!enabled) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(params);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, enabled]);

    useEffect(() => { load(); }, [load]);

    return { data, loading, error, refresh: load };
  };
}

export const useUtilizationAnalytics = makeHook(getUtilizationAnalytics);
export const useConditionAnalytics = makeHook(getConditionAnalytics);
export const useMaintenanceAnalytics = makeHook(getMaintenanceAnalytics);
export const useInspectionsAnalytics = makeHook(getInspectionsAnalytics);
