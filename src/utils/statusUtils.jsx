/**
 * Status Utilities
 * Centralized status badge styling and utility functions
 */

/**
 * Get CSS class for status badges based on status value
 * @param {string} status - The status value
 * @param {string} type - The type of status (user, event, general)
 * @returns {string} Bootstrap badge CSS class
 */
export const getStatusBadgeClass = (status, type = 'general') => {
  if (!status) return 'bg-secondary';
  
  const normalizedStatus = status.toLowerCase();
  
  switch (type) {
    case 'user':
      // For users (workers, registrars, admins)
      switch (normalizedStatus) {
        case 'approved':
          return 'bg-success';
        case 'pending':
          return 'bg-warning';
        case 'rejected':
          return 'bg-danger';
        case 'inactive':
          return 'bg-secondary';
        default:
          return 'bg-secondary';
      }
      
    case 'event':
      // For events
      switch (normalizedStatus) {
        case 'active':
        case 'published':
          return 'bg-success';
        case 'upcoming':
        case 'draft':
          return 'bg-primary';
        case 'in_progress':
          return 'bg-info';
        case 'completed':
          return 'bg-secondary';
        case 'cancelled':
          return 'bg-danger';
        default:
          return 'bg-warning';
      }
      
    case 'checkin':
      // For check-in status
      switch (normalizedStatus) {
        case 'checked_in':
        case 'present':
          return 'bg-success';
        case 'not_checked_in':
        case 'absent':
          return 'bg-warning';
        case 'late':
          return 'bg-info';
        default:
          return 'bg-secondary';
      }
      
    default:
      // General purpose status
      switch (normalizedStatus) {
        case 'active':
        case 'approved':
        case 'success':
        case 'completed':
          return 'bg-success';
        case 'pending':
        case 'waiting':
        case 'processing':
          return 'bg-warning';
        case 'rejected':
        case 'failed':
        case 'error':
        case 'cancelled':
          return 'bg-danger';
        case 'inactive':
        case 'disabled':
        case 'draft':
          return 'bg-secondary';
        case 'info':
        case 'in_progress':
          return 'bg-info';
        default:
          return 'bg-secondary';
      }
  }
};

/**
 * Status Badge Component
 * Reusable status badge component with consistent styling
 */
export const StatusBadge = ({ status, type = 'general', className = '', children, ...props }) => {
  const badgeClass = getStatusBadgeClass(status, type);
  const displayText = children || status;
  
  return (
    <span 
      className={`badge ${badgeClass} ${className}`}
      {...props}
    >
      {displayText}
    </span>
  );
};

/**
 * Get status display text (formatted for UI)
 * @param {string} status - Raw status value
 * @returns {string} Formatted status text
 */
export const getStatusDisplayText = (status) => {
  if (!status) return 'Unknown';
  
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Check if status is considered "active" or positive
 * @param {string} status - Status to check
 * @param {string} type - Type of status
 * @returns {boolean} True if status is positive/active
 */
export const isActiveStatus = (status, type = 'general') => {
  if (!status) return false;
  
  const normalizedStatus = status.toLowerCase();
  const activeStatuses = {
    user: ['approved', 'active'],
    event: ['active', 'published', 'in_progress'],
    checkin: ['checked_in', 'present'],
    general: ['active', 'approved', 'success', 'completed']
  };
  
  return activeStatuses[type]?.includes(normalizedStatus) || 
         activeStatuses.general.includes(normalizedStatus);
};

/**
 * Get status icon class
 * @param {string} status - Status value
 * @param {string} type - Type of status
 * @returns {string} Bootstrap icon class
 */
export const getStatusIcon = (status, type = 'general') => {
  if (!status) return 'bi-question-circle';
  
  const normalizedStatus = status.toLowerCase();
  
  switch (type) {
    case 'user':
      switch (normalizedStatus) {
        case 'approved': return 'bi-check-circle';
        case 'pending': return 'bi-clock';
        case 'rejected': return 'bi-x-circle';
        case 'inactive': return 'bi-dash-circle';
        default: return 'bi-person';
      }
      
    case 'event':
      switch (normalizedStatus) {
        case 'active':
        case 'published': return 'bi-check-circle';
        case 'upcoming':
        case 'draft': return 'bi-calendar';
        case 'in_progress': return 'bi-play-circle';
        case 'completed': return 'bi-check-circle-fill';
        case 'cancelled': return 'bi-x-circle';
        default: return 'bi-calendar-event';
      }
      
    case 'checkin':
      switch (normalizedStatus) {
        case 'checked_in':
        case 'present': return 'bi-check-circle';
        case 'not_checked_in':
        case 'absent': return 'bi-clock';
        case 'late': return 'bi-exclamation-triangle';
        default: return 'bi-person-check';
      }
      
    default:
      switch (normalizedStatus) {
        case 'active':
        case 'approved':
        case 'success':
        case 'completed': return 'bi-check-circle';
        case 'pending':
        case 'waiting':
        case 'processing': return 'bi-clock';
        case 'rejected':
        case 'failed':
        case 'error':
        case 'cancelled': return 'bi-x-circle';
        case 'inactive':
        case 'disabled':
        case 'draft': return 'bi-dash-circle';
        case 'info':
        case 'in_progress': return 'bi-info-circle';
        default: return 'bi-question-circle';
      }
  }
};

export default {
  getStatusBadgeClass,
  StatusBadge,
  getStatusDisplayText,
  isActiveStatus,
  getStatusIcon
};
