import { ROLES } from './constants';
import { showAlert } from './alertUtils';

/**
 * Utility functions for handling read-only M&E roles
 */

export const isReadOnlyRole = (role) => {
  return [ROLES.SUPER_ME, ROLES.BRANCH_ME].includes(role);
};

export const showReadOnlyAlert = (action = 'perform this action') => {
  showAlert(
    `You are in Monitoring & Evaluation mode and cannot ${action}. This is a read-only role for data viewing and analysis only.`,
    'warning'
  );
};

export const handleReadOnlyAction = (userRole, action = 'perform this action') => {
  if (isReadOnlyRole(userRole)) {
    showReadOnlyAlert(action);
    return false; // Prevent the action
  }
  return true; // Allow the action
};

/**
 * Higher-order function to wrap actions with read-only checks
 */
export const withReadOnlyCheck = (userRole, actionDescription) => (originalAction) => {
  return (...args) => {
    if (isReadOnlyRole(userRole)) {
      showReadOnlyAlert(actionDescription);
      return Promise.reject(new Error('Action not allowed for read-only role'));
    }
    return originalAction(...args);
  };
};

/**
 * Component props helper for disabling buttons for read-only roles
 */
export const getReadOnlyProps = (userRole, actionDescription) => {
  if (isReadOnlyRole(userRole)) {
    return {
      disabled: true,
      title: `M&E role cannot ${actionDescription}`,
      onClick: () => showReadOnlyAlert(actionDescription)
    };
  }
  return {};
};
