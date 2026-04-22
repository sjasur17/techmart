const rawApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:8000'
).trim();

const withoutTrailingSlash = rawApiBaseUrl.replace(/\/+$/, '');

// Allow env values like "https://api.example.com/api/v1" or just "https://api.example.com".
const normalizedApiBaseUrl = withoutTrailingSlash.replace(/\/api\/v1$/i, '');

export const API_BASE_URL = normalizedApiBaseUrl;
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_V1_BASE_URL}${normalizedPath}`;
};
