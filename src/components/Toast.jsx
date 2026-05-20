import { useState, useEffect, useCallback } from 'react';
import { setToastHandler } from '../utils/helpers';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    setToastHandler(addToast);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast animate-slide-up ${
            toast.type === 'error' ? 'bg-danger-600' :
            toast.type === 'success' ? 'bg-safety-600' :
            'bg-gray-900'
          }`}
        >
          <span className="text-lg">
            {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
