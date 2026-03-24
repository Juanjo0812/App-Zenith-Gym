import axios from 'axios';

import { supabase } from '../../lib/supabase';

const baseURL = process.env.EXPO_PUBLIC_API_URL;
const API_PREFIX = '/api/v1';

if (!baseURL) {
  throw new Error(
    'Falta la variable de entorno EXPO_PUBLIC_API_URL. Revisa tu archivo .env'
  );
}

const normalizeApiUrl = (url?: string) => {
  if (!url) {
    return url;
  }

  const normalizedBaseUrl = baseURL.replace(/\/+$/, '');
  const hasEmbeddedApiPrefix = normalizedBaseUrl.endsWith(API_PREFIX);

  if (hasEmbeddedApiPrefix && url.startsWith(`${API_PREFIX}/`)) {
    return url.slice(API_PREFIX.length);
  }

  return url;
};

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  config.url = normalizeApiUrl(config.url);

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default apiClient;
