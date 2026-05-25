import React, { useEffect, useCallback } from 'react';
import './ModalGenerico.css';

const ModalGenerico = ({ isOpen, onClose, title, children, width = '550px' }) => {
  
  // Usamos useCallback para que la función no se recree en cada render
  const handleEsc = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Agregamos el listener cuando el modal se abre
      document.addEventListener('keydown', handleEsc);
      // Opcional: Bloquear el scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    // Limpieza al cerrar o desmontar
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation evita que al hacer clic dentro del modal se cierre por el onClick del overlay */}
      <div 
        className="modal-content" 
        style={{ maxWidth: width }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 className="modal-title-custom">{title}</h2>
            <span className="modal-hint">Esc para cerrar</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
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

export default ModalGenerico;