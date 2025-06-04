import React from 'react';
import PropTypes from 'prop-types';

/**
 * Action Button Groups for common approval/rejection patterns
 */

/**
 * Approve/Reject Button Group
 * Standardized component for approval workflows
 */
export const ApprovalActions = ({
  onApprove,
  onReject,
  itemId,
  approveText = 'Approve',
  rejectText = 'Reject',
  approveIcon = 'bi-check-lg',
  rejectIcon = 'bi-x-lg',
  disabled = false,
  loading = false,
  size = 'sm',
  variant = 'flex', // 'flex', 'inline', 'stacked'
  confirmApproval = false,
  confirmRejection = true,
  approvalMessage = 'Are you sure you want to approve this item?',
  rejectionMessage = 'Are you sure you want to reject this item?'
}) => {
  const handleApprove = async () => {
    if (confirmApproval) {
      if (!window.confirm(approvalMessage)) return;
    }
    
    if (onApprove) {
      await onApprove(itemId);
    }
  };

  const handleReject = async () => {
    if (confirmRejection) {
      if (!window.confirm(rejectionMessage)) return;
    }
    
    if (onReject) {
      await onReject(itemId);
    }
  };

  const buttonClass = `btn btn-${size}`;
  const containerClass = {
    flex: 'd-flex gap-2',
    inline: 'd-inline-flex gap-2',
    stacked: 'd-grid gap-2'
  }[variant];

  const flexClass = variant === 'flex' ? 'flex-fill' : '';

  return (
    <div className={containerClass}>
      <button
        className={`${buttonClass} btn-success ${flexClass}`}
        onClick={handleApprove}
        disabled={disabled || loading}
        type="button"
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
        ) : (
          <i className={`${approveIcon} me-1`}></i>
        )}
        {approveText}
      </button>
      
      <button
        className={`${buttonClass} btn-danger ${flexClass}`}
        onClick={handleReject}
        disabled={disabled || loading}
        type="button"
      >
        <i className={`${rejectIcon} me-1`}></i>
        {rejectText}
      </button>
    </div>
  );
};

ApprovalActions.propTypes = {
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  itemId: PropTypes.string.isRequired,
  approveText: PropTypes.string,
  rejectText: PropTypes.string,
  approveIcon: PropTypes.string,
  rejectIcon: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'normal', 'lg']),
  variant: PropTypes.oneOf(['flex', 'inline', 'stacked']),
  confirmApproval: PropTypes.bool,
  confirmRejection: PropTypes.bool,
  approvalMessage: PropTypes.string,
  rejectionMessage: PropTypes.string
};

/**
 * Single Action Button
 * Reusable button component with consistent styling
 */
export const ActionButton = ({
  onClick,
  text,
  icon,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  loading = false,
  className = '',
  confirm = false,
  confirmMessage = 'Are you sure?',
  children,
  ...props
}) => {
  const handleClick = async () => {
    if (confirm) {
      if (!window.confirm(confirmMessage)) return;
    }
    
    if (onClick) {
      await onClick();
    }
  };

  const buttonClass = `btn btn-${variant} btn-${size} ${className}`;
  const displayText = children || text;

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
      ) : (
        icon && <i className={`${icon} me-1`}></i>
      )}
      {displayText}
    </button>
  );
};

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string,
  icon: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'normal', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  confirm: PropTypes.bool,
  confirmMessage: PropTypes.string,
  children: PropTypes.node
};

/**
 * Action Group for common sets of buttons
 */
export const ActionGroup = ({
  actions = [],
  variant = 'flex', // 'flex', 'inline', 'stacked'
  size = 'sm',
  className = ''
}) => {
  const containerClass = {
    flex: 'd-flex gap-2',
    inline: 'd-inline-flex gap-2',
    stacked: 'd-grid gap-2'
  }[variant];

  return (
    <div className={`${containerClass} ${className}`}>
      {actions.map((action, index) => (
        <ActionButton
          key={index}
          size={size}
          {...action}
        />
      ))}
    </div>
  );
};

ActionGroup.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.object),
  variant: PropTypes.oneOf(['flex', 'inline', 'stacked']),
  size: PropTypes.oneOf(['sm', 'normal', 'lg']),
  className: PropTypes.string
};

/**
 * Common action configurations for different entity types
 */
export const ActionConfigurations = {
  // Worker approval actions
  workerApproval: (workerId, onApprove, onReject) => ({
    onApprove,
    onReject,
    itemId: workerId,
    approveText: 'Approve',
    rejectText: 'Reject',
    confirmRejection: true,
    rejectionMessage: 'Are you sure you want to reject this worker application? This action cannot be undone.',
    approvalMessage: 'Are you sure you want to approve this worker?'
  }),

  // Registrar approval actions
  registrarApproval: (registrarId, onApprove, onReject) => ({
    onApprove,
    onReject,
    itemId: registrarId,
    approveText: 'Approve',
    rejectText: 'Reject',
    confirmRejection: true,
    rejectionMessage: 'Are you sure you want to reject this registrar application? This action cannot be undone.',
    approvalMessage: 'Are you sure you want to approve this registrar?'
  }),

  // Event management actions
  eventManagement: (eventId, onEdit, onDelete, onPublish) => [
    {
      onClick: () => onEdit(eventId),
      text: 'Edit',
      icon: 'bi-pencil',
      variant: 'outline-primary'
    },
    {
      onClick: () => onPublish(eventId),
      text: 'Publish',
      icon: 'bi-send',
      variant: 'success'
    },
    {
      onClick: () => onDelete(eventId),
      text: 'Delete',
      icon: 'bi-trash',
      variant: 'outline-danger',
      confirm: true,
      confirmMessage: 'Are you sure you want to delete this event? This action cannot be undone.'
    }
  ],

  // Guest management actions
  guestManagement: (guestId, onEdit, onDelete, onCheckIn) => [
    {
      onClick: () => onEdit(guestId),
      text: 'Edit',
      icon: 'bi-pencil',
      variant: 'outline-primary'
    },
    {
      onClick: () => onCheckIn(guestId),
      text: 'Check In',
      icon: 'bi-check-circle',
      variant: 'success'
    },
    {
      onClick: () => onDelete(guestId),
      text: 'Remove',
      icon: 'bi-trash',
      variant: 'outline-danger',
      confirm: true,
      confirmMessage: 'Are you sure you want to remove this guest registration?'
    }
  ]
};

export default {
  ApprovalActions,
  ActionButton,
  ActionGroup,
  ActionConfigurations
};
