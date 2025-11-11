import axios from 'axios';

// Usa tu API desplegada en Vercel
const API_URL = 'https://api-recorridos.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTENTICACIÓN ==========
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const verifyToken = () => api.get('/auth/verify');

// ========== NIÑOS ==========
export const getNinos = () => api.get('/ninos');
export const getNinoById = (id) => api.get(`/ninos/${id}`);
export const createNino = (data) => api.post('/ninos', data);
export const updateNino = (id, data) => api.put(`/ninos/${id}`, data);
export const deleteNino = (id) => api.delete(`/ninos/${id}`);

// ========== VEHÍCULOS ==========
export const getVehiculos = () => api.get('/vehiculos');
export const getVehiculoById = (id) => api.get(`/vehiculos/${id}`);
export const createVehiculo = (data) => api.post('/vehiculos', data);
export const updateVehiculo = (id, data) => api.put(`/vehiculos/${id}`, data);
export const deleteVehiculo = (id) => api.delete(`/vehiculos/${id}`);

// ========== RECORRIDOS ==========
export const getRecorridos = () => api.get('/recorridos');
export const getRecorridoById = (id) => api.get(`/recorridos/${id}`);
export const getRecorridosByFecha = (fecha) => api.get(`/recorridos/fecha/${fecha}`);
export const createRecorrido = (data) => api.post('/recorridos', data);
export const updateRecorrido = (id, data) => api.put(`/recorridos/${id}`, data);
export const deleteRecorrido = (id) => api.delete(`/recorridos/${id}`);
export const addNinoToRecorrido = (data) => api.post('/recorridos/ninos', data);
export const removeNinoFromRecorrido = (id) => api.delete(`/recorridos/ninos/${id}`);

export default api;