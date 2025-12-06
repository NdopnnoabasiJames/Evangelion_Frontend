import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastClass = () => {
    const baseClass = 'toast align-items-center border-0 show';
    switch (type) {
      case 'success':
        return `${baseClass} text-bg-success`;
      case 'error':
        return `${baseClass} text-bg-danger`;
      case 'warning':
        return `${baseClass} text-bg-warning`;
      default:
        return `${baseClass} text-bg-primary`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getToastClass()} role="alert" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      minWidth: '300px',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      <div className="d-flex">
        <div className="toast-body">
          <i className={`bi ${getIcon()} me-2`}></i>
          {message}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        ></button>
      </div>
    </div>
  );
};

// Toast Manager
let toastId = 0;

export const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Global function to show notifications
    window.showNotification = (message, type = 'info', duration = 4000) => {
      const id = ++toastId;
      const newToast = { id, message, type, duration };
      
      setToasts(prev => [...prev, newToast]);
    };

    return () => {
      delete window.showNotification;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ marginTop: index * 80 }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
