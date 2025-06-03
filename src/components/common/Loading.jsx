import React from 'react';

const Loading = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {text && (
        <span className="ms-2 text-muted">{text}</span>
      )}
    </div>
  );
};

export default Loading;
