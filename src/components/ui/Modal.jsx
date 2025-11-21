import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose, size = 'max-w-md', isOpen }) => {
  
  // Efecto para manejar la tecla Escape y scroll
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.keyCode === 27) onClose();
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
        className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        onClick={handleBackdropClick}
      >
        {/* Backdrop con Blur y color oscuro */}
        <div 
          className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Panel del Modal */}
        <div 
          className={`
            relative transform overflow-hidden rounded-2xl text-left shadow-2xl transition-all sm:my-8 sm:w-full ${size}
            bg-white dark:bg-slate-900 
            border border-gray-200 dark:border-slate-800
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;