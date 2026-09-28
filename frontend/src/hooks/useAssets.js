import { useState, useEffect, useCallback } from 'react';
import { getAssets } from '../services/assets';

export default function useAssets(filters, page, limit, sortBy, sortDir) {
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAssets({
        ...filters,
        page,
        limit,
        sortBy,
        sortDir
      });
      if (result.success) {
        setAssets(result.data.items);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || 'Failed to fetch assets');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching assets');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, sortBy, sortDir]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const refresh = () => {
    fetchAssets();
  };

  return { assets, pagination, loading, error, refresh };
}
