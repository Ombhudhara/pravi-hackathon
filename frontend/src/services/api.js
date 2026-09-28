const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...(!isFormData ? { 'Content-Type': 'application/json' } : {}), ...options.headers };

  const token = localStorage.getItem('gov_asset_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Server communication error.');
    error.status = response.status;
    error.data = data;
    error.response = { status: response.status, data };
    throw error;
  }
  return data;
}

function apiEndpoint(endpoint) {
  return endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function withParams(endpoint, params) {
  const query = new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)])).toString();
  return `${apiEndpoint(endpoint)}${query ? `?${query}` : ''}`;
}

async function request(method, endpoint, body, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const result = await fetchApi(apiEndpoint(endpoint), {
    method,
    headers: options.headers,
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) })
  });
  return { data: result };
}

const api = {
  get: (endpoint, options = {}) => request('GET', withParams(endpoint, options.params), undefined, options),
  post: (endpoint, body, options = {}) => request('POST', endpoint, body, options),
  put: (endpoint, body, options = {}) => request('PUT', endpoint, body, options),
  patch: (endpoint, body, options = {}) => request('PATCH', endpoint, body, options),
  delete: (endpoint, options = {}) => request('DELETE', endpoint, undefined, options)
};

export default api;
