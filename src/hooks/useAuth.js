import { useState, useEffect } from 'react';
import { getCurrentUser, verifyToken } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verificar token y obtener usuario actual
      await verifyToken();
      const userResponse = await getCurrentUser();
      
      setUser(userResponse.data.user);
      setIsAuthenticated(true);
      
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(userResponse.data.user));
      
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin: isAdmin(),
    login,
    logout,
    checkAuth
  };
};