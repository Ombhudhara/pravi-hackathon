import api from './api';

export const getAssetEvents = async (assetId) => {
  const { data } = await api.get(`/assets/${assetId}/events`);
  return data.data;
};

export const addAssetEvent = async (assetId, payload) => {
  const { data } = await api.post(`/assets/${assetId}/events`, payload);
  return data.data;
};

export const getAssetLifecycle = async (assetId) => {
  const { data } = await api.get(`/assets/${assetId}/lifecycle`);
  return data.data;
};

export const getGlobalEvents = async (params) => {
  const { data } = await api.get('/lifecycle/events', { params });
  return data.data;
};
