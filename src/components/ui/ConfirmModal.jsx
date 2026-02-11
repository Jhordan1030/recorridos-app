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

  // Manejo de ESC y bloqueo de scroll
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!isOpen) return null;

  // Configuración de estilos según el tipo
  const typeConfig = {
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      iconBg: "bg-amber-400/20",
      confirmColor: "bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)]"
    },
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-400" />,
      iconBg: "bg-red-400/20",
      confirmColor: "bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.3)]"
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-400" />,
      iconBg: "bg-blue-400/20",
      confirmColor: "bg-blue-500 text-white shadow-[0_8px_16px_rgba(59,130,246,0.3)]"
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-emerald-400" />,
      iconBg: "bg-emerald-400/20",
      confirmColor: "bg-emerald-500 text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]"
    }
  };

  const config = typeConfig[type] || typeConfig.warning;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">

      {/* Contenedor de centrado */}
      <div
        className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        onClick={handleBackdropClick}
      >

        {/* Backdrop con Blur */}
        <div
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-3xl transition-opacity pointer-events-none"
          aria-hidden="true"
        />

        {/* Panel del Modal */}
        <div
          className="relative transform overflow-hidden rounded-[2.5rem] bg-slate-950/90 backdrop-blur-3xl text-left shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all sm:my-8 sm:w-full sm:max-w-lg border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >

          <div className="bg-transparent px-8 pb-4 pt-8 sm:p-10 sm:pb-6">
            <div className="sm:flex sm:items-start">

              {/* Círculo del Ícono */}
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10 transition-colors`}>
                {config.icon}
              </div>

              {/* Textos */}
              <div className="mt-4 text-center sm:ml-6 sm:mt-0 sm:text-left">
                <h3 className="text-2xl font-black leading-6 text-white tracking-tighter" id="modal-title">
                  {title}
                </h3>
                <div className="mt-3">
                  <p className="text-base text-white/40 font-medium leading-relaxed tracking-tight">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones del Footer */}
          <div className="bg-white/5 px-8 py-6 sm:flex sm:flex-row-reverse sm:px-10 border-t border-white/5">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-[1.25rem] px-6 py-3.5 text-[10px] font-black uppercase tracking-widest shadow-2xl sm:ml-4 sm:w-auto transition-all active:scale-95 ${config.confirmColor}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-[1.25rem] bg-white/5 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 hover:bg-white/10 hover:text-white sm:mt-0 sm:w-auto transition-all active:scale-95"
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