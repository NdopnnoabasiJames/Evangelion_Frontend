import React from 'react';

const Loading = ({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'spinner',
  fullHeight = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  const containerClasses = [
    'd-flex', 
    'justify-content-center', 
    'align-items-center',
    fullHeight ? 'min-vh-50' : 'p-4',
    overlay ? 'loading-overlay' : '',
    className
  ].filter(Boolean).join(' ');

  if (variant === 'skeleton') {
    return (
      <div className={containerClasses}>
        <div className="loading-skeleton">
          <div className="skeleton-item mb-3" style={{ width: '60%', height: '1.5rem' }}></div>
          <div className="skeleton-item mb-2" style={{ width: '100%', height: '1rem' }}></div>
          <div className="skeleton-item mb-2" style={{ width: '80%', height: '1rem' }}></div>
          <div className="skeleton-item" style={{ width: '40%', height: '1rem' }}></div>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={containerClasses}>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {text && (
          <span className="ms-3 text-muted">{text}</span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {text && (
        <span className="ms-2 text-muted">{text}</span>
      )}
    </div>
  );
};

// Error component for better error handling
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showDetails = false,
  variant = 'card', // 'card', 'alert', 'inline'
  className = ''
}) => {
  const errorMessage = typeof error === 'string' ? error : 'An unexpected error occurred';

  if (variant === 'alert') {
    return (
      <div className={`alert alert-danger ${className}`}>
        <i className="bi bi-exclamation-triangle me-2"></i>
        <strong>{title}</strong>
        <p className="mb-0 mt-1">{errorMessage}</p>
        {onRetry && (
          <button className="btn btn-outline-danger btn-sm mt-2" onClick={onRetry}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`text-center py-3 ${className}`}>
        <i className="bi bi-exclamation-triangle text-danger me-2"></i>
        <span className="text-danger">{errorMessage}</span>
        {onRetry && (
          <button className="btn btn-link btn-sm p-0 ms-2" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`error-state text-center py-5 ${className}`}>
      <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
      <h4>{title}</h4>
      <p className="text-muted mb-3">{errorMessage}</p>
      {showDetails && error?.stack && (
        <details className="text-start mt-3">
          <summary className="btn btn-link p-0">Show technical details</summary>
          <pre className="mt-2 p-2 bg-light border rounded small">
            {error.stack}
          </pre>
        </details>
      )}
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Try Again
        </button>
      )}
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon = 'bi-inbox',
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  action,
  className = '',
  variant = 'default' // 'default', 'search', 'filter'
}) => {
  const getEmptyStateConfig = () => {
    switch (variant) {
      case 'search':
        return {
          icon: 'bi-search',
          title: 'No search results',
          description: 'Try adjusting your search terms or filters to find what you\'re looking for.'
        };
      case 'filter':
        return {
          icon: 'bi-funnel',
          title: 'No filtered results',
          description: 'No items match the current filter criteria. Try adjusting your filters.'
        };
      default:
        return { icon, title, description };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <div className={`empty-state text-center py-5 ${className}`}>
      <i className={`bi ${config.icon} text-muted fs-1 mb-3`}></i>
      <h4 className="text-muted">{config.title}</h4>
      <p className="text-muted">{config.description}</p>
      {action && action}
    </div>
  );
};

// Loading card wrapper for better UX
export const LoadingCard = ({ 
  loading, 
  error, 
  onRetry, 
  children, 
  className = '',
  minHeight = '200px' 
}) => {
  const cardClasses = [
    'card',
    'border-0',
    'shadow-sm',
    loading ? 'loading-card' : '',
    className
  ].filter(Boolean).join(' ');

  if (error) {
    return (
      <div className={cardClasses} style={{ minHeight }}>
        <div className="card-body">
          <ErrorDisplay error={error} onRetry={onRetry} />
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses} style={{ minHeight }}>
      {loading && <Loading overlay />}
      {children}
    </div>
  );
};

// Skeleton loading patterns for different content types
export const SkeletonLoader = ({ 
  type = 'card', 
  count = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return (
          <div className="skeleton-table">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-table-row d-flex gap-3 mb-3">
                <div className="skeleton-item" style={{ width: '20%', height: '1.5rem' }}></div>
                <div className="skeleton-item" style={{ width: '30%', height: '1.5rem' }}></div>
                <div className="skeleton-item" style={{ width: '25%', height: '1.5rem' }}></div>
                <div className="skeleton-item" style={{ width: '25%', height: '1.5rem' }}></div>
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="skeleton-list">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="skeleton-list-item d-flex align-items-center gap-3 mb-3 p-3 border rounded">
                <div className="skeleton-item rounded-circle" style={{ width: '48px', height: '48px' }}></div>
                <div className="flex-grow-1">
                  <div className="skeleton-item mb-2" style={{ width: '60%', height: '1.25rem' }}></div>
                  <div className="skeleton-item" style={{ width: '40%', height: '1rem' }}></div>
                </div>
                <div className="skeleton-item" style={{ width: '80px', height: '32px' }}></div>
              </div>
            ))}
          </div>
        );
      
      case 'stats':
        return (
          <div className="row g-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <div className="skeleton-item rounded-circle mx-auto mb-3" style={{ width: '48px', height: '48px' }}></div>
                    <div className="skeleton-item mx-auto mb-2" style={{ width: '60px', height: '2rem' }}></div>
                    <div className="skeleton-item mx-auto" style={{ width: '80px', height: '1rem' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default: // card
        return (
          <div className="row g-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="skeleton-item mb-3" style={{ width: '70%', height: '1.5rem' }}></div>
                    <div className="skeleton-item mb-2" style={{ width: '100%', height: '1rem' }}></div>
                    <div className="skeleton-item mb-2" style={{ width: '60%', height: '1rem' }}></div>
                    <div className="skeleton-item" style={{ width: '40%', height: '1rem' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`skeleton-loader ${className}`}>
      {renderSkeleton()}
    </div>
  );
};

// Comprehensive data list state manager
export const DataListState = ({ 
  loading, 
  error, 
  data, 
  emptyState,
  onRetry,
  children,
  skeletonType = 'card',
  skeletonCount = 6,
  className = ''
}) => {
  if (loading) {
    return <SkeletonLoader type={skeletonType} count={skeletonCount} className={className} />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyState || <EmptyState className={className} />;
  }

  return children;
};

// Loading overlay for existing content
export const LoadingOverlay = ({ 
  show, 
  text = 'Loading...', 
  children,
  blur = true 
}) => {
  return (
    <div className="position-relative">
      {children}
      {show && (
        <>
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75"
            style={{ zIndex: 10 }}
          >
            <div className="text-center">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">{text}</span>
              </div>
              <div className="text-muted small">{text}</div>
            </div>
          </div>
          {blur && (
            <div 
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ 
                backdropFilter: 'blur(2px)', 
                zIndex: 9 
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Loading;
