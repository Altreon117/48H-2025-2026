import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box modal-${size}`} onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}