import { useState, useEffect, useCallback } from 'react';
import { getAssetEvents, addAssetEvent } from '../services/lifecycle';

export function useAssetEvents(assetId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssetEvents(assetId);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    if (assetId) {
      fetchEvents();
    }
  }, [fetchEvents, assetId]);

  const addEvent = async (payload) => {
    const newEvent = await addAssetEvent(assetId, payload);
    setEvents(prev => [newEvent, ...prev]);
    return newEvent;
  };

  return { events, loading, error, refresh: fetchEvents, addEvent };
}
