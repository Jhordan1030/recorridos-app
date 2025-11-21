import React, { useEffect } from 'react';
import { useAlert } from '../../context/AlertContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const Alert = () => {
  const { alert, hideAlert } = useAlert();

  // Auto-cerrar alerta después de 4 segundos
  useEffect(() => {
    if (alert?.show) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alert, hideAlert]);

  if (!alert?.show) return null;

  // Configuración de estilos según el tipo
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      container: "bg-white dark:bg-slate-800 border-emerald-500 dark:border-emerald-500",
      title: "text-emerald-800 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-slate-400"
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
      container: "bg-white dark:bg-slate-800 border-red-500 dark:border-red-500",
      title: "text-red-800 dark:text-red-400",
      text: "text-red-600 dark:text-slate-400"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      container: "bg-white dark:bg-slate-800 border-amber-500 dark:border-amber-500",
      title: "text-amber-800 dark:text-amber-400",
      text: "text-amber-600 dark:text-slate-400"
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
      container: "bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-500",
      title: "text-blue-800 dark:text-blue-400",
      text: "text-blue-600 dark:text-slate-400"
    },
  };

  const style = config[alert.type] || config.info;

  return (
    <div className="fixed z-[60] bottom-4 right-4 w-full max-w-sm px-4 sm:px-0 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`
        relative flex items-start p-4 rounded-xl shadow-lg border-l-4
        ${style.container} 
        ring-1 ring-black/5 dark:ring-white/10
      `}>
        {/* Icono */}
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>

        {/* Contenido */}
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-bold capitalize ${style.title}`}>
            {alert.type === 'success' ? '¡Éxito!' : 
             alert.type === 'error' ? 'Error' : 
             alert.type === 'warning' ? 'Advertencia' : 'Información'}
          </p>
          <p className={`mt-1 text-sm ${style.text} leading-snug`}>
            {alert.message}
          </p>
        </div>

        {/* Botón Cerrar */}
        <div className="ml-4 flex flex-shrink-0">
          <button
            onClick={hideAlert}
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-white focus:outline-none transition-colors"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;