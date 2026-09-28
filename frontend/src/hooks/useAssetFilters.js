import { useState, useEffect } from 'react';
import { getAssetFilters } from '../services/assets';

export default function useAssetFilters() {
  const [filterOptions, setFilterOptions] = useState({ districts: [], talukas: [], departments: [], officers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const result = await getAssetFilters();
        if (result.success) {
          setFilterOptions(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch asset filters', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  return { filterOptions, loading };
}
