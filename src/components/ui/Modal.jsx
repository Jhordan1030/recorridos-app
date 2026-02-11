import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose, size = 'max-w-md', isOpen }) => {

  // Efecto para manejar la tecla Escape y scroll
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Contenedor principal para centrado */}
      <div
        className="flex min-h-full items-end justify-center sm:items-center p-4 sm:p-0"
        onClick={handleBackdropClick}
      >
        {/* Backdrop con Blur y color oscuro */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Panel del Modal */}
        <div
          className={`
            relative transform overflow-hidden 
            rounded-2xl sm:rounded-3xl
            text-left shadow-2xl transition-all 
            sm:my-8 w-full ${size}
            bg-white
            border border-slate-200
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {/* Header */}
          <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          {/* Content */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 bg-white text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;