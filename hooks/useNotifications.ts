'use client'

import { useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface Modal {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<Modal | null>(null);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showModal = (title: string, message: string, type: Modal['type'], onConfirm: () => void, onCancel?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm, onCancel });
  };

  const closeModal = () => {
    setModal(null);
  };

  return {
    toasts,
    modal,
    showToast,
    removeToast,
    showModal,
    closeModal
  };
}
