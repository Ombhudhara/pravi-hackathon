import { useState, useEffect, useCallback } from 'react';
import { getMapAssets } from '../services/map';

export function useMapAssets(searchParams) {
  const [data, setData] = useState({ items: [], total: 0, missingCoordinatesCount: 0, truncated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMapAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = Object.fromEntries(searchParams.entries());
      const response = await getMapAssets(params);
      setData(response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMapAssets();
  }, [fetchMapAssets]);

  return { ...data, loading, error, refresh: fetchMapAssets };
}
