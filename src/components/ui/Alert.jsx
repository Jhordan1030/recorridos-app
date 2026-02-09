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
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      container: "bg-emerald-500/10 border-emerald-500/30",
      title: "text-emerald-400",
      text: "text-emerald-400/70"
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      container: "bg-red-500/10 border-red-500/30",
      title: "text-red-400",
      text: "text-red-400/70"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      container: "bg-amber-500/10 border-amber-500/30",
      title: "text-amber-400",
      text: "text-amber-400/70"
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-400" />,
      container: "bg-blue-500/10 border-blue-500/30",
      title: "text-blue-400",
      text: "text-blue-400/70"
    },
  };

  const style = config[alert.type] || config.info;

  return (
    <div className="fixed z-[60] bottom-4 right-4 w-full max-w-sm px-4 sm:px-0 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`
        relative flex items-start p-5 rounded-[2rem] shadow-2xl border border-white/10
        ${style.container} 
        bg-slate-900/40 backdrop-blur-3xl ring-1 ring-white/10
      `}>
        {/* Icono */}
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>

        {/* Contenido */}
        <div className="ml-4 w-0 flex-1">
          <p className={`text-[10px] font-black uppercase tracking-widest ${style.title}`}>
            {alert.type === 'success' ? '¡Éxito!' :
              alert.type === 'error' ? 'Error' :
                alert.type === 'warning' ? 'Advertencia' : 'Información'}
          </p>
          <p className={`mt-1 text-xs ${style.text} leading-snug font-medium`}>
            {alert.message}
          </p>
        </div>

        {/* Botón Cerrar */}
        <div className="ml-4 flex flex-shrink-0">
          <button
            onClick={hideAlert}
            className="inline-flex rounded-xl p-1 text-white/30 hover:text-white hover:bg-white/10 focus:outline-none transition-all"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;