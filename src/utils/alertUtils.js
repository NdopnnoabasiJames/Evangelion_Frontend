/**
 * Utility functions for showing alerts and notifications
 */

export const showAlert = (message, type = 'info') => {
  // Try to use SweetAlert if available, otherwise fall back to regular alert
  if (window.Swal) {
    const icons = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    
    window.Swal.fire({
      icon: icons[type] || 'info',
      title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Information',
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#0d6efd'
    });
  } else {
    // Fallback to browser alert
    alert(message);
  }
};

export const showConfirmDialog = (message, onConfirm, onCancel = null) => {
  if (window.Swal) {
    window.Swal.fire({
      title: 'Confirm Action',
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm();
      } else if (result.isDismissed && onCancel) {
        onCancel();
      }
    });
  } else {
    // Fallback to browser confirm
    if (confirm(message)) {
      onConfirm && onConfirm();
    } else {
      onCancel && onCancel();
    }
  }
};

export const showNotification = (message, type = 'info', duration = 3000) => {
  // Try to use a toast library if available
  if (window.showNotification) {
    window.showNotification(message, type);
  } else if (window.Swal) {
    const Toast = window.Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', window.Swal.stopTimer)
        toast.addEventListener('mouseleave', window.Swal.resumeTimer)
      }
    });

    const icons = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };

    Toast.fire({
      icon: icons[type] || 'info',
      title: message
    });
  } else {
    // Fallback to console log
    console.log(`${type.toUpperCase()}: ${message}`);
  }
};
