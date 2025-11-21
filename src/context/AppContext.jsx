import { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();
// Context Provider for global state

export const AppProvider = ({ children }) => {
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [recorridos, setRecorridos] = useState([]);

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  const value = {
    alert,
    showAlert,
    ninos,
    setNinos,
    vehiculos,
    setVehiculos,
    recorridos,
    setRecorridos,
    theme,
    toggleTheme
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};
