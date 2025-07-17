import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import '../../../styles/components.css';

const NotificationTab = ({ isReadOnly = false }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState(isReadOnly ? 'history' : 'create');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [transportFilter, setTransportFilter] = useState('all');
  const [notification, setNotification] = useState({
    notificationType: 'email',
    subject: '',
    message: '',
    timing: 'immediate'
  });
  const [preview, setPreview] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(new Set());

  const timingOptions = [
    { value: 'immediate', label: 'Send Immediately' },
    { value: '1_hour', label: '1 Hour Before Event' },
    { value: '6_hours', label: '6 Hours Before Event' },
    { value: '1_day', label: '1 Day Before Event' },
    { value: '3_days', label: '3 Days Before Event' },
    { value: '1_week', label: '1 Week Before Event' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchNotificationHistory();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventGuests();
    }
  }, [selectedEvent, transportFilter]);

  useEffect(() => {
    applyHistoryFilters();
  }, [notificationHistory, historyFilters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/accessible');
      const eventsArray = response.data?.data || [];
      setEvents(eventsArray);
    } catch (error) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventGuests = async () => {
    if (!selectedEvent) return;
    
    try {
      const response = await api.get(`/api/notifications/events/${selectedEvent}/guests?transportFilter=${transportFilter}`);
      const guestsArray = response.data?.data || response.data?.guests || response.data || [];
      setGuests(Array.isArray(guestsArray) ? guestsArray : []);
      setSelectedGuests([]);
    } catch (error) {
      setError('Failed to fetch event guests');
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const response = await api.get('/api/notifications/history');
      const historyData = response.data?.data || response.data || [];
      
      // Debug: Log first notification to see structure
      if (historyData.length > 0) {
      }
      
      setNotificationHistory(historyData);
    } catch (error) {
      setError('Failed to fetch notification history');
    }
  };

  const handleGuestSelection = (guestId) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const selectAllGuests = () => {
    setSelectedGuests(Array.isArray(guests) ? guests.map(guest => guest._id) : []);
  };

  const clearSelection = () => {
    setSelectedGuests([]);
  };

  const toggleMessageExpansion = (notificationId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedMessages(newExpanded);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        // Silently fail
      }
      document.body.removeChild(textArea);
    }
  };

  const generatePreview = async () => {
    const isSubjectRequired = notification.notificationType !== 'sms';
    
    if (!selectedEvent) {
      setError('Please select an event');
      return;
    }
    
    if (selectedGuests.length === 0) {
      setError('Please select at least one guest');
      return;
    }
    
    if (isSubjectRequired && !notification.subject) {
      setError('Please enter a subject');
      return;
    }
    
    if (!notification.message) {
      setError('Please enter a message');
      return;
    }

    try {
      setError('');
      
      const payload = {
        eventId: selectedEvent,
        recipients: selectedGuests,
        notificationType: notification.notificationType,
        subject: notification.subject || 'Event Notification',
        message: notification.message
      };
      
      const response = await api.post('/api/notifications/preview', payload);
      const previewData = response.data.data || response.data;
      setPreview(previewData);
    } catch (error) {
      setError('Failed to generate preview: ' + (error.response?.data?.message || error.message));
    }
  };

  const sendNotification = async () => {
    const isSubjectRequired = notification.notificationType !== 'sms';
    
    if (!selectedEvent || selectedGuests.length === 0 || 
        (isSubjectRequired && !notification.subject) || !notification.message) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/notifications', {
        eventId: selectedEvent,
        recipients: selectedGuests,
        notificationType: notification.notificationType,
        subject: notification.subject || 'Event Notification',
        message: notification.message,
        timing: notification.timing
      });      
      
      // Reset form and switch to history view
      setNotification({ notificationType: 'email', subject: '', message: '', timing: 'immediate' });
      setSelectedEvent(null);
      setSelectedGuests([]);
      setPreview(null);
      
      // Refresh notification history and switch to history tab
      await fetchNotificationHistory();
      setActiveView('history');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      setError(`Failed to send notification: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const applyHistoryFilters = () => {
    let filtered = [...notificationHistory];

    // Filter by status
    if (historyFilters.status !== 'all') {
      filtered = filtered.filter(notification => {
        const status = notification.status?.toUpperCase();
        const totalFailed = (notification.failedCount || 0) + (notification.failedSmsCount || 0);
        const totalSuccess = (notification.successfulCount || 0) + (notification.successfulSmsCount || 0);
        
        if (historyFilters.status === 'delivered') {
          return status === 'SENT' && totalFailed === 0;
        } else if (historyFilters.status === 'partial') {
          return status === 'SENT' && totalFailed > 0 && totalSuccess > 0;
        } else if (historyFilters.status === 'failed') {
          return status === 'FAILED' || (status === 'SENT' && totalSuccess === 0);
        } else if (historyFilters.status === 'pending') {
          return status === 'PENDING' || status === 'SCHEDULED';
        } else {
          return status === historyFilters.status.toUpperCase();
        }
      });
    }

    // Filter by notification type
    if (historyFilters.type !== 'all') {
      filtered = filtered.filter(notification => 
        notification.notificationType?.toLowerCase() === historyFilters.type.toLowerCase()
      );
    }

    // Filter by date range
    if (historyFilters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (historyFilters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (historyFilters.dateRange !== 'all') {
        filtered = filtered.filter(notification => {
          const notificationDate = new Date(notification.createdAt || notification.sentAt);
          return notificationDate >= cutoffDate;
        });
      }
    }

    setFilteredHistory(filtered);
  };

  const retryNotification = async (notificationId) => {
    const loadingSet = new Set(actionLoading);
    loadingSet.add(notificationId);
    setActionLoading(loadingSet);
    
    try {
      const response = await api.post(`/api/notifications/${notificationId}/retry`);
      
      if (response.data.success) {
        await fetchNotificationHistory();
        setActiveView('history');
      } else {
        setError('Failed to retry notification');
      }
    } catch (error) {
      setError('Failed to retry notification: ' + (error.response?.data?.message || error.message));
    } finally {
      const newLoadingSet = new Set(actionLoading);
      newLoadingSet.delete(notificationId);
      setActionLoading(newLoadingSet);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    const loadingSet = new Set(actionLoading);
    loadingSet.add(notificationId);
    setActionLoading(loadingSet);
    
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      
      if (response.data.success) {
        // Immediately remove from state without waiting for API call
        setNotificationHistory(prev => prev.filter(n => n._id !== notificationId));
        setFilteredHistory(prev => prev.filter(n => n._id !== notificationId));
      } else {
        setError('Failed to delete notification');
      }
    } catch (error) {
      setError('Failed to delete notification: ' + (error.response?.data?.message || error.message));
      // Refresh on error to sync state
      await fetchNotificationHistory();
    } finally {
      const newLoadingSet = new Set(actionLoading);
      newLoadingSet.delete(notificationId);
      setActionLoading(newLoadingSet);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setHistoryFilters({
      status: 'all',
      type: 'all',
      dateRange: 'all'
    });
  };

  const renderCreateView = () => (
    <div className="notification-create">
      <h3>Create Notification</h3>
      
      {/* Event Selection */}
      <div className="form-group">
        <label>Select Event:</label>
        <select 
          value={selectedEvent || ''} 
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="form-control"
        >
          <option value="">Choose an event...</option>
          {Array.isArray(events) && events.map(event => (
            <option key={event._id} value={event._id}>
              {event.name} - {event.date}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* Transport Filter */}
          <div className="form-group">
            <label>Filter Recipients:</label>
            <select 
              value={transportFilter} 
              onChange={(e) => setTransportFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">All Guests</option>
              <option value="bus">Bus Transport Only</option>
              <option value="private">Private Transport Only</option>
            </select>
          </div>

          {/* Guest Selection */}
          <div className="form-group">
            <label>Select Recipients ({selectedGuests.length} of {Array.isArray(guests) ? guests.length : 0} selected):</label>
            <div className="guest-selection-controls">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={selectAllGuests}
                disabled={!Array.isArray(guests) || guests.length === 0}
              >
                Select All
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={clearSelection}
              >
                Clear Selection
              </button>
            </div>
            <div className="guest-list">
              {Array.isArray(guests) && guests.length > 0 ? (
                guests.map(guest => (
                  <div key={guest._id} className="guest-item">
                    <input
                      type="checkbox"
                      checked={selectedGuests.includes(guest._id)}
                      onChange={() => handleGuestSelection(guest._id)}
                    />
                    <div className="guest-info">
                      <span className="guest-name">{guest.name}</span>
                      <span className="guest-contact">📧 {guest.email}</span>
                      <span className="guest-contact">📱 {guest.phone || 'No phone'}</span>
                    </div>
                    <span className="transport-badge">
                      {guest.transportPreference === 'church_bus' ? 'Bus' : 'Private'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {loading ? 'Loading guests...' : 'No guests found for this event'}
                </div>
              )}
            </div>
          </div>

          {/* Notification Details */}
          <div className="form-group">
            <label>Notification Type:</label>
            <div className="notification-type-selection">
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    value="email" 
                    checked={notification.notificationType === 'email'}
                    onChange={(e) => setNotification({...notification, notificationType: e.target.value})}
                  />
                  <span className="radio-text">📧 Email Only</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    value="sms" 
                    checked={notification.notificationType === 'sms'}
                    onChange={(e) => setNotification({...notification, notificationType: e.target.value})}
                  />
                  <span className="radio-text">📱 SMS Only</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    value="both" 
                    checked={notification.notificationType === 'both'}
                    onChange={(e) => setNotification({...notification, notificationType: e.target.value})}
                  />
                  <span className="radio-text">📧Email & 📱SMS</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Subject{notification.notificationType === 'sms' ? ' (Optional for SMS)' : ''}:</label>
            <input
              type="text"
              value={notification.subject}
              onChange={(e) => setNotification({...notification, subject: e.target.value})}
              className="form-control"
              placeholder={notification.notificationType === 'sms' ? 'Subject (optional for SMS)' : 'Enter email subject...'}
              required={notification.notificationType !== 'sms'}
            />
          </div>

          <div className="form-group">
            <label>
              Message:
              {(notification.notificationType === 'sms' || notification.notificationType === 'both') && (
                <span className={`character-count ${notification.message.length > 160 ? 'over-limit' : ''}`}>
                  {notification.message.length}/160 characters
                  {notification.message.length > 160 && ' (Will be truncated for SMS)'}
                </span>
              )}
            </label>
            <textarea
              value={notification.message}
              onChange={(e) => setNotification({...notification, message: e.target.value})}
              className="form-control"
              rows="6"
              placeholder={
                notification.notificationType === 'sms' 
                  ? 'Enter your SMS message (recommended: 160 characters or less)...'
                  : notification.notificationType === 'both'
                  ? 'Enter your message (SMS will be truncated to 160 characters)...'
                  : 'Enter your message...'
              }
            />
            {(notification.notificationType === 'sms' || notification.notificationType === 'both') && (
              <small className="form-text text-muted">
                📱 SMS messages over 160 characters will be automatically truncated with "..." added.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Send Time:</label>
            <select 
              value={notification.timing} 
              onChange={(e) => setNotification({...notification, timing: e.target.value})}
              className="form-control"
            >
              {timingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="notification-actions">
            <button 
              type="button" 
              className="btn btn-info"
              onClick={generatePreview}
            >
              <i className="bi bi-eye me-2"></i> Preview
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={sendNotification}
              disabled={loading}
            >
              <i className="bi bi-send me-2"></i> {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
          
          <div className="help-text">
            <i className="bi bi-info-circle me-1"></i>
            <small>After sending, check the <strong>Notification History</strong> tab to view delivery status and details.</small>
          </div>
        </>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="notification-preview">
      <h3>Notification Preview</h3>
      {preview && (
        <div className="preview-content">
          <div className="preview-header">
            <h4>Subject: {preview.subject}</h4>
            <p>Recipients: {preview.recipientCount} people</p>
          </div>
          <div className="preview-message">
            <h5>Message:</h5>
            <div className="message-content">{preview.message}</div>
          </div>
          <div className="preview-recipients">
            <h5>Recipients:</h5>
            <ul>
              {preview.recipients && Array.isArray(preview.recipients) ? preview.recipients.map(recipient => (
                <li key={recipient.email}>{recipient.name} - {recipient.email}</li>
              )) : <li>No recipients found</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="notification-history">
      <div className="history-header">
        <h3><i className="bi bi-clock-history me-2"></i>Notification History</h3>
        <div className="history-stats">
          {Array.isArray(filteredHistory) && (
            <>
              <span className="filtered-count">
                Showing: {filteredHistory.length} of {notificationHistory.length}
              </span>
              {filteredHistory.length !== notificationHistory.length && (
                <button 
                  className="btn btn-link btn-sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
              {/* Quick stats */}
              {filteredHistory.length > 0 && (
                <div className="quick-stats">
                  <span className="stat-pill success">
                    ✅ {filteredHistory.filter(n => {
                      const status = n.status?.toUpperCase();
                      const totalFailed = (n.failedCount || 0) + (n.failedSmsCount || 0);
                      return status === 'SENT' && totalFailed === 0;
                    }).length} Delivered
                  </span>
                  <span className="stat-pill warning">
                    ⚠️ {filteredHistory.filter(n => {
                      const status = n.status?.toUpperCase();
                      const totalFailed = (n.failedCount || 0) + (n.failedSmsCount || 0);
                      const totalSuccess = (n.successfulCount || 0) + (n.successfulSmsCount || 0);
                      return status === 'SENT' && totalFailed > 0 && totalSuccess > 0;
                    }).length} Partial
                  </span>
                  <span className="stat-pill danger">
                    ❌ {filteredHistory.filter(n => {
                      const status = n.status?.toUpperCase();
                      const totalSuccess = (n.successfulCount || 0) + (n.successfulSmsCount || 0);
                      return status === 'FAILED' || (status === 'SENT' && totalSuccess === 0);
                    }).length} Failed
                  </span>
                  <span className="stat-pill info">
                    ⏳ {filteredHistory.filter(n => {
                      const status = n.status?.toUpperCase();
                      return status === 'PENDING' || status === 'SCHEDULED';
                    }).length} Pending
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={historyFilters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-control filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">✅ Fully Delivered</option>
            <option value="partial">⚠️ Partially Delivered</option>
            <option value="failed">❌ Failed</option>
            <option value="pending">⏳ Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={historyFilters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="form-control filter-select"
          >
            <option value="all">All Types</option>
            <option value="email">📧 Email Only</option>
            <option value="sms">📱 SMS Only</option>
            <option value="both">📧📱 Both</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select 
            value={historyFilters.dateRange} 
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="form-control filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      <div className="history-list">
        {Array.isArray(filteredHistory) && filteredHistory.length > 0 ? (
          filteredHistory.map(notification => (
            <div key={notification._id} className="history-item">
              <div className="history-main">
                <div className="history-left">
                  <div className="notification-type-badge">
                    {notification.notificationType === 'SMS' && <i className="bi bi-phone"></i>}
                    {notification.notificationType === 'EMAIL' && <i className="bi bi-envelope"></i>}
                    {notification.notificationType === 'BOTH' && (
                      <>
                        <i className="bi bi-envelope"></i>
                        <i className="bi bi-phone"></i>
                      </>
                    )}
                    <span className="type-text">
                      {notification.isRetry && <i className="bi bi-arrow-clockwise me-1" title="Retry notification"></i>}
                      {notification.notificationType || 'EMAIL'}
                    </span>
                  </div>
                  <div className="history-content">
                    <h4 className="notification-subject">{notification.subject}</h4>
                    <div className="notification-message-container">
                      <div className="notification-message-preview">
                        {expandedMessages.has(notification._id) 
                          ? notification.message 
                          : notification.message?.length > 100 
                            ? `${notification.message.substring(0, 100)}...` 
                            : notification.message}
                      </div>
                      {notification.message?.length > 100 && (
                        <div className="message-actions">
                          <button 
                            className="btn-link"
                            onClick={() => toggleMessageExpansion(notification._id)}
                          >
                            {expandedMessages.has(notification._id) ? '🔼 Show less' : '🔽 Show full message'}
                          </button>
                          <button 
                            className="btn-link"
                            onClick={() => copyToClipboard(notification.message)}
                            title="Copy message to clipboard"
                          >
                            📋 Copy
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="event-info">
                      <i className="bi bi-calendar-event me-1"></i>
                      <strong>{notification.eventId?.name || 'Unknown Event'}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="history-right">
                  <div className="status-section">
                    <span className={`status-badge ${notification.status?.toLowerCase()}`}>
                      {notification.status === 'SENT' && <i className="bi bi-check-circle me-1"></i>}
                      {notification.status === 'FAILED' && <i className="bi bi-x-circle me-1"></i>}
                      {notification.status === 'PENDING' && <i className="bi bi-clock me-1"></i>}
                      {notification.status === 'SCHEDULED' && <i className="bi bi-calendar-clock me-1"></i>}
                      {notification.status === 'SENDING' && <i className="bi bi-hourglass-split me-1"></i>}
                      {notification.status}
                    </span>
                  </div>
                  
                  <div className="recipient-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Recipients</span>
                      <span className="stat-value">{notification.totalRecipients || 0}</span>
                    </div>
                    <div className="stat-item success">
                      <span className="stat-label">Successful</span>
                      <span className="stat-value">
                        {(notification.successfulCount || 0) + (notification.successfulSmsCount || 0)}
                      </span>
                    </div>
                    {((notification.failedCount || 0) + (notification.failedSmsCount || 0)) > 0 && (
                      <div className="stat-item failed">
                        <span className="stat-label">Failed</span>
                        <span className="stat-value">
                          {(notification.failedCount || 0) + (notification.failedSmsCount || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="timestamp">
                    <i className="bi bi-clock me-1"></i>
                    {notification.sentAt 
                      ? new Date(notification.sentAt).toLocaleString() 
                      : 'Not sent yet'}
                  </div>
                </div>
              </div>
              
              {notification.timing && (
                <div className="timing-info">
                  <i className="bi bi-stopwatch me-1"></i>
                  <span>Timing: {notification.timing}</span>
                </div>
              )}

              {/* Action buttons */}
              {!isReadOnly && (
                <div className="history-actions">
                  {/* Show retry for failed notifications or notifications with any failures */}
                  {(() => {
                    const status = notification.status?.toUpperCase();
                    const totalFailed = (notification.failedCount || 0) + (notification.failedSmsCount || 0);
                    const hasFailed = status === 'FAILED' || totalFailed > 0;
                    return hasFailed;
                  })() && (
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => retryNotification(notification._id)}
                      disabled={actionLoading.has(notification._id)}
                      title="Retry failed deliveries"
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      {actionLoading.has(notification._id) ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => deleteNotification(notification._id)}
                    disabled={actionLoading.has(notification._id)}
                    title="Delete this notification"
                  >
                    <i className="bi bi-trash me-1"></i>
                    {actionLoading.has(notification._id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-inbox"></i>
            </div>
            <h4>
              {historyFilters.status !== 'all' || historyFilters.type !== 'all' || historyFilters.dateRange !== 'all' 
                ? 'No Notifications Match Your Filters' 
                : 'No Notifications Yet'
              }
            </h4>
            <p>
              {loading 
                ? 'Loading notification history...' 
                : historyFilters.status !== 'all' || historyFilters.type !== 'all' || historyFilters.dateRange !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Create your first notification to see it here'
              }
            </p>
            {(historyFilters.status !== 'all' || historyFilters.type !== 'all' || historyFilters.dateRange !== 'all') && (
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="notification-tab">
      <div className="tab-header">
        <h2><i className="bi bi-envelope me-2"></i> Notifications</h2>
        <div className="tab-nav">
          {!isReadOnly && (
            <button 
              className={activeView === 'create' ? 'active' : ''}
              onClick={() => setActiveView('create')}
            >
              Create Notification
            </button>
          )}
          <button 
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            History
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeView === 'create' && !isReadOnly && renderCreateView()}
      {activeView === 'history' && renderHistory()}
      {preview && renderPreview()}
    </div>
  );
};

export default NotificationTab;