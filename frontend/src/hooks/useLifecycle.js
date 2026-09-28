import { useState, useEffect, useCallback } from 'react';
import { getAssetLifecycle } from '../services/lifecycle';

export function useLifecycle(assetId) {
  const [lifecycle, setLifecycle] = useState({ currentStage: 'Unknown', stages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLifecycle = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssetLifecycle(assetId);
      setLifecycle(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch lifecycle');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    if (assetId) {
      fetchLifecycle();
    }
  }, [fetchLifecycle, assetId]);

  return { lifecycle, loading, error, refresh: fetchLifecycle };
}
