import React, { useState, useEffect } from 'react';
import './EditPostModal.css';

const EditPostModal = ({ isOpen, onClose, onSave, initialContent, content, title }) => {
  const [editedText, setEditedText] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedText(initialContent);
  }, [initialContent, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedText);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <textarea
            className="edit-textarea"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows="10"
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">{content.cancelLabel}</button>
          <button onClick={handleSave} className="save-btn" disabled={isSaving}>
            {isSaving ? content.savingButton : content.saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;