import React, { createContext, useState, useContext, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe ser usado dentro de un AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    show: false,
    type: 'info',
    message: '',
    duration: 4000
  });

  const showAlert = useCallback((type, message, duration = 4000) => {
    setAlert({
      show: true,
      type,
      message,
      duration
    });

    // Auto ocultar después de la duración
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, show: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};