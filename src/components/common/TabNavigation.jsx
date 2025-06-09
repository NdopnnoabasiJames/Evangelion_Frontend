import React from 'react';

/**
 * Reusable Tab Navigation Component
 * Consolidates duplicate tab navigation patterns across the application
 */
const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '', 
  variant = 'pills', // 'pills' or 'tabs'
  justify = false,
  vertical = false
}) => {
  const navClasses = [
    'nav',
    variant === 'pills' ? 'nav-pills' : 'nav-tabs',
    justify ? 'nav-justified' : '',
    vertical ? 'flex-column' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <ul className={navClasses} role="tablist">
      {tabs.map((tab) => (
        <li key={tab.key} className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === tab.key ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            type="button"
            role="tab"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.key)}
            style={tab.style}
          >
            {tab.icon && <i className={`bi ${tab.icon} me-2`}></i>}
            {tab.label}
            {tab.badge && (
              <span className={`badge ${tab.badge.className || 'bg-secondary'} ms-2`}>
                {tab.badge.count}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
};

/**
 * Tab Content Wrapper Component
 * Provides consistent styling for tab content
 */
export const TabContent = ({ children, className = '' }) => {
  return (
    <div className={`tab-content mt-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Individual Tab Pane Component
 */
export const TabPane = ({ 
  isActive, 
  children, 
  className = '', 
  loading = false, 
  error = null,
  emptyState = null
}) => {
  if (!isActive) return null;

  const paneClasses = `tab-pane fade show active ${className}`;

  if (loading) {
    return (
      <div className={paneClasses}>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={paneClasses}>
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (emptyState && (!children || (Array.isArray(children) && children.length === 0))) {
    return (
      <div className={paneClasses}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={paneClasses}>
      {children}
    </div>
  );
};

/**
 * Complete Tabbed Interface Component
 * Combines navigation and content for easier usage
 */
export const TabbedInterface = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children,
  navClassName = '',
  contentClassName = '',
  variant = 'pills',
  justify = false,
  vertical = false
}) => {
  // Clone children with isActive prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TabPane) {
      return React.cloneElement(child, {
        isActive: child.props.tabId === activeTab
      });
    }
    return child;
  });

  return (
    <div className={vertical ? 'row' : ''}>
      <div className={vertical ? 'col-md-3' : ''}>
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className={navClassName}
          variant={variant}
          justify={justify}
          vertical={vertical}
        />
      </div>
      <div className={vertical ? 'col-md-9' : ''}>
        <TabContent className={contentClassName}>
          {childrenWithProps}
        </TabContent>
      </div>
    </div>
  );
};

/**
 * Pre-configured tab configurations for common use cases
 */
export const TabConfigurations = {
  // Common admin tabs
  adminManagement: (counts = {}) => [
    {
      key: 'list',
      label: 'Active List',
      icon: 'bi-list-ul'
    },
    {
      key: 'pending',
      label: 'Pending Approvals',
      icon: 'bi-clock',
      badge: counts.pending ? { count: counts.pending, className: 'bg-warning' } : null
    },
    {
      key: 'performance',
      label: 'Performance',
      icon: 'bi-graph-up'
    }
  ],

  // Worker specific tabs
  workerTabs: (counts = {}) => [
    {
      key: 'list',
      label: 'All Workers',
      icon: 'bi-people'
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: 'bi-clock',
      badge: counts.pending ? { count: counts.pending, className: 'bg-warning' } : null
    },
    {
      key: 'performance',
      label: 'Top Performers',
      icon: 'bi-trophy'
    }
  ],

  // Registrar specific tabs
  registrarTabs: (counts = {}) => [
    {
      key: 'list',
      label: 'All Registrars',
      icon: 'bi-clipboard-check'
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: 'bi-clock',
      badge: counts.pending ? { count: counts.pending, className: 'bg-warning' } : null
    },
    {
      key: 'zones',
      label: 'Zone Assignments',
      icon: 'bi-geo'
    },
    {
      key: 'performance',
      label: 'Performance',
      icon: 'bi-bar-chart'
    }  ],

  // Worker management tabs
  workerManagement: (rolePermissions = {}) => {
    const { canApproveWorkers, canManageWorkers } = rolePermissions;
    const tabs = [
      {
        key: 'list',
        label: 'All Workers',
        icon: 'bi-people'
      }
    ];

    if (canApproveWorkers) {
      tabs.push({
        key: 'pending',
        label: 'Pending Approval',
        icon: 'bi-clock'
      });
    }

    tabs.push({
      key: 'performance',
      label: 'Performance',
      icon: 'bi-graph-up'
    });

    return tabs;  },

  // Registrar management tabs
  registrarManagement: (rolePermissions = {}) => {
    const { canApproveRegistrars, canManageRegistrars, canAssignZones } = rolePermissions;
    const tabs = [
      {
        key: 'list',
        label: 'All Registrars',
        icon: 'bi-clipboard-check'
      }
    ];

    if (canApproveRegistrars) {
      tabs.push({
        key: 'pending',
        label: 'Pending Approval',
        icon: 'bi-clock'
      });
    }

    if (canAssignZones) {
      tabs.push({
        key: 'zones',
        label: 'Zone Assignments',
        icon: 'bi-geo'
      });
    }

    tabs.push({
      key: 'performance',
      label: 'Performance',
      icon: 'bi-bar-chart'
    });

    return tabs;
  },

  // Check-in tabs
  checkInTabs: () => [
    {
      key: 'search',
      label: 'Check-in',
      icon: 'bi-search'
    },
    {
      key: 'stats',
      label: 'Statistics',
      icon: 'bi-graph-up'
    }
  ],
  // Guest management tabs
  guestManagement: (rolePermissions = {}) => {
    const { canRegisterGuests, canManageGuests } = rolePermissions;
    const tabs = [
      {
        key: 'list',
        label: 'Guest List',
        icon: 'bi-list'
      }
    ];

    if (canRegisterGuests) {
      tabs.push({
        key: 'register',
        label: 'Register Guest',
        icon: 'bi-person-plus'
      });
    }

    if (canManageGuests) {
      tabs.push({
        key: 'analytics',
        label: 'Analytics',  
        icon: 'bi-graph-up'
      });
    }

    return tabs;
  },

  // Guest management tabs (old format for compatibility)
  guestTabs: (role, counts = {}) => {
    const baseTabs = [
      {
        key: 'list',
        label: role === 'WORKER' ? 'My Guests' : 'All Guests',
        icon: 'bi-people'
      }
    ];

    if (role !== 'WORKER') {
      baseTabs.push(
        {
          key: 'search',
          label: 'Search & Filter',
          icon: 'bi-funnel'
        },
        {
          key: 'analytics',
          label: 'Analytics',
          icon: 'bi-bar-chart'
        }
      );
    }

    return baseTabs;
  },

  // Check-in system tabs for registrars
  checkInSystem: () => [
    {
      key: 'search',
      label: 'Guest Search & Check-in',
      icon: 'bi-search'
    },
    {
      key: 'stats',
      label: 'Statistics',
      icon: 'bi-graph-up'
    }
  ]
};

export default TabNavigation;
