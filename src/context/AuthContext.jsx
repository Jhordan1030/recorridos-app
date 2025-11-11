import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi, register as registerApi, verifyToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await verifyToken();
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await loginApi({ email, password });
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error en el login';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await registerApi(userData);
      
      const { token, user: userDataResponse } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userDataResponse));
      setUser(userDataResponse);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error en el registro';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // ✅ NUEVO: Propiedad para verificar si es admin
  const isAdmin = user?.rol === 'admin';

  // ✅ NUEVO: Propiedad para verificar autenticación
  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    error,
    isAuthenticated, // ✅ NUEVO
    isAdmin, // ✅ NUEVO
    login,
    register,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};