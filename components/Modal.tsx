import React from 'react';
import '../styles/Modal.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function Modal({ isOpen, title, message, type, onConfirm, onCancel }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal modal-${type}`}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="modal-btn-confirm">
            Confirmer
          </button>
          {onCancel && (
            <button onClick={onCancel} className="modal-btn-cancel">
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}