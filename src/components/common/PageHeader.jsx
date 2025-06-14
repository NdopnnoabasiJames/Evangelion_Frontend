import React from 'react';

/**
 * Reusable Page Header Component
 * Consolidates duplicate page header patterns across the application
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  actions = [], 
  breadcrumbs = [], 
  className = '',
  showDivider = true,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const getTitleSize = () => {
    switch (size) {
      case 'small': return 'h4';
      case 'large': return 'h1';
      default: return 'h3';
    }
  };

  const headerClasses = `d-flex justify-content-between align-items-center ${showDivider ? 'mb-4' : 'mb-3'} ${className}`;

  return (
    <>
      {breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-2">
          <ol className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <li 
                key={index} 
                className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
              >
                {crumb.link && index !== breadcrumbs.length - 1 ? (
                  <a href={crumb.link} className="text-decoration-none">
                    {crumb.icon && <i className={`bi ${crumb.icon} me-1`}></i>}
                    {crumb.label}
                  </a>
                ) : (
                  <>
                    {crumb.icon && <i className={`bi ${crumb.icon} me-1`}></i>}
                    {crumb.label}
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className={headerClasses}>
        <div>
          <h1 className={`${getTitleSize()} mb-0`} style={{ color: 'var(--primary-purple)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted mb-0 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="d-flex gap-2 flex-wrap">
            {actions.map((action, index) => (
              <ActionButton key={index} {...action} />
            ))}
          </div>
        )}
      </div>
      
      {showDivider && <hr className="border-0" style={{ height: '1px', background: 'var(--bs-border-color)' }} />}
    </>
  );
};

/**
 * Action Button Component for Page Headers
 */
const ActionButton = ({ 
  label, 
  icon, 
  onClick, 
  variant = 'primary', 
  size = 'normal',
  disabled = false,
  loading = false,
  dropdown = null,
  href = null,
  target = '_self'
}) => {
  const sizeClass = size === 'small' ? 'btn-sm' : size === 'large' ? 'btn-lg' : '';
  const buttonClasses = `btn btn-${variant} ${sizeClass}`.trim();

  const buttonContent = (
    <>
      {loading ? (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      ) : (
        icon && <i className={`bi ${icon} me-2`}></i>
      )}
      {label}
      {dropdown && <i className="bi bi-chevron-down ms-2"></i>}
    </>
  );

  if (dropdown) {
    return (
      <div className="dropdown">
        <button
          className={`${buttonClasses} dropdown-toggle`}
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          disabled={disabled || loading}
        >
          {buttonContent}
        </button>
        <ul className="dropdown-menu">
          {dropdown.items.map((item, index) => (
            <li key={index}>
              {item.divider ? (
                <hr className="dropdown-divider" />
              ) : (
                <button
                  className="dropdown-item"
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.icon && <i className={`bi ${item.icon} me-2`}></i>}
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={buttonClasses}
        role="button"
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      {buttonContent}
    </button>
  );
};

/**
 * Pre-configured header configurations for common use cases
 */
export const HeaderConfigurations = {
  // Standard admin management page
  adminManagement: (entityName, canCreate = false, onRefresh, onCreate) => ({
    title: `${entityName} Management`,
    subtitle: `Comprehensive ${entityName.toLowerCase()} management and analytics`,
    actions: [
      {
        label: 'Refresh',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefresh
      },
      ...(canCreate ? [{
        label: `Add ${entityName}`,
        icon: 'bi-plus-circle',
        variant: 'primary',
        onClick: onCreate
      }] : [])
    ]
  }),

  // Worker-specific pages
  workerDashboard: (workerName, onRefresh) => ({
    title: 'My Dashboard',
    subtitle: `Welcome back, ${workerName}`,
    actions: [
      {
        label: 'Refresh',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefresh
      },
      {
        label: 'Register Guest',
        icon: 'bi-person-plus',
        variant: 'primary',
        onClick: () => {/* Navigate to registration */}
      }
    ]
  }),

  // Analytics pages
  analytics: (onExportPDF, onExportCSV) => ({
    title: 'Analytics Dashboard',
    subtitle: 'System-wide analytics and insights',
    actions: [
      {
        label: 'Export PDF',
        icon: 'bi-download',
        variant: 'outline-primary',
        onClick: onExportPDF
      },
      {
        label: 'Export CSV',
        icon: 'bi-file-earmark-spreadsheet',
        variant: 'outline-success',
        onClick: onExportCSV
      }
    ]
  }),

  // Check-in pages
  checkIn: (selectedEvent, events = [], onEventChange, onRefresh) => ({
    title: 'Guest Check-in',
    subtitle: 'Search and check-in guests for events',
    actions: [
      {
        label: 'Select Event',
        icon: 'bi-calendar-event',
        variant: 'outline-primary',
        dropdown: {
          items: events.map(event => ({
            label: event.name,
            onClick: () => onEventChange(event._id),
            active: selectedEvent === event._id
          }))
        }
      },
      {
        label: 'Refresh Stats',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-secondary',
        onClick: onRefresh,
        disabled: !selectedEvent
      }
    ]  }),

  // Worker management for different roles
  workerManagement: (role, onRefresh, onExport) => ({
    title: 'Workers Management',
    subtitle: 'Manage worker applications and performance',
    actions: [
      {
        label: 'Refresh',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefresh
      },
      {
        label: 'Export Data',
        icon: 'bi-download',
        variant: 'outline-success',
        onClick: onExport
      }
    ]  }),

  // Registrar management for different roles
  registrarManagement: (role, onRefresh, onExport) => ({
    title: 'Registrars Management',
    subtitle: 'Manage registrar applications and zone assignments',
    actions: [
      {
        label: 'Refresh',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefresh
      },
      {
        label: 'Export Data',
        icon: 'bi-download',
        variant: 'outline-success',
        onClick: onExport
      }
    ]
  }),

  // Guest management for different roles
  guestManagement: (role, onRefresh, onExport) => ({
    title: role === 'WORKER' ? 'My Guests' : 'Guest Management',
    subtitle: role === 'WORKER' 
      ? 'Manage guests you have registered' 
      : 'Comprehensive guest management and analytics',
    actions: [
      {
        label: 'Refresh',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefresh
      },
      ...(role !== 'WORKER' ? [{
        label: 'Export Data',
        icon: 'bi-download',
        variant: 'outline-success',
        onClick: onExport
      }] : []),
      ...(role === 'WORKER' ? [{
        label: 'Register New Guest',
        icon: 'bi-person-plus',
        variant: 'primary',
        onClick: () => {/* Navigate to registration */}
      }] : [])
    ]
  }),

  // Check-in system for registrars
  checkInSystem: (onRefreshStats) => ({
    title: 'Guest Check-in System',
    subtitle: 'Search for guests and manage event check-ins',
    actions: [
      {
        label: 'Refresh Stats',
        icon: 'bi-arrow-clockwise',
        variant: 'outline-primary',
        onClick: onRefreshStats
      }
    ]
  }),
  // Dashboard header for different roles
  dashboard: (role, name, onRefresh, stateInfo = null, branchInfo = null) => {
    let title = 'Dashboard';
    let subtitle = `Welcome back, ${name}`;

    // Customize title and subtitle based on role and location
    if (role === 'state_admin' && stateInfo) {
      title = `${stateInfo.name} State Admin Dashboard`;
      subtitle = `Welcome back, ${name} - Managing ${stateInfo.name}`;
    } else if (role === 'branch_admin' && branchInfo) {
      title = `${branchInfo.name} Admin Dashboard`;
      subtitle = `Welcome back, ${name} - Managing ${branchInfo.name}`;
    } else if (role === 'super_admin') {
      title = 'Super Admin Dashboard';
      subtitle = `Welcome back, ${name} - System Administrator`;
    }

    return {
      title,
      subtitle,
      actions: [
        {
          label: 'Refresh',
          icon: 'bi-arrow-clockwise',
          variant: 'outline-primary',
          onClick: onRefresh
        }
      ]
    };
  }
};

export { ActionButton };
export default PageHeader;
