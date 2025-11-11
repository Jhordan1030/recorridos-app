import React from 'react';
import { useAlert } from '../context/AlertContext';

const alertConfig = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: "✅",
    iconBg: "bg-emerald-100"
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-800",
    icon: "❌",
    iconBg: "bg-rose-100"
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: "⚠️",
    iconBg: "bg-amber-100"
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "ℹ️",
    iconBg: "bg-blue-100"
  },
};

const Alert = () => {
  const { alert, hideAlert } = useAlert();

  if (!alert.show) return null;

  const config = alertConfig[alert.type] || alertConfig.info;

  return (
    // ✅ CAMBIO: bottom-4 right-4 en lugar de top-4 right-4
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className={`${config.bg} ${config.border} ${config.text} rounded-xl shadow-lg border p-4 animate-slide-in-right`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <span className="text-sm">{config.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium capitalize mb-1">{alert.type}</p>
            <p className="text-sm opacity-90">{alert.message}</p>
          </div>
          <button
            onClick={hideAlert}
            className="flex-shrink-0 rounded-lg p-1 hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;