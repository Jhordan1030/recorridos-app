import React from 'react';
import { useAlert } from '../../context/AlertContext';

const alertConfig = {
  success: {
    bg: "bg-medical-50",
    border: "border-medical-200",
    text: "text-medical-800",
    icon: "✅",
    iconBg: "bg-medical-100"
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "❌",
    iconBg: "bg-red-100"
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: "⚠️",
    iconBg: "bg-yellow-100"
  },
  info: {
    bg: "bg-primary-50",
    border: "border-primary-200",
    text: "text-primary-800",
    icon: "ℹ️",
    iconBg: "bg-primary-100"
  },
};

const Alert = () => {
  const { alert, hideAlert } = useAlert();

  if (!alert.show) return null;

  const config = alertConfig[alert.type] || alertConfig.info;

  return (
    <div className="fixed z-50 w-full max-w-sm 
                    bottom-4 right-4 
                    sm:bottom-6 sm:right-6
                    md:bottom-8 md:right-8
                    px-4 sm:px-0">
      
      <div className={`
        ${config.bg} ${config.border} ${config.text} 
        rounded-xl shadow-lg border p-4 
        animate-slide-in-right
        w-full
      `}>
        
        <div className="flex items-start space-x-3">
          <div className={`
            flex-shrink-0 
            w-6 h-6 
            sm:w-8 sm:h-8 
            rounded-full ${config.iconBg} 
            flex items-center justify-center
          `}>
            <span className="text-xs sm:text-sm">{config.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium capitalize mb-1">
              {alert.type}
            </p>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
              {alert.message}
            </p>
          </div>
          
          <button
            onClick={hideAlert}
            className="flex-shrink-0 rounded-lg p-1 hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Cerrar alerta"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;