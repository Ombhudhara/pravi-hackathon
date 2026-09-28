import { useState, useEffect, useCallback } from 'react';
import { getAssetById } from '../services/assets';

export function useAsset(id) {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAsset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAssetById(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch asset');
      }
      setAsset(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError({ status: 404, message: 'Asset not found' });
      } else {
        setError({ status: err.response?.status || 500, message: err.message || 'Failed to fetch asset' });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [fetchAsset, id]);

  return { asset, loading, error, refresh: fetchAsset, setAsset };
}
