import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAVIGATION_ITEMS, ROLES } from '../../utils/constants';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation items based on user role
  const getNavItems = () => {
    const userRole = user?.currentRole || user?.role;
    if (!userRole) return [];
    return NAVIGATION_ITEMS[userRole] || [];
  };

  const navItems = getNavItems();

  const handleNavClick = (path) => {
    navigate(path);
    // Auto-collapse sidebar on mobile after navigation
    if (window.innerWidth < 992) {
      setCollapsed(true);
    }
  };

  // Icon mapping for Bootstrap Icons
  const getIcon = (iconName) => {
    const iconMap = {
      dashboard: 'bi-speedometer2',
      event: 'bi-calendar-event',
      people: 'bi-people',
      work: 'bi-person-workspace',
      assignment: 'bi-clipboard-check',
      analytics: 'bi-graph-up'
    };
    return iconMap[iconName] || 'bi-circle';
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {!collapsed && (
        <div 
          className="d-lg-none position-fixed w-100 h-100 bg-dark bg-opacity-50"
          style={{ top: 0, left: 0, zIndex: 1040 }}
          onClick={() => setCollapsed(true)}
        />
      )}      {/* Sidebar */}
      <div 
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: '56px', // Height of navbar
          left: collapsed ? '-250px' : '0',
          width: '250px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          transition: 'left 0.3s ease',
          zIndex: 1050,
          borderRight: '1px solid #dee2e6',
          background: `linear-gradient(180deg, var(--primary-purple) 0%, var(--purple-dark) 100%)`,
          color: 'var(--white)'
        }}
      >
        <div className="p-3">
          {/* User info section */}
          <div className="mb-4 pb-3 border-bottom">            <div className="d-flex align-items-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                   style={{ 
                     width: '40px', 
                     height: '40px',
                     backgroundColor: 'var(--primary-yellow)'
                   }}>
                <i className="bi bi-person-fill" style={{ color: 'var(--purple-darker)' }}></i>
              </div>
              <div>
                <div className="fw-semibold small text-white">{user?.name || 'User'}</div>
                <div className="small" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {(user?.currentRole || user?.role)?.replace('_', ' ') || 'Role'}
                </div>
              </div>
            </div></div>

          {/* Navigation items */}
          <nav className="nav flex-column">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item.path)}                className={`nav-link d-flex align-items-center py-2 px-3 rounded mb-1 border-0 text-start w-100 ${
                  location.pathname === item.path 
                    ? 'text-dark' 
                    : 'text-white bg-transparent'
                }`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: location.pathname === item.path ? 'var(--primary-yellow)' : 'transparent'
                }}                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <i className={`bi ${getIcon(item.icon)} me-3`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Quick actions section */}          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h6 className="small mb-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Quick Actions</h6>
            <div className="d-grid gap-2">
              {((user?.currentRole || user?.role) === ROLES.REGISTRAR || 
                (user?.currentRole || user?.role) === ROLES.WORKER) && (
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleNavClick('/check-in')}
                >
                  <i className="bi bi-qr-code-scan me-2"></i>
                  Quick Check-in
                </button>
              )}
              
              {((user?.currentRole || user?.role) !== ROLES.GUEST && (user?.currentRole || user?.role) !== ROLES.REGISTRAR) && (
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleNavClick('/events/new')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  New Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
