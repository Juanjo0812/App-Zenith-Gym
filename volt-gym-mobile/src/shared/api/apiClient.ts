import axios from 'axios';

import { supabase } from '../../lib/supabase';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error(
    'Falta la variable de entorno EXPO_PUBLIC_API_URL. Revisa tu archivo .env'
  );
}

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default apiClient;
