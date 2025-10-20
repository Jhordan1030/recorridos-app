import React from 'react';
import { useApp } from '../context/AppContext';

const Alert = () => {
  const { alert } = useApp();

  if (!alert.show) return null;

  return (
    <div className={`alert alert-${alert.type}`}>
      {alert.message}
    </div>
  );
};

export default Alert;
