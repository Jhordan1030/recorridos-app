import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción",
  message = "¿Estás seguro de que quieres realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning"
}) => {
  
  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Configuración de estilos según el tipo
  const typeConfig = {
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      confirmColor: "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500 border-transparent text-white"
    },
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      confirmColor: "bg-red-600 hover:bg-red-500 focus:ring-red-500 border-transparent text-white"
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      confirmColor: "bg-blue-600 hover:bg-blue-500 focus:ring-blue-500 border-transparent text-white"
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      confirmColor: "bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 border-transparent text-white"
    }
  };

  const config = typeConfig[type] || typeConfig.warning;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      
      {/* Contenedor de centrado */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        
        {/* Backdrop con Blur */}
        <div 
          className="fixed inset-0 bg-gray-900/75 dark:bg-black/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Panel del Modal */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200 dark:border-slate-800">
          
          <div className="bg-white dark:bg-slate-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              
              {/* Círculo del Ícono */}
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10 transition-colors`}>
                {config.icon}
              </div>

              {/* Textos */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones del Footer */}
          <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-lg px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto transition-all duration-200 ${config.confirmColor}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 sm:mt-0 sm:w-auto transition-colors duration-200"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;