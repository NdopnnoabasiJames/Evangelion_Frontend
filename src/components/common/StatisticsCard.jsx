import React from 'react';

/**
 * Reusable Statistics Card Component
 * Consolidates duplicate statistics card patterns across the application
 */
const StatisticsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'var(--primary-purple)', 
  background,
  textColor = 'white',
  className = '',
  size = 'normal',
  badge,
  onClick
}) => {
  const cardClasses = `card border-0 shadow-sm h-100 ${className}`;
  const cardStyle = background 
    ? { background } 
    : { backgroundColor: color };

  const iconSize = size === 'large' ? '2.5rem' : '2rem';
  const titleSize = size === 'large' ? 'h5' : 'h6';
  const valueSize = size === 'large' ? 'h2' : 'h4';

  const cardContent = (
    <div className={cardClasses} style={cardStyle}>
      <div className={`card-body text-center text-${textColor}`}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <i 
              className={`bi ${icon}`} 
              style={{ 
                fontSize: iconSize, 
                color: textColor === 'white' ? 'rgba(255,255,255,0.8)' : color,
                opacity: textColor === 'white' ? 0.8 : 1
              }}
            ></i>
          </div>
          {badge && (
            <span className={`badge ${badge.className || 'bg-warning'}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div className={`${valueSize} mt-2 mb-0`} style={{ color: textColor === 'white' ? 'white' : color }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <small className={`text-${textColor === 'white' ? 'white-50' : 'muted'}`}>
          {title}
        </small>
      </div>
    </div>
  );

  return onClick ? (
    <div 
      className="cursor-pointer" 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {cardContent}
    </div>
  ) : cardContent;
};

/**
 * Statistics Cards Grid Component
 * Renders a responsive grid of statistics cards
 */
export const StatisticsGrid = ({ cards, loading = false, columns = 4 }) => {
  const getColumnClass = () => {
    switch (columns) {
      case 3: return 'col-md-4';
      case 4: return 'col-lg-3 col-md-6';
      case 5: return 'col-lg-2 col-md-4 col-sm-6';
      case 6: return 'col-lg-2 col-md-4 col-sm-6';
      default: return 'col-lg-3 col-md-6';
    }
  };

  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(cards?.length || columns)].map((_, index) => (
          <div key={index} className={getColumnClass()}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="skeleton-item mb-3" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }}></div>
                <div className="skeleton-item mb-2" style={{ width: '60px', height: '2rem', margin: '0 auto' }}></div>
                <div className="skeleton-item" style={{ width: '80px', height: '1rem', margin: '0 auto' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-4">
      {cards?.map((card, index) => (
        <div key={card.key || index} className={getColumnClass()}>
          <StatisticsCard {...card} />
        </div>
      ))}
    </div>
  );
};

/**
 * Pre-configured statistics card types for common use cases
 */
export const StatisticsCardTypes = {
  totalGuests: (value) => ({
    title: 'Total Guests',
    value,
    icon: 'bi-people',
    background: 'linear-gradient(135deg, var(--primary-purple), #7b4397)'
  }),
  
  checkedIn: (value) => ({
    title: 'Checked In',
    value,
    icon: 'bi-check-circle',
    background: 'linear-gradient(135deg, #28a745, #20c997)'
  }),
  
  busTransport: (value) => ({
    title: 'Bus Transport',
    value,
    icon: 'bi-bus-front',
    background: 'linear-gradient(135deg, #17a2b8, #6f42c1)'
  }),
  
  checkInRate: (value) => ({
    title: 'Check-in Rate',
    value: `${value}%`,
    icon: 'bi-graph-up',
    background: 'linear-gradient(135deg, var(--accent-yellow), #ffa726)'
  }),
  
  totalEvents: (value) => ({
    title: 'Total Events',
    value,
    icon: 'bi-calendar-event',
    color: 'var(--primary-purple)'
  }),
  
  totalWorkers: (value) => ({
    title: 'Total Workers',
    value,
    icon: 'bi-person-workspace',
    color: '#28a745'
  }),
  
  totalRegistrars: (value) => ({
    title: 'Total Registrars',
    value,
    icon: 'bi-clipboard-check',
    color: '#17a2b8'
  }),
    pendingApprovals: (value) => ({
    title: 'Pending Approvals',
    value,
    icon: 'bi-clock',
    color: '#ffc107',
    textColor: 'dark'  }),
  
  activeWorkers: (value) => ({
    title: 'Active Workers',
    value,
    icon: 'bi-check-circle',
    color: '#28a745'
  }),
    activeUsers: (value) => ({
    title: 'Active Users',
    value,
    icon: 'bi-person-check',
    color: '#28a745'
  }),

  totalUsers: (value) => ({
    title: 'Total Users',
    value,
    icon: 'bi-people',
    color: 'var(--primary-purple)'
  }),

  checkedInGuests: (value) => ({
    title: 'Checked In',
    value,
    icon: 'bi-check-circle',
    color: '#28a745'
  }),

  notCheckedIn: (value) => ({
    title: 'Not Checked In',
    value,
    icon: 'bi-x-circle',
    color: '#dc3545'
  }),

  // Dashboard statistics for different roles
  totalStates: (value) => ({
    title: 'Total States',
    value,
    icon: 'bi-geo-alt',
    color: 'var(--primary-purple)'
  }),

  zones: (value) => ({
    title: 'Zones',
    value,
    icon: 'bi-buildings',
    color: 'var(--primary-purple)'
  }),

  guestsRegistered: (value) => ({
    title: 'Guests Registered',
    value,
    icon: 'bi-person-plus',
    color: 'var(--primary-yellow)',
    textColor: 'dark'
  }),

  thisWeekRegistrations: (value) => ({
    title: 'This Week',
    value,
    icon: 'bi-calendar-week',
    color: 'var(--purple-light)'
  }),

  checkinsToday: (value) => ({
    title: 'Check-ins Today',
    value,
    icon: 'bi-check-circle',
    color: '#28a745'
  }),

  totalCheckins: (value) => ({
    title: 'Total Check-ins',
    value,
    icon: 'bi-clipboard-check',
    color: 'var(--primary-purple)'
  }),

  branches: (value) => ({
    title: 'Branches',
    value,
    icon: 'bi-building',
    color: '#20c997'
  }),

  activeEvents: (value) => ({
    title: 'Active Events',
    value,
    icon: 'bi-calendar-check',
    color: 'var(--primary-yellow)',
    textColor: 'dark'
  })
};

export default StatisticsCard;
