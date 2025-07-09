import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import '../../../styles/components.css';

const NotificationTab = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('create');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/accessible');
      // Extract the actual array from the nested response structure
      const eventsArray = response.data?.data || [];
      setEvents(eventsArray);
    } catch (error) {
      console.error('❌ [NotificationTab] Failed to fetch events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventGuests = async () => {
    if (!selectedEvent) return;
    
    try {
      const response = await api.get(`/api/notifications/events/${selectedEvent}/guests?transportFilter=${transportFilter}`);
      
      // Extract the actual array from the nested response structure
      const guestsArray = response.data?.data || response.data?.guests || response.data || [];
      
      setGuests(Array.isArray(guestsArray) ? guestsArray : []);
      setSelectedGuests([]);
    } catch (error) {
      console.error('❌ [NotificationTab] Failed to fetch event guests:', error);
      setError('Failed to fetch event guests');
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const response = await api.get('/api/notifications/history');
      
      // Extract the actual data from the nested response structure
      const historyData = response.data?.data || response.data || [];
      
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

  const generatePreview = async () => {
    console.log('🔄 [NotificationTab] Preview button clicked!');
    console.log('📊 [NotificationTab] Current state:', {
      selectedEvent,
      selectedGuestsCount: selectedGuests.length,
      notificationType: notification.notificationType,
      subject: notification.subject,
      message: notification.message
    });
    
    // For SMS notifications, subject is optional
    const isSubjectRequired = notification.notificationType !== 'sms';
    console.log('🔍 [NotificationTab] Is subject required?', isSubjectRequired);
    
    if (!selectedEvent) {
      console.log('❌ [NotificationTab] No event selected');
      setError('Please select an event');
      return;
    }
    
    if (selectedGuests.length === 0) {
      console.log('❌ [NotificationTab] No guests selected');
      setError('Please select at least one guest');
      return;
    }
    
    if (isSubjectRequired && !notification.subject) {
      console.log('❌ [NotificationTab] Subject required but not provided');
      setError('Please enter a subject');
      return;
    }
    
    if (!notification.message) {
      console.log('❌ [NotificationTab] No message provided');
      setError('Please enter a message');
      return;
    }

    try {
      console.log('🔍 [NotificationTab] All validations passed, generating preview...');
      setError(''); // Clear any previous errors
      
      const payload = {
        eventId: selectedEvent,
        recipients: selectedGuests,
        notificationType: notification.notificationType,
        subject: notification.subject || 'Event Notification',
        message: notification.message
      };
      
      console.log('🔍 [NotificationTab] Sending preview request with payload:', payload);
      
      const response = await api.post('/api/notifications/preview', payload);
      
      console.log('✅ [NotificationTab] Preview response:', response);
      console.log('📊 [NotificationTab] Preview data structure:', response.data);
      
      // Handle the response structure - check if it's wrapped
      const previewData = response.data.data || response.data;
      console.log('📋 [NotificationTab] Final preview data:', previewData);
      setPreview(previewData);
    } catch (error) {
      console.error('❌ [NotificationTab] Preview error:', error);
      setError('Failed to generate preview: ' + (error.response?.data?.message || error.message));
    }
  };

  const sendNotification = async () => {
    // For SMS notifications, subject is optional
    const isSubjectRequired = notification.notificationType !== 'sms';
    
    if (!selectedEvent || selectedGuests.length === 0 || 
        (isSubjectRequired && !notification.subject) || !notification.message) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [NotificationTab] Sending notification:', {
        eventId: selectedEvent,
        recipients: selectedGuests,
        notificationType: notification.notificationType,
        subject: notification.subject,
        message: notification.message,
        timing: notification.timing
      });
      
      const response = await api.post('/api/notifications', {
        eventId: selectedEvent,
        recipients: selectedGuests,
        notificationType: notification.notificationType,
        subject: notification.subject || 'Event Notification', // Default subject if not provided
        message: notification.message,
        timing: notification.timing
      });      
      
      console.log('✅ [NotificationTab] Send notification response:', response);
      alert(`${notification.notificationType.charAt(0).toUpperCase() + notification.notificationType.slice(1)} notification sent successfully!`);
      setNotification({ notificationType: 'email', subject: '', message: '', timing: 'immediate' });
      setSelectedEvent(null);
      setSelectedGuests([]);
      setPreview(null);
      fetchNotificationHistory();
    } catch (error) {
      console.error('❌ [NotificationTab] Failed to send notification:', error);
      setError('Failed to send notification');
    } finally {
      setLoading(false);
    }
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
          {Array.isArray(notificationHistory) && notificationHistory.length > 0 && (
            <span className="total-count">
              Total: {notificationHistory.length} notifications
            </span>
          )}
        </div>
      </div>
      
      <div className="history-list">
        {Array.isArray(notificationHistory) && notificationHistory.length > 0 ? (
          notificationHistory.map(notification => (
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
                    {notification.notificationType || 'EMAIL'}
                  </div>
                  <div className="history-content">
                    <h4 className="notification-subject">{notification.subject}</h4>
                    <div className="notification-message-preview">
                      {notification.message?.length > 100 
                        ? `${notification.message.substring(0, 100)}...` 
                        : notification.message}
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
                      <span className="stat-value">{notification.successfulCount || 0}</span>
                    </div>
                    {notification.failedCount > 0 && (
                      <div className="stat-item failed">
                        <span className="stat-label">Failed</span>
                        <span className="stat-value">{notification.failedCount}</span>
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
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-inbox"></i>
            </div>
            <h4>No Notifications Yet</h4>
            <p>{loading ? 'Loading notification history...' : 'Create your first notification to see it here'}</p>
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
          <button 
            className={activeView === 'create' ? 'active' : ''}
            onClick={() => setActiveView('create')}
          >
            Create Notification
          </button>
          <button 
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            History
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeView === 'create' && renderCreateView()}
      {activeView === 'history' && renderHistory()}
      {preview && renderPreview()}
    </div>
  );
};

export default NotificationTab;
