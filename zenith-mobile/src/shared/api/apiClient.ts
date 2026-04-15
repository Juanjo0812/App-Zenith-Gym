import axios from 'axios';

import { supabase } from '../../lib/supabase';
import { handleDemoRequest, isDemoModeEnabled } from '../../lib/demoMode';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://127.0.0.1:8000/api/v1';
const API_PREFIX = '/api/v1';

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

  try {
    if (await isDemoModeEnabled()) {
      config.adapter = async (requestConfig) => handleDemoRequest(requestConfig);
      return config;
    }
  } catch (error) {
    console.warn('No pudimos leer el modo demo:', error);
  }

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    console.warn('No pudimos obtener la sesión de Supabase:', error);
  }

  return config;
});

export default apiClient;
