import api from './api';

export const getMapAssets = async (params) => {
  const { data } = await api.get('/map/assets', { params });
  return data.data;
};
