import { useState, useEffect, useCallback } from 'react';
import { getInspections } from '../services/inspections';

export default function useInspections(filters, page, limit, sortBy, sortDir) {
  const [data, setData] = useState({ items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInspections(filters, page, limit, sortBy, sortDir);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, sortBy, sortDir]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  return { 
    inspections: data.items, 
    pagination: data.pagination, 
    loading, 
    error, 
    refresh: fetchInspections 
  };
}
