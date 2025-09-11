import React from 'react';
import './ConfirmationModal.css'; 

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">{cancelText}</button>
          <button onClick={onConfirm} className="confirm-delete-btn">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;