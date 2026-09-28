import api from './api';

export const getInspections = async (filters = {}, page = 1, limit = 20, sortBy = 'inspected_at', sortDir = 'desc') => {
  const params = { ...filters, page, limit, sortBy, sortDir };
  const res = await api.get('/inspections', { params });
  return res.data;
};

export const getInspectionById = async (id) => {
  const res = await api.get(`/inspections/${id}`);
  return res.data;
};

export const createInspection = async (formData) => {
  // formData is a FormData object containing multipart data
  const res = await api.post('/inspections', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};
