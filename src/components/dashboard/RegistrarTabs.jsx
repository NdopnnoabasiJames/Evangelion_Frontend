import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import api from '../../services/api';
import RoleSwitchingSection from './RoleSwitchingSection';
import MultiDayCheckInManager from '../registrars/MultiDayCheckInManager';
import MultiDayAttendanceReport from '../registrars/MultiDayAttendanceReport';
import VolunteerSelectionModal from '../events/VolunteerSelectionModal';

const RegistrarTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const isPCU = user?.role === ROLES.PCU;
  const isIntern = user?.role === ROLES.INTERN;
  const isRegistrar = user?.role === ROLES.REGISTRAR;
  const canMarkFirstTimers = isPCU || isIntern; // Both PCU and INTERN can mark first timers
  
  // Helper function to get the appropriate event end date for comparison/sorting
  const getEventEndDate = (event) => {
    if (event.eventType === 'multi-day') {
      return event.endDate || event.startDate || event.date;
    } else if (event.eventType === 'multi-day-specific') {
      // For specific dates, use the latest date in the specificDates array
      if (event.specificDates && event.specificDates.length > 0) {
        const dates = event.specificDates.map(date => new Date(date));
        return Math.max(...dates);
      }
      return event.date; // fallback
    }
    return event.date;
  };

  // Helper function to check if event is active/expired (upcoming)
  const isEventActive = (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Handle multi-day events
    if (event.eventType === 'multi-day') {
      if (event.endDate) {
        const endDate = new Date(event.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day for end date
        return endDate >= today;
      } else if (event.startDate) {
        // If no endDate, use startDate
        const startDate = new Date(event.startDate);
        startDate.setHours(23, 59, 59, 999);
        return startDate >= today;
      }
    }
    
    // Handle multi-day-specific events
    if (event.eventType === 'multi-day-specific') {
      const eventEndDate = getEventEndDate(event);
      if (eventEndDate) {
        const endDate = new Date(eventEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day for event date
        return endDate >= today;
      }
    }
    
    // Handle single-day events
    if (event.date) {
      const eventDate = new Date(event.date);
      eventDate.setHours(23, 59, 59, 999); // End of day for event date
      return eventDate >= today;
    }
    
    // If no date is available, consider it inactive (exclude "Date TBD" events)
    return false;
  };

  // Helper function to check if event needs approval (vs auto-approved)
  const needsApproval = (event) => {
    if (!user?.branch) return true;
    
    const userBranchId = user.branch._id || user.branch;
    
    // Auto-approved conditions:
    // 1. Event created by user's branch pastor
    // 2. Event delegated to user's branch (in selectedBranches or availableBranches)
    
    const isBranchEvent = event.selectedBranches?.some(branch => 
      (branch._id || branch).toString() === userBranchId.toString()
    );
    
    const isDelegatedToBranch = event.availableBranches?.some(branch => 
      (branch._id || branch).toString() === userBranchId.toString()
    );
    
    return !isBranchEvent && !isDelegatedToBranch;
  };

  // Helper function to check if registrar has volunteered for an event
  const hasRegistrarVolunteered = (event) => {
    if (!user?._id) return false;
    
    // Check if volunteerStatus is set and indicates registrar volunteered
    if (event.volunteerStatus && ['approved', 'pending', 'rejected'].includes(event.volunteerStatus)) {
      return true;
    }
    
    return false;
  };
  
  const [activeTab, setActiveTab] = useState('overview');
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [eventGuests, setEventGuests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('active');
  const [showMultiDayCheckIn, setShowMultiDayCheckIn] = useState(false);
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerEvent, setVolunteerEvent] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    totalEvents: 0,
    totalEventsVolunteered: 0,
    totalRegisteredGuests: 0,
    totalCheckedInGuests: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadOverviewStats();
        break;
      case 'all-events':
        loadAllEvents();
        break;
      case 'my-events':
        loadAllEvents(); // Load all events so we can filter to show registrar's events including expired ones
        break;
      default:
        break;
    }
  }, [activeTab]);

  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.STATS);
      
      const data = response.data;
      const actualData = data.data || data;
      const stats = actualData.stats || actualData;
      
      const normalizedStats = {
        totalEvents: stats.eventsCount || 0,                        // My Events (approved events)
        totalEventsVolunteered: stats.totalEventsVolunteered || 0,  // Total volunteer requests
        totalRegisteredGuests: stats.guestsCount || 0,              // Guests registered by registrar
        totalCheckedInGuests: stats.guestsCheckedInCount || 0       // Guests checked in by registrar
      };
      
      setOverviewStats(normalizedStats);
    } catch (err) {
      console.error('[RegistrarTabs] Error loading overview stats:', err);
      console.error('[RegistrarTabs] Error details:', err.response?.data);
      setError('Failed to load overview statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use /api/events to get ALL historical events including expired ones
      const response = await api.get(API_ENDPOINTS.EVENTS.LIST);
      const eventsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // Add volunteer status to each event for the current user based on their role
      const eventsWithStatus = eventsData.map(event => {
        let volunteerStatus = 'none';
        
        if (isPCU || isIntern) {
          // For PCU/INTERN, check workers array (approved) and volunteerRequests
          const isApproved = event.workers && Array.isArray(event.workers) && 
            event.workers.some(workerId => {
              const id = typeof workerId === 'object' ? workerId._id || workerId.toString() : workerId.toString();
              return id === user._id.toString();
            });
          
          // Check if user has volunteer request
          const hasRequest = event.volunteerRequests && Array.isArray(event.volunteerRequests) &&
            event.volunteerRequests.some(request => {
              const workerId = typeof request.workerId === 'object' ? 
                request.workerId._id || request.workerId.toString() : request.workerId.toString();
              return workerId === user._id.toString();
            });
          
          if (isApproved) {
            volunteerStatus = 'approved';
          } else if (hasRequest) {
            const request = event.volunteerRequests.find(req => {
              const workerId = typeof req.workerId === 'object' ? 
                req.workerId._id || req.workerId.toString() : req.workerId.toString();
              return workerId === user._id.toString();
            });
            volunteerStatus = request.status || 'pending';
          }
        } else {
          // For REGISTRAR, check registrars array (approved) and registrarRequests
          const isApproved = event.registrars && Array.isArray(event.registrars) && 
            event.registrars.some(registrarId => {
              const id = typeof registrarId === 'object' ? registrarId._id || registrarId.toString() : registrarId.toString();
              return id === user._id.toString();
            });
          
          // Check if registrar has volunteer request (correct field name: registrarRequests)
          const hasRequest = event.registrarRequests && Array.isArray(event.registrarRequests) &&
            event.registrarRequests.some(request => {
              const registrarId = typeof request.registrarId === 'object' ? 
                request.registrarId._id || request.registrarId.toString() : request.registrarId.toString();
              return registrarId === user._id.toString();
            });
          
          if (isApproved) {
            volunteerStatus = 'approved';
          } else if (hasRequest) {
            const request = event.registrarRequests.find(req => {
              const registrarId = typeof req.registrarId === 'object' ? 
                req.registrarId._id || req.registrarId.toString() : req.registrarId.toString();
              return registrarId === user._id.toString();
            });
            volunteerStatus = request.status || 'pending';
          }
        }
        
        return { ...event, volunteerStatus };
      });
      
      setAllEvents(eventsWithStatus);
    } catch (err) {
      console.error('❌ [RegistrarTabs] Error loading all events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadMyEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // PCU/INTERN use the worker "my events" endpoint, not registrar
      const endpoint = (isPCU || isIntern)
        ? API_ENDPOINTS.WORKERS.MY_EVENTS
        : API_ENDPOINTS.REGISTRARS.MY_EVENTS;

      const response = await api.get(endpoint);
      setMyEvents(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error('Error loading my events:', err);
      setError('Failed to load my events');
    } finally {
      setLoading(false);
    }
  };

  const isApprovedVolunteer = (event) => {
    if (!event || !user) return false;
    const currentUserId = user.userId || user.id || user._id;

    // For PCU/INTERN, check workers array or volunteerRequests approved status
    if (isPCU || isIntern) {
      if (event.workers && Array.isArray(event.workers)) {
        if (event.workers.some(w => (typeof w === 'object' ? w._id : w) === currentUserId)) return true;
      }
      if (event.volunteerRequests && Array.isArray(event.volunteerRequests)) {
        const req = event.volunteerRequests.find(r => (typeof r.workerId === 'object' ? r.workerId._id : r.workerId) === currentUserId);
        if (req && req.status === 'approved') return true;
      }
      return false;
    }

    // For REGISTRAR, check registrars array or registrarRequests approved status
    if (isRegistrar) {
      if (event.registrars && Array.isArray(event.registrars)) {
        if (event.registrars.some(r => (typeof r === 'object' ? r._id : r) === currentUserId)) return true;
      }
      if (event.registrarRequests && Array.isArray(event.registrarRequests)) {
        const req = event.registrarRequests.find(r => (typeof r.registrarId === 'object' ? r.registrarId._id : r.registrarId) === currentUserId);
        if (req && req.status === 'approved') return true;
      }
      return false;
    }

    return false;
  };

  const loadEventGuests = async (eventId, eventObj = null) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      // PCUs and INTERNs use volunteer-based guest endpoint
      if (isPCU || isIntern) {
        // If we have the event object, ensure the user is approved to access guests
        if (eventObj && !isApprovedVolunteer(eventObj)) {
          // User is not approved for this event — avoid calling backend which returns 400
          setError('You need to volunteer and be approved for this event to access guest data.');
          setEventGuests([]);
          return;
        }

        response = await api.get(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_EVENT_GUESTS}/${eventId}/guests`);
      } else {
        // REGISTRARs use standard guest endpoint
        response = await api.get(`${API_ENDPOINTS.REGISTRARS.BASE}/events/${eventId}/guests`);
      }
      
      const allGuests = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // The backend already handles filtering for PCU users (checked-in guests who aren't first timers)
      // and for INTERN users, so we don't need additional filtering here
      let filteredGuests;
      if (isIntern) {
        // For INTERN users, only show guests that have been marked as first timers
        filteredGuests = allGuests.filter(guest => guest.firstTimer === true);
      } else {
        // For PCU and REGISTRAR users, the backend already handles the filtering
        filteredGuests = allGuests;
      }
      
      setEventGuests(filteredGuests);
    } catch (err) {
      console.error('Error loading event guests:', err);
      
      // Handle different types of authorization errors with user-friendly messages
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Failed to load event guests';
        
        if (errorMessage.includes('pending approval')) {
          setError('Your volunteer request is pending approval. Please wait for approval to access guest data.');
        } else if (errorMessage.includes('rejected')) {
          setError('Your volunteer request was rejected. You cannot access guest data for this event.');
        } else if (errorMessage.includes('not approved')) {
          setError('You need to volunteer and be approved for this event to access guest data.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to load event guests. Please try again.');
      }
      
      // Set empty guest list when access is denied
      setEventGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerForEvent = async (eventId, selectionData = null) => {
    try {
      let response;
      
      // Prepare request body with optional targetStateId and targetBranchId
      const requestBody = {};
      if (selectionData) {
        requestBody.targetStateId = selectionData.stateId;
        requestBody.targetBranchId = selectionData.branchId;
      }
      
      // PCUs and INTERNs use worker volunteer endpoint
      if (isPCU || isIntern) {
        response = await api.post(`${API_ENDPOINTS.WORKERS.BASE}/events/${eventId}/volunteer`, requestBody);
      } else {
        // REGISTRARs use registrar volunteer endpoint
        response = await api.post(`${API_ENDPOINTS.REGISTRARS.BASE}/events/${eventId}/volunteer`, requestBody);
      }

      const result = response.data;
      
      if (result?.status === 'approved') {
        alert('Successfully volunteered! You can now register guests for this event.');
      } else if (result?.status === 'pending') {
        alert('Volunteer request submitted for approval.');
      } else {
        alert('Successfully volunteered for event!');
      }
      
      loadAllEvents(); // Refresh the events list
    } catch (err) {
      console.error('Error volunteering for event:', err);
      const errorMessage = err.response?.data?.message || 'Error volunteering for event';
      alert(`Failed to volunteer: ${errorMessage}`);
    }
  };

  // Handle volunteer button click - show modal if approval needed
  const handleVolunteerClick = (event) => {
    if (needsApproval(event)) {
      // Show modal for state/branch selection
      setVolunteerEvent(event);
      setShowVolunteerModal(true);
    } else {
      // Auto-approved - call the volunteer handler directly
      handleVolunteerForEvent(event._id);
    }
  };

  // Handle volunteer confirmation from modal
  const handleVolunteerConfirm = (selectionData) => {
    if (volunteerEvent) {
      // Call the volunteer handler with selection data
      handleVolunteerForEvent(volunteerEvent._id, selectionData);
      setVolunteerEvent(null);
    }
  };

  // REGISTRARs can check in guests, PCUs/INTERNs cannot
  const handleCheckInGuest = async (guestId) => {
    if (isPCU || isIntern) {
      alert('PCUs and INTERNs cannot check in guests. You can only mark already checked-in guests as first timers.');
      return;
    }
    
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.VOLUNTEER_CHECKIN}/${selectedEvent._id}/guests/${guestId}/checkin`);
      
      // Refresh the guest list
      loadEventGuests(selectedEvent._id);
      // Refresh stats
      loadOverviewStats();
    } catch (err) {
      console.error('Error checking in guest:', err);
      const errorMessage = err.response?.data?.message || 'Error checking in guest';
      alert(`Failed to check in guest: ${errorMessage}`);
    }
  };

  const handleMarkFirstTimer = async (guestId) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.REGISTRARS.BASE}/guests/${guestId}/mark-first-timer`);
      
      // Refresh the guest list
      loadEventGuests(selectedEvent._id);
      // Refresh stats
      loadOverviewStats();
      
      if (window.showNotification) {
        window.showNotification('Guest marked as first timer successfully!', 'success');
      } else {
        alert('Guest marked as first timer successfully!');
      }
    } catch (err) {
      console.error('Error marking guest as first timer:', err);
      const errorMessage = err.response?.data?.message || 'Error marking guest as first timer';
      if (window.showNotification) {
        window.showNotification(`Failed to mark as first timer: ${errorMessage}`, 'error');
      } else {
        alert(`Failed to mark as first timer: ${errorMessage}`);
      }
    }
  };

  // Handle tab change and close mobile menu
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  };

  const handleCommenceAssimilation = async (guestId) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.GUESTS.BASE}/${guestId}/commence-assimilation`);
      
      // Refresh the guest list
      loadEventGuests(selectedEvent._id);
      // Refresh stats
      loadOverviewStats();
      
      if (window.showNotification) {
        window.showNotification('Guest marked for commence assimilation successfully!', 'success');
      } else {
        alert('Guest marked for commence assimilation successfully!');
      }
    } catch (err) {
      console.error('Error marking guest for commence assimilation:', err);
      const errorMessage = err.response?.data?.message || 'Error marking guest for commence assimilation';
      if (window.showNotification) {
        window.showNotification(`Failed to commence assimilation: ${errorMessage}`, 'error');
      } else {
        alert(`Failed to commence assimilation: ${errorMessage}`);
      }
    }
  };

  const handleViewGuests = (event) => {
    setSelectedEvent(event);
    
    // Check if this is a multi-day event (consecutive or specific dates)
    if ((event.eventType === 'multi-day' || event.eventType === 'multi-day-specific') && !isPCU && !isIntern) {
      // Only REGISTRARs should see the multiday check-in modal
      setShowMultiDayCheckIn(true);
    } else {
      // For PCUs/INTERNs (all events) or single-day events (all roles), use regular guest view
      setActiveTab('event-guests');
      loadEventGuests(event._id, event); // Pass event object for approval checking
    }
  };

  const handleViewAttendanceReport = (event) => {
    setSelectedEvent(event);
    
    // PCUs/INTERNs don't use multiday attendance reports - they use regular guest view
    if (isPCU || isIntern) {
      setActiveTab('event-guests');
      loadEventGuests(event._id, event); // Pass event object for approval checking
    } else {
      setShowAttendanceReport(true);
    }
  };

  const closeMultiDayModals = () => {
    setShowMultiDayCheckIn(false);
    setShowAttendanceReport(false);
    setSelectedEvent(null);
  };

  // Helper function to get volunteer button state
  const getVolunteerButtonState = (event) => {
    if (!user || !event) return { text: 'Volunteer', disabled: false, variant: 'primary' };

    // Get the correct user ID (could be userId, id, or _id)
    const currentUserId = user.userId || user.id || user._id;

    // For PCUs and INTERNs, check if already approved in workers array
    if (isPCU || isIntern) {
      // Check if already approved as worker
      if (event.workers && event.workers.some(worker => 
        (typeof worker === 'object' ? worker._id : worker) === currentUserId
      )) {
        return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
      }

      // Check volunteer requests (for pending/rejected states)
      if (event.volunteerRequests && event.volunteerRequests.length > 0) {
        const userRequest = event.volunteerRequests.find(req => 
          (typeof req.workerId === 'object' ? req.workerId._id : req.workerId) === currentUserId
        );
        
        if (userRequest) {
          switch (userRequest.status) {
            case 'pending':
              return { text: 'Pending Approval', disabled: true, variant: 'warning' };
            case 'approved':
              return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
            case 'rejected':
              return { text: 'Request Rejected', disabled: true, variant: 'danger' };
            default:
              return { text: 'Volunteer', disabled: false, variant: 'primary' };
          }
        }
      }

      // Not volunteered yet - show volunteer button
      return { text: 'Volunteer', disabled: false, variant: 'primary' };
    }

    // Check if registrar is already approved (in registrars array)
    if (event.registrars && event.registrars.some(registrar => 
      (typeof registrar === 'object' ? registrar._id : registrar) === currentUserId
    )) {
      return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
    }

    // Check volunteer requests
    if (event.registrarRequests && event.registrarRequests.length > 0) {
      const userRequest = event.registrarRequests.find(req => 
        (typeof req.registrarId === 'object' ? req.registrarId._id : req.registrarId) === user._id
      );
      
      if (userRequest) {
        switch (userRequest.status) {
          case 'pending':
            return { text: 'Pending', disabled: true, variant: 'warning' };
          case 'approved':
            return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
          case 'rejected':
            return { text: 'Rejected', disabled: true, variant: 'danger' };
          default:
            return { text: 'Volunteer', disabled: false, variant: 'primary' };
        }
      }
    }

    return { text: 'Volunteer', disabled: false, variant: 'primary' };
  };

  // Helper function to format event location
  const formatEventLocation = (event) => {
    if (event.selectedBranches && event.selectedBranches.length > 0) {
      const branch = event.selectedBranches[0];
      if (branch.stateId && branch.stateId.name && branch.name) {
        return `${branch.stateId.name} State, ${branch.name} Branch`;
      }
      if (branch.name) {
        return `${branch.name} Branch`;
      }
    }
    
    if (event.scope === 'national') {
      return 'National Event';
    }
    
    if (event.scope === 'state' && event.availableStates && event.availableStates.length > 0) {
      const state = event.availableStates[0];
      return state.name ? `${state.name} State` : 'State Event';
    }
    
    if (event.availableStates && event.availableStates.length > 0) {
      if (event.availableStates.length === 1) {
        const state = event.availableStates[0];
        return state.name ? `${state.name} State` : 'State Event';
      }
      return 'Multi-State Event';
    }
    
    // Handle branch admin events - prioritize location field
    if (event.creatorLevel === 'branch_admin') {
      if (event.location) {
        return event.location;
      }
      if (event.availableZones && event.availableZones.length > 0) {
        if (event.availableZones.length === 1) {
          const zone = event.availableZones[0];
          return zone.name ? `${zone.name} Zone` : 'Zone Event';
        }
        return `${event.availableZones.length} Zones`;
      }
    }
    
    return event.location || 'Location TBD';
  };

  // Helper function to format date and time
  const formatEventDateTime = (event) => {
    // Handle multi-day events
    if (event.eventType === 'multi-day' && (event.startDate || event.endDate)) {
      const startDate = event.startDate ? new Date(event.startDate) : null;
      const endDate = event.endDate ? new Date(event.endDate) : null;
      
      if (startDate && endDate) {
        const startDateStr = startDate.toLocaleDateString();
        const endDateStr = endDate.toLocaleDateString();
        const startTime = startDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const endTime = endDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        // If same day, show date once with time range only if times are different
        if (startDateStr === endDateStr) {
          const time = startTime === endTime ? startTime : `${startTime} - ${endTime}`;
          return { 
            date: startDateStr, 
            time: time
          };
        }
        
        // Different days, show date range with start time only
        return { 
          date: `${startDateStr} - ${endDateStr}`, 
          time: startTime 
        };
      } else if (startDate) {
        const date = startDate.toLocaleDateString();
        const time = startDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        return { date: `${date} (Start)`, time };
      } else if (endDate) {
        const date = endDate.toLocaleDateString();
        const time = endDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        return { date: `${date} (End)`, time };
      }
    }
    
    // Handle multi-day-specific events
    if (event.eventType === 'multi-day-specific' && event.specificDates && event.specificDates.length > 0) {
      if (event.specificDates.length === 1) {
        // Single specific date
        const eventDate = new Date(event.specificDates[0]);
        const date = eventDate.toLocaleDateString();
        const time = eventDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        return { date, time };
      } else {
        // Multiple specific dates - show range
        const dates = event.specificDates.map(d => new Date(d)).sort((a, b) => a - b);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        const startDateStr = startDate.toLocaleDateString();
        const endDateStr = endDate.toLocaleDateString();
        const startTime = startDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        return { 
          date: startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`, 
          time: `${event.specificDates.length} specific dates`
        };
      }
    }
    
    // Handle single-day events
    if (event.date) {
      const eventDate = new Date(event.date);
      const date = eventDate.toLocaleDateString();
      const time = eventDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return { date, time };
    }
    
    return { date: 'Date TBD', time: 'Time TBD' };
  };

  // Filter events based on the selected filter (All Events tab)
  const filteredAllEvents = useMemo(() => {
    if (!Array.isArray(allEvents)) return [];
    
    let filtered = allEvents;
    
    // Apply status filter
    switch (eventFilter) {
      case 'active':
        // Show all active/upcoming events (for browsing and volunteering)
        filtered = filtered.filter(event => isEventActive(event));
        break;
      case 'inactive':
        // Show only expired events the registrar volunteered for
        const expiredEvents = allEvents.filter(event => !isEventActive(event));
        filtered = expiredEvents.filter(event => hasRegistrarVolunteered(event));
        break;
      case 'all':
      default:
        // Show all active events + only expired events registrar volunteered for
        const allActiveEvents = allEvents.filter(event => isEventActive(event));
        const registrarExpiredEvents = allEvents.filter(event => !isEventActive(event) && hasRegistrarVolunteered(event));
        filtered = [...allActiveEvents, ...registrarExpiredEvents];
        break;
    }
    
    // Sort by date - active events first, then expired events
    return filtered.sort((a, b) => {
      const aActive = isEventActive(a);
      const bActive = isEventActive(b);
      
      // If one is active and other is not, active comes first
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // If both have same status, sort by date
      const aDate = new Date(getEventEndDate(a));
      const bDate = new Date(getEventEndDate(b));
      
      if (aActive && bActive) {
        // For active events, show nearest date first
        return aDate - bDate;
      } else {
        // For inactive events, show most recent first
        return bDate - aDate;
      }
    });
  }, [allEvents, eventFilter]);

  // Filter my events based on the selected filter (My Events tab)
  const filteredMyEvents = useMemo(() => {
    if (!Array.isArray(allEvents)) return [];
    
    // First filter to only events the registrar has volunteered for
    const myEvents = allEvents.filter(event => hasRegistrarVolunteered(event));
    
    let filtered = myEvents;
    
    // Apply status filter
    switch (eventFilter) {
      case 'active':
        // Show only active events registrar volunteered for
        filtered = filtered.filter(event => isEventActive(event));
        break;
      case 'inactive':
        // Show only expired events registrar volunteered for
        filtered = filtered.filter(event => !isEventActive(event));
        break;
      case 'all':
      default:
        // Show all events registrar volunteered for (active + expired)
        // No additional filtering needed, already filtered to volunteered events
        break;
    }
    
    // Sort by date - active events first, then expired events
    return filtered.sort((a, b) => {
      const aActive = isEventActive(a);
      const bActive = isEventActive(b);
      
      // If one is active and other is not, active comes first
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // If both have same status, sort by date
      const aDate = new Date(getEventEndDate(a));
      const bDate = new Date(getEventEndDate(b));
      
      if (aActive && bActive) {
        // For active events, show nearest date first
        return aDate - bDate;
      } else {
        // For inactive events, show most recent first
        return bDate - aDate;
      }
    });
  }, [allEvents, eventFilter]);

  // Filter guests based on search term
  const filteredGuests = eventGuests.filter(guest => 
    guest.phone?.includes(searchTerm) || 
    guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverviewTab = () => (
    <div>
      {/* Registrar Information Cards */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 d-none d-md-flex">
                  <i className="bi bi-person-check text-primary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Welcome, {user?.name || 'Registrar'}</h5>
                  <div className="text-muted mb-2">
                    <i className="bi bi-envelope me-1"></i>
                    {user?.email || 'Email not available'}
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-info me-2">
                      <i className="bi bi-clipboard-check me-1"></i>
                      Active Registrar
                    </span>
                    {user?.isApproved && (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-secondary bg-opacity-10 p-3 me-3 d-none d-md-flex">
                  <i className="bi bi-geo-alt text-secondary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1">Location Assignment</h6>
                  <div className="text-muted mb-2">
                    <strong>State:</strong>
                    <span className="badge bg-primary bg-opacity-10 text-primary ms-2">
                      {user?.state?.name || 'Not assigned'}
                    </span>
                  </div>
                  <div className="text-muted">
                    <strong>Branch:</strong>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-2">
                      {user?.branch?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Modern Gradient Design */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm bg-primary bg-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-calendar-heart fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Events Volunteered</h6>
                  <h3 className="mb-0 text-white">{overviewStats.totalEventsVolunteered}</h3>
                  <small className="text-white-75">Volunteer requests</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm bg-info bg-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-calendar-check fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">My Events</h6>
                  <h3 className="mb-0 text-white">{overviewStats.totalEvents}</h3>
                  <small className="text-white-75">Approved events</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm bg-warning bg-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-person-plus fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Registered Guests</h6>
                  <h3 className="mb-0 text-white">{overviewStats.totalRegisteredGuests}</h3>
                  <small className="text-white-75">Registered by you</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm bg-success bg-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-check-circle fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Guests Checked In</h6>
                  <h3 className="mb-0 text-white">{overviewStats.totalCheckedInGuests}</h3>
                  <small className="text-white-75">Checked in by you</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Switching Section - only show for users who can switch roles */}
      {user?.canSwitchRoles && (
        <div className="row mb-4">
          <div className="col-12">
            <RoleSwitchingSection user={user} />
          </div>
        </div>
      )}
    </div>
  );

  const renderEventCard = (event, showViewGuestsButton = false) => {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
    const buttonState = getVolunteerButtonState(event);
    const isActive = isEventActive(event);
    
    return (
      <div key={event._id} className="col-12 col-md-6 col-lg-4">
        <div className={`card h-100 border border-primary border-opacity-10 card-hover-lift event-card ${!isActive ? 'opacity-50' : ''}`}
             style={!isActive ? { filter: 'grayscale(50%)' } : {}}>
          <div className="card-header bg-gradient border-0 pb-0">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)', wordWrap: 'break-word', hyphens: 'auto', lineHeight: '1.3', overflowWrap: 'break-word' }}>
                {event.name || event.title}
              </h5>
              <span className={`badge bg-${isActive ? buttonState.variant : 'secondary'} flex-shrink-0 ms-2`}>
                {isActive ? buttonState.text : 'Expired'}
              </span>
            </div>
            <small className="text-muted">
              <i className="bi bi-geo-alt me-1"></i>
              {location}
            </small>
          </div>
          
          <div className="card-body pt-2 d-flex flex-column">
            <div className="mb-2">
              <i className="bi bi-calendar-event me-2 text-muted"></i>
              <small className="text-muted">{date} at {time}</small>
            </div>
            
            <div className="flex-grow-1">
              {event.description && (
                <p className="card-text text-muted small mb-3" style={{ 
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {event.description}
                </p>
              )}
            </div>
            
            <div className="mt-auto">
              <button
                className={`btn btn-${isActive ? buttonState.variant : 'outline-secondary'} btn-sm ${
                  (event.eventType === 'multi-day' || event.eventType === 'multi-day-specific') && buttonState.action === 'viewGuests' ? 'mb-2' : ''
                } w-100`}
                onClick={() => {
                  if (showViewGuestsButton) {
                    // For "My Events" tab, always show "View Guests"
                    handleViewGuests(event);
                  } else if (buttonState.action === 'viewGuests') {
                    // User is approved to view guests
                    handleViewGuests(event);
                  } else {
                    // User needs to volunteer for this event
                    handleVolunteerClick(event);
                  }
                }}
                disabled={isActive ? buttonState.disabled : false}
                title={!isActive ? 'Expired event - View details only' : ''}
              >
                {!isActive ? (
                  <><i className="bi bi-eye me-1"></i>View Details</>
                ) : showViewGuestsButton ? (
                  <><i className="bi bi-people me-1"></i>View Guests</>
                ) : buttonState.action === 'viewGuests' ? (
                  // PCU and INTERN users should always see "View Guests", never "Daily Check-In"
                  (isPCU || isIntern) ? 
                    <><i className="bi bi-people me-1"></i>View Guests</> :
                  (event.eventType === 'multi-day' || event.eventType === 'multi-day-specific') ? 
                    <><i className="bi bi-calendar-check me-1"></i>Daily Check-In</> :
                    <><i className="bi bi-people me-1"></i>{buttonState.text}</>
                ) : (
                  <><i className="bi bi-hand-thumbs-up me-1"></i>{buttonState.text}</>
                )}
              </button>
              
              {/* Add Attendance Report button for multi-day events (only for REGISTRAR) */}
              {isActive && buttonState.action === 'viewGuests' && (event.eventType === 'multi-day' || event.eventType === 'multi-day-specific') && !isPCU && !isIntern && (
                <button
                  className="btn btn-outline-info btn-sm w-100"
                  onClick={() => handleViewAttendanceReport(event)}
                  title="View detailed attendance report"
                >
                  <i className="bi bi-graph-up me-1"></i>Attendance Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">All Published Events</h5>
        <small className="text-muted">Volunteer for events you want to help with registration</small>
      </div>

      {/* Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="btn-group" role="group" aria-label="Event filter">
          <input 
            type="radio" 
            className="btn-check" 
            name="eventFilter" 
            id="filter-active" 
            checked={eventFilter === 'active'}
            onChange={() => setEventFilter('active')}
          />
          <label className="btn btn-outline-primary btn-sm" htmlFor="filter-active">
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming ({allEvents.filter(e => isEventActive(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="eventFilter" 
            id="filter-inactive" 
            checked={eventFilter === 'inactive'}
            onChange={() => setEventFilter('inactive')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="filter-inactive">
            <i className="bi bi-calendar-x me-1"></i>
            Expired ({allEvents.filter(e => !isEventActive(e) && hasRegistrarVolunteered(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="eventFilter" 
            id="filter-all" 
            checked={eventFilter === 'all'}
            onChange={() => setEventFilter('all')}
          />
          <label className="btn btn-outline-info btn-sm" htmlFor="filter-all">
            <i className="bi bi-calendar-event me-1"></i>
            All ({allEvents.filter(e => isEventActive(e)).length + allEvents.filter(e => !isEventActive(e) && hasRegistrarVolunteered(e)).length})
          </label>
        </div>

        <p className="text-muted mb-0">
          {eventFilter === 'active' && 'Showing upcoming events'}
          {eventFilter === 'inactive' && 'Showing expired events'}
          {eventFilter === 'all' && 'Showing all events (upcoming first)'}
        </p>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : allEvents.length === 0 ? (
        <EmptyState message="No published events available" />
      ) : filteredAllEvents.length === 0 ? (
        <EmptyState message={`No ${eventFilter} events available`} />
      ) : (
        <div className="row g-3">
          {filteredAllEvents.map(event => renderEventCard(event, false))}
        </div>
      )}
    </div>
  );

  const renderMyEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">My Volunteered Events</h5>
        <small className="text-muted">Events you've volunteered for as a registrar</small>
      </div>

      {/* Filter Controls for My Events */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="btn-group" role="group" aria-label="Event filter">
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-active" 
            checked={eventFilter === 'active'}
            onChange={() => setEventFilter('active')}
          />
          <label className="btn btn-outline-primary btn-sm" htmlFor="my-filter-active">
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming ({allEvents.filter(e => isEventActive(e) && hasRegistrarVolunteered(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-inactive" 
            checked={eventFilter === 'inactive'}
            onChange={() => setEventFilter('inactive')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="my-filter-inactive">
            <i className="bi bi-calendar-x me-1"></i>
            Expired ({allEvents.filter(e => !isEventActive(e) && hasRegistrarVolunteered(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-all" 
            checked={eventFilter === 'all'}
            onChange={() => setEventFilter('all')}
          />
          <label className="btn btn-outline-info btn-sm" htmlFor="my-filter-all">
            <i className="bi bi-calendar-event me-1"></i>
            All ({allEvents.filter(e => hasRegistrarVolunteered(e)).length})
          </label>
        </div>

        <p className="text-muted mb-0">
          {eventFilter === 'active' && 'Showing upcoming events'}
          {eventFilter === 'inactive' && 'Showing expired events'}
          {eventFilter === 'all' && 'Showing all events (upcoming first)'}
        </p>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : allEvents.filter(e => hasRegistrarVolunteered(e)).length === 0 ? (
        <EmptyState message="No volunteered events yet" />
      ) : filteredMyEvents.length === 0 ? (
        <EmptyState message={`No ${eventFilter} events available`} />
      ) : (
        <div className="row g-3">
          {filteredMyEvents.map(event => renderEventCard(event, true))}
        </div>
      )}
    </div>
  );

  const renderEventGuestsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <button 
              className="btn btn-link p-0 me-2"
              onClick={() => setActiveTab('my-events')}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            {canMarkFirstTimers ? 'Guest First Timer Marking' : 'Guest Check-In'}: {selectedEvent?.name || 'Event'}
          </h5>
          <small className="text-muted">
            <i className="bi bi-geo-alt me-1"></i>
            {selectedEvent ? formatEventLocation(selectedEvent) : 'Location'}
          </small>
        </div>
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by phone, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : filteredGuests.length === 0 ? (
        searchTerm ? (
          <EmptyState message={`No guests found matching "${searchTerm}"`} />
        ) : (
          <EmptyState 
            message={
              isPCU 
                ? "No checked-in guests available for first timer marking" 
                : isIntern 
                  ? "No first timer guests available for assimilation"
                  : "No guests registered for this event"
            } 
          />
        )
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Guest Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
                    <th scope="col">Registered By</th>
                    {canMarkFirstTimers && <th scope="col">Checked In By</th>}
                    <th scope="col">Comments</th>
                    <th scope="col">Status</th>
                    {canMarkFirstTimers && !isIntern && <th scope="col">First Timer</th>}
                    <th scope="col">Check-In Time</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map(guest => (
                    <tr key={guest._id}>
                      <td>
                        <div className="fw-semibold">{guest.name}</div>
                      </td>
                      <td>{guest.phone}</td>
                      <td>{guest.email}</td>
                      <td>
                        {guest.registeredBy ? (
                          <div>
                            <div className="fw-semibold">{guest.registeredBy.name}</div>
                            <small className="text-muted">{guest.registeredBy.email}</small>
                          </div>
                        ) : (
                          <small className="text-muted">Unknown</small>
                        )}
                      </td>
                      {canMarkFirstTimers && (
                        <td>
                          {guest.checkedInBy ? (
                            <div>
                              <div className="fw-semibold">{guest.checkedInBy.name}</div>
                              <small className="text-muted">{guest.checkedInBy.email}</small>
                            </div>
                          ) : (
                            <small className="text-muted">Not checked in</small>
                          )}
                        </td>
                      )}
                      <td className="text-muted">{guest.comments || '-'}</td>
                      <td>
                        <span className={`badge ${guest.checkedIn ? 'bg-success' : 'bg-warning'} ${guest.firstTimer ? 'opacity-75' : ''}`}>
                          {guest.checkedIn ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                      {canMarkFirstTimers && !isIntern && (
                        <td>
                          <span className={`badge ${guest.firstTimer ? 'bg-info' : 'bg-secondary'}`}>
                            {guest.firstTimer ? 'First Timer' : 'Regular'}
                          </span>
                        </td>
                      )}
                      <td>
                        {guest.checkedInTime ? (
                          <div>
                            <div>{new Date(guest.checkedInTime).toLocaleDateString()}</div>
                            <small className="text-muted">
                              {new Date(guest.checkedInTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </small>
                          </div>
                        ) : (
                          <small className="text-muted">Not checked in</small>
                        )}
                      </td>
                      <td>
                        {canMarkFirstTimers ? (
                          // PCU and INTERN see different buttons for checked-in guests
                          guest.checkedIn ? (
                            isIntern ? (
                              // INTERN sees Commence Assimilation button for first-timer guests
                              <button
                                className={`btn btn-sm ${guest.commenceAssimilation ? 'btn-success' : 'btn-warning'}`}
                                onClick={() => handleCommenceAssimilation(guest._id)}
                                disabled={guest.commenceAssimilation}
                              >
                                {guest.commenceAssimilation ? (
                                  <><i className="bi bi-check-circle-fill me-1"></i>Assimilated</>
                                ) : (
                                  <><i className="bi bi-rocket me-1"></i>Commence Assimilation</>
                                )}
                              </button>
                            ) : (
                              // PCU sees First Timer button
                              <button
                                className={`btn btn-sm ${guest.firstTimer ? 'btn-success' : 'btn-info'}`}
                                onClick={() => handleMarkFirstTimer(guest._id)}
                                disabled={guest.firstTimer}
                              >
                                {guest.firstTimer ? (
                                  <><i className="bi bi-star-fill me-1"></i>First Timer</>
                                ) : (
                                  <><i className="bi bi-star me-1"></i>Mark First Timer</>
                                )}
                              </button>
                            )
                          ) : (
                            <small className="text-muted">Not checked in</small>
                          )
                        ) : (
                          // Registrar sees Check In button
                          <button
                            className={`btn btn-sm ${guest.checkedIn ? 'btn-success' : 'btn-primary'}`}
                            onClick={() => handleCheckInGuest(guest._id)}
                            disabled={guest.checkedIn}
                          >
                            {guest.checkedIn ? (
                              <><i className="bi bi-check-circle me-1"></i>Checked In</>
                            ) : (
                              <><i className="bi bi-person-check me-1"></i>Check In</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid">
      {/* Mobile Tab Navigation with Hamburger */}
      <div className="mobile-tab-header d-md-none mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {activeTab === 'overview' && (
              <>
                <i className="bi bi-speedometer2 me-2"></i>
                Overview
              </>
            )}
            {activeTab === 'all-events' && (
              <>
                <i className="bi bi-calendar3 me-2"></i>
                All Events
              </>
            )}
            {activeTab === 'my-events' && (
              <>
                <i className="bi bi-calendar-check me-2"></i>
                My Events
              </>
            )}
            {activeTab === 'event-guests' && (
              <>
                <i className="bi bi-people me-2"></i>
                Event Guests
              </>
            )}
          </h5>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu-dropdown ${mobileMenuOpen ? 'show' : ''}`}>
          <div className="list-group list-group-flush">
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Overview
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'all-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('all-events')}
            >
              <i className="bi bi-calendar3 me-2"></i>
              All Events
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'my-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('my-events')}
            >
              <i className="bi bi-calendar-check me-2"></i>
              My Events
            </button>
            {activeTab === 'event-guests' && (
              <button className="list-group-item list-group-item-action active">
                <i className="bi bi-people me-2"></i>
                Event Guests
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <ul className="nav nav-tabs mb-4 d-none d-md-flex">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <i className="bi bi-speedometer2 me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all-events' ? 'active' : ''}`}
            onClick={() => handleTabChange('all-events')}
          >
            <i className="bi bi-calendar3 me-2"></i>
            All Events
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'my-events' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-events')}
          >
            <i className="bi bi-calendar-check me-2"></i>
            My Events
          </button>
        </li>
        {activeTab === 'event-guests' && (
          <li className="nav-item">
            <button className="nav-link active">
              <i className="bi bi-people me-2"></i>
              Event Guests
            </button>
          </li>
        )}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'all-events' && renderAllEventsTab()}
        {activeTab === 'my-events' && renderMyEventsTab()}
        {activeTab === 'event-guests' && renderEventGuestsTab()}
      </div>

      {/* Multi-Day Check-In Modal */}
      {showMultiDayCheckIn && selectedEvent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-check me-2"></i>
                  Daily Check-In: {selectedEvent.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeMultiDayModals}
                ></button>
              </div>
              <div className="modal-body p-0">
                <MultiDayCheckInManager 
                  event={selectedEvent}
                  onClose={closeMultiDayModals}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Day Attendance Report Modal */}
      {showAttendanceReport && selectedEvent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-graph-up me-2"></i>
                  Attendance Report: {selectedEvent.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeMultiDayModals}
                ></button>
              </div>
              <div className="modal-body p-0">
                <MultiDayAttendanceReport 
                  event={selectedEvent}
                  onClose={closeMultiDayModals}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Selection Modal */}
      <VolunteerSelectionModal
        event={volunteerEvent}
        isOpen={showVolunteerModal}
        onClose={() => {
          setShowVolunteerModal(false);
          setVolunteerEvent(null);
        }}
        onConfirm={handleVolunteerConfirm}
      />
    </div>
  );
};

export default RegistrarTabs;
