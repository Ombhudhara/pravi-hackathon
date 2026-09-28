import api from './api';

export const login = async (email, password) => {
  return await api.post('/auth/login', { email, password });
};

export const signup = async (data) => {
  return await api.post('/auth/signup', data);
};

export const getMe = async () => {
  return await api.get('/auth/me');
};

export const changePassword = async (currentPassword, newPassword) => {
  return await api.post('/auth/change-password', { currentPassword, newPassword });
};

export const handleApiError = (err) => {
  if (err.data && err.data.errors) {
    return { fieldErrors: err.data.errors, message: err.message };
  }
  return { fieldErrors: null, message: err.message || 'An unexpected error occurred.' };
};
