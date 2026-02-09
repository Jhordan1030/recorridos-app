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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Panel del Modal */}
        <div
          className={`
            relative transform overflow-hidden rounded-[2.5rem] text-left shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all sm:my-8 sm:w-full ${size}
            bg-slate-950/90 backdrop-blur-3xl
            border border-white/10
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white/5 px-8 py-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white tracking-tighter">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-2xl p-2 text-white/30 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 bg-transparent text-white/70">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;