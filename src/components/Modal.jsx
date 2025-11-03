// src/components/Modal.jsx
import React from 'react';

const Modal = ({ title, children, onClose }) => {
  return (
    // Overlay (fondo oscuro)
    <div className="modal-overlay" onClick={onClose}> 
      {/* Contenedor del Modal */}
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} // Detiene la propagación del clic para que no se cierre al hacer clic dentro
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;