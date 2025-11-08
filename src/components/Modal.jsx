// src/components/Modal.jsx
import React from 'react';

const Modal = ({ title, children, onClose }) => {
  return (
    // modal-overlay (Fondo oscuro fijo y centrado)
    <div 
      // La clase p-4 en el overlay es crucial para que el modal no toque los bordes en móvil
      className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    > 
      {/* Contenedor del Modal (Tarjeta blanca que contiene el contenido) */}
      <div 
        // max-w-lg w-full: Asegura que el modal tome todo el ancho en móvil, hasta un máximo en desktop.
        className="max-w-lg w-full bg-white rounded-xl shadow-2xl transform transition-all duration-300 scale-100" 
        onClick={(e) => e.stopPropagation()} // Detiene la propagación del clic
      >
        
        {/* modal-header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          {/* Ajuste de tamaño de título para responsividad */}
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {title}
          </h3>
          
          {/* modal-close-btn */}
          <button 
            className="text-gray-500 hover:text-gray-900 transition-colors p-1" 
            onClick={onClose}
          >
            <span className="text-2xl font-light leading-none">&times;</span>
          </button>
        </div>
        
        {/* modal-body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto"> 
          {children}
        </div>
        
      </div>
    </div>
  );
};

export default Modal;