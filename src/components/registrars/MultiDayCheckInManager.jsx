import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const MultiDayCheckInManager = ({ event, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState(new Set());
  const [eventDates, setEventDates] = useState([]);

  // Generate date range for the multiday event
  useEffect(() => {
    if (event && (event.eventType === 'multi-day' || event.eventType === 'multi-day-specific')) {
      const dates = getEventDates(event);
      setEventDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]); // Default to first date
      }
    }
  }, [event]);

  // Load attendance data when date changes
  useEffect(() => {
    if (selectedDate && event) {
      loadAttendanceData();
    }
  }, [selectedDate, event]);

  const getEventDates = (event) => {
    if (!event) return [];
    
    if (event.eventType === 'multi-day-specific') {
      // For specific dates, return the array of dates
      return (event.specificDates || []).map(date => 
        new Date(date).toISOString().split('T')[0]
      ).sort();
    } else if (event.eventType === 'multi-day') {
      // For consecutive multi-day events, generate date range
      const dates = [];
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]); // Format: "2025-08-11"
      }
      
      return dates;
    }
    
    return [];
  };

  const loadAttendanceData = async () => {
    if (!selectedDate || !event) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/registrars/events/${event._id}/daily-attendance/${selectedDate}`);      
      // The actual data is nested inside response.data.data
      const attendanceInfo = response.data.data || response.data;
      
      setAttendanceData(attendanceInfo);
    } catch (error) {
      console.error('❌ Error loading attendance data:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (guestId) => {
    try {
      
      await api.post(`/api/registrars/events/${event._id}/guests/${guestId}/daily-checkin`, {
        date: selectedDate
      });
      toast.success('Guest checked in successfully');
      loadAttendanceData(); // Refresh data
    } catch (error) {
      console.error('❌ Error checking in guest:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to check in guest');
    }
  };

  const handleBulkCheckIn = async () => {
    if (selectedGuests.size === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    try {
      const response = await api.post(`/api/registrars/events/${event._id}/daily-checkin/bulk`, {
        guestIds: Array.from(selectedGuests),
        date: selectedDate
      });

      if (response.data.success > 0) {
        toast.success(`${response.data.success} guests checked in successfully`);
      }
      if (response.data.failed > 0) {
        toast.error(`${response.data.failed} guests failed to check in`);
      }

      setSelectedGuests(new Set());
      loadAttendanceData(); // Refresh data
    } catch (error) {
      console.error('Error bulk checking in guests:', error);
      toast.error('Failed to bulk check in guests');
    }
  };

  const handleGuestSelection = (guestId) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const handleSelectAll = () => {
    if (!attendanceData) return;
    
    const notCheckedInIds = attendanceData.notCheckedInGuests.map(guest => guest._id);
    const filteredIds = notCheckedInIds.filter(id => 
      isGuestInSearch(attendanceData.notCheckedInGuests.find(g => g._id === id))
    );
    
    if (selectedGuests.size === filteredIds.length) {
      setSelectedGuests(new Set()); // Deselect all
    } else {
      setSelectedGuests(new Set(filteredIds)); // Select all filtered
    }
  };

  const isGuestInSearch = (guest) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      guest.name.toLowerCase().includes(query) ||
      guest.phone?.toLowerCase().includes(query) ||
      guest.email?.toLowerCase().includes(query)
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!event || (event.eventType !== 'multi-day' && event.eventType !== 'multi-day-specific')) {
    return (
      <div className="alert alert-warning">
        This component is only for multi-day events.
      </div>
    );
  }

  const filteredNotCheckedIn = attendanceData?.notCheckedInGuests?.filter(isGuestInSearch) || [];
  const filteredCheckedIn = attendanceData?.checkedInGuests?.filter(record => 
    isGuestInSearch(record.guestId)
  ) || [];

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-calendar-check me-2"></i>
              Daily Check-in: {event.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {/* Event Info */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-info me-2">
                    {event.eventType === 'multi-day-specific' ? 'Multi-Day Event (Specific Dates)' : 'Multi-Day Event'}
                  </span>
                  <span className="text-muted">
                    {event.eventType === 'multi-day-specific'
                      ? `${eventDates.length} specific dates`
                      : `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                    }
                  </span>
                </div>
              </div>
              <div className="col-md-4 text-end">
                {attendanceData && (
                  <div className="attendance-summary">
                    <strong className="text-success">{attendanceData.checkedInCount}</strong>
                    <span className="text-muted">/{attendanceData.totalGuests} checked in</span>
                  </div>
                )}
              </div>
            </div>

            {/* Date Navigation */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Select Date:</label>
              <div className="btn-group w-100" role="group">
                {eventDates.map(date => (
                  <button
                    key={date}
                    type="button"
                    className={`btn ${selectedDate === date ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button
                  className="btn btn-outline-secondary me-2"
                  onClick={handleSelectAll}
                  disabled={filteredNotCheckedIn.length === 0}
                >
                  {selectedGuests.size === filteredNotCheckedIn.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleBulkCheckIn}
                  disabled={selectedGuests.size === 0}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Check In Selected ({selectedGuests.size})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {/* Not Checked In */}
                <div className="col-md-6">
                  <h6 className="text-warning">
                    <i className="bi bi-clock me-1"></i>
                    Not Checked In ({filteredNotCheckedIn.length})
                  </h6>
                  <div className="guest-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredNotCheckedIn.length === 0 ? (
                      <div className="alert alert-info">
                        {searchQuery ? 'No guests found matching search.' : 'All guests checked in!'}
                      </div>
                    ) : (
                      filteredNotCheckedIn.map(guest => (
                        <div key={guest._id} className="card mb-2">
                          <div className="card-body py-2">
                            <div className="row align-items-center">
                              <div className="col-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedGuests.has(guest._id)}
                                  onChange={() => handleGuestSelection(guest._id)}
                                />
                              </div>
                              <div className="col-7">
                                <div className="fw-semibold">{guest.name}</div>
                                <small className="text-muted">{guest.phone || guest.email}</small>
                              </div>
                              <div className="col-4 text-end">
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleCheckIn(guest._id)}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Check In
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Checked In */}
                <div className="col-md-6">
                  <h6 className="text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Checked In ({filteredCheckedIn.length})
                  </h6>
                  <div className="guest-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredCheckedIn.length === 0 ? (
                      <div className="alert alert-warning">
                        {searchQuery ? 'No checked-in guests found matching search.' : 'No guests checked in yet.'}
                      </div>
                    ) : (
                      filteredCheckedIn.map(record => (
                        <div key={record._id} className="card mb-2 border-success">
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold">{record.guestId.name}</div>
                                <small className="text-muted">{record.guestId.phone || record.guestId.email}</small>
                              </div>
                              <div className="text-end">
                                <small className="text-success fw-semibold">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {formatTime(record.checkInTime)}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiDayCheckInManager;
