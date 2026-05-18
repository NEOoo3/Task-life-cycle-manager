import axios from 'axios';

/**
 * PRODUCTION-GRADE API SERVICE
 * Centrally manages the connection to the Flask backend.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout for reliability
});

// Response interceptor for clean error handling across the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'A network error occurred. Check backend status.';
    return Promise.reject(message);
  }
);

export const getTasks = () => api.get('/tasks');
export const createTask = (data) => api.post('/tasks', data);
export const transitionTask = (id, status) => api.patch(`/tasks/${id}/transition`, { status });

export default api;