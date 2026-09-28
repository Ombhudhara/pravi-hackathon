import api from './api';

export const getAssets = async (params) => {
  const { data } = await api.get('/api/assets', { params });
  return data;
};

export const getAssetFilters = async () => {
  const { data } = await api.get('/api/assets/filters');
  return data;
};

export const getAssetById = async (id) => {
  const { data } = await api.get(`/api/assets/${id}`);
  return data;
};

export const createAsset = async (assetData) => {
  const { data } = await api.post('/api/assets', assetData);
  return data;
};

export const updateAsset = async (id, assetData) => {
  const { data } = await api.patch(`/api/assets/${id}`, assetData);
  return data;
};

export const changeAssetStatus = async (id, payload) => {
  const { data } = await api.patch(`/api/assets/${id}/status`, payload);
  return data;
};
