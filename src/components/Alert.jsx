// src/components/Alert.jsx
import React from 'react';
import { useApp } from '../context/AppContext';

// Mapeo de tipos de alerta a clases de Tailwind (usando colores suaves para el fondo y texto contrastante)
const alertClasses = {
  success: "bg-green-50 border-green-400 text-green-700", // Éxito: Verde claro
  error: "bg-red-50 border-red-400 text-red-700",        // Error: Rojo
  warning: "bg-yellow-50 border-yellow-400 text-yellow-700", // Advertencia: Amarillo
  info: "bg-blue-50 border-blue-400 text-blue-700",       // Información: Azul
};

const iconMap = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const Alert = () => {
  const { alert } = useApp();

  if (!alert.show) return null;

  // Clases base: Fijo en la pantalla, z-index alto, padding.
  // CLAVE: bottom-5 right-5 para la esquina inferior derecha.
  const baseClasses = "fixed bottom-5 right-5 z-50 p-4 border rounded-xl shadow-lg max-w-xs w-full transition-all duration-300 transform translate-x-0";

  // Clases dinámicas: Se añaden las clases específicas del tipo de alerta
  const typeClass = alertClasses[alert.type] || alertClasses.info;
  const icon = iconMap[alert.type] || iconMap.info;

  return (
    // Agregamos una animación simple de entrada (scale-in)
    <div
      className={`${baseClasses} ${typeClass} animate-slide-in-right`}
      style={{ animationName: 'slideInRight', animationDuration: '0.4s' }}
    >
      <div className="flex items-center">
        <span className="mr-3 text-xl leading-none">{icon}</span>
        <div>
          <p className="font-semibold text-sm capitalize">{alert.type}</p>
          <p className="text-sm">{alert.message}</p>
        </div>
      </div>
    </div>
  );
};

export default Alert;