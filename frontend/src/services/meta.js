import api from './api';

export const metaService = {
  getEnums: async () => {
    const response = await api.get('/meta/enums');
    return response.data;
  }
};
