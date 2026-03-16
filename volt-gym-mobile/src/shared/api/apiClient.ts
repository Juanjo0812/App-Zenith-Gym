import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Android Emulator uses 10.0.2.2 to reach host machine.
 * iOS Simulator uses localhost.
 * Physical devices (Expo Go) need the machine's local IP address.
 */
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://192.168.1.95:8000/api/v1', // Using your machine's local IP
  default: 'http://192.168.1.95:8000/api/v1', 
});

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export default apiClient;
