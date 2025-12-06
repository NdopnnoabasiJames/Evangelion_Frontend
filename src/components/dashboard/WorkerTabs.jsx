import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import workerService from '../../services/workerService';
import api from '../../services/api';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/constants';
import GuestRegistrationForm from '../guests/GuestRegistrationForm';
import OverviewTab from './OverviewTab';
import AllEventsTab from './AllEventsTab';
import MyEventsTab from './MyEventsTab';
import PendingEventsTab from './PendingEventsTab';
import RegisteredGuestsTab from './RegisteredGuestsTab';
import GuestRegistrationModal from './GuestRegistrationModal';
import RoleSwitchingSection from './RoleSwitchingSection';
import WorkerEventsList from '../events/WorkerEventsList';
import { formatEventLocation, formatEventDateTime, getVolunteerButtonState } from '../../helpers/workerTabs.helpers';

const WorkerTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allEvents, setAllEvents] = useState([]);
  const [branchEvents, setBranchEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [registeredGuests, setRegisteredGuests] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalEvents: 0,
    totalEventsVolunteered: 0,
    totalRegisteredGuests: 0,
    totalCheckedInGuests: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle guest update
  const handleGuestUpdate = (updatedGuest) => {
    setRegisteredGuests(prevGuests =>
      prevGuests.map(guest =>
        guest._id === updatedGuest._id ? { ...guest, ...updatedGuest } : guest
      )
    );
  };

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadOverviewStats();
        break;
      case 'all-events':
        loadAllEvents();
        break;
      case 'branch-events':
        loadBranchEvents();
        break;
      case 'my-events':
        loadAllEvents(); // Load all events so we can filter to show worker's events including expired ones
        break;
      case 'pending-events':
        loadPendingEvents();
        break;
      case 'registered-guests':
        loadRegisteredGuests();
        break;
      default:
        break;
    }
  }, [activeTab]);  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      
      // Fetch worker statistics using API service
      const response = await api.get(API_ENDPOINTS.WORKERS.STATS);
      
      // Backend returns { data: { totalEvents, totalRegisteredGuests, totalCheckedInGuests } }
      // Handle both direct and wrapped responses
      const stats = response.data.data || response.data;
            
      // Ensure stats has the expected structure
      const normalizedStats = {
        totalEvents: stats.totalEvents || 0,                           // Approved events (participated)
        totalEventsVolunteered: stats.totalEventsVolunteered || 0,     // Total volunteer requests
        totalRegisteredGuests: stats.totalRegisteredGuests || 0,       // Guests registered by worker
        totalCheckedInGuests: stats.totalCheckedInGuests || 0          // Checked-in guests
      };
      
      setOverviewStats(normalizedStats);
    } catch (err) {
      console.error('[WorkerTabs] Error loading overview stats:', err);
      console.error('[WorkerTabs] Error details:', err.response?.data);
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
      
      // Add volunteer status to each event for the current worker
      const eventsWithStatus = eventsData.map(event => {
        // Check if worker is in workers array (approved)
        const isApproved = event.workers && Array.isArray(event.workers) && 
          event.workers.some(workerId => {
            const id = typeof workerId === 'object' ? workerId._id || workerId.toString() : workerId.toString();
            return id === user._id.toString();
          });
        
        // Check if worker has volunteer request
        const hasRequest = event.volunteerRequests && Array.isArray(event.volunteerRequests) &&
          event.volunteerRequests.some(request => {
            const workerId = typeof request.workerId === 'object' ? 
              request.workerId._id || request.workerId.toString() : request.workerId.toString();
            return workerId === user._id.toString();
          });
        
        // Set volunteer status based on worker's participation
        let volunteerStatus = 'none';
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
        
        return { ...event, volunteerStatus };
      });
      
      setAllEvents(eventsWithStatus);
    } catch (err) {
      console.error('❌ [WorkerTabs] Error loading all events:', err);
      console.error('❌ [WorkerTabs] Error details:', err.response?.data);
      console.error('❌ [WorkerTabs] Error status:', err.response?.status);
      setError(`Failed to load events: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get ALL events and filter for branch-specific ones
      const response = await api.get(API_ENDPOINTS.EVENTS.LIST);
      const allEventsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // Filter events specific to worker's branch
      const branchSpecificEvents = allEventsData.filter(event => {
        if (!user?.branch) return false;
        
        const workerBranchId = user.branch._id || user.branch;
        
        // Include events that are:
        // 1. Created by or delegated to worker's branch
        // 2. Available to worker's branch
        const isBranchEvent = event.selectedBranches?.some(branch => 
          (branch._id || branch).toString() === workerBranchId.toString()
        ) || event.availableBranches?.some(branch => 
          (branch._id || branch).toString() === workerBranchId.toString()
        ) || event.creatorBranch === workerBranchId.toString();
        
        return isBranchEvent;
      });
      
      // Add volunteer status to each event for the current worker
      const eventsWithStatus = branchSpecificEvents.map(event => {
        // Check if worker is in workers array (approved)
        const isApproved = event.workers && Array.isArray(event.workers) && 
          event.workers.some(workerId => {
            const id = typeof workerId === 'object' ? workerId._id || workerId.toString() : workerId.toString();
            return id === user._id.toString();
          });
        
        // Check if worker has volunteer request
        const hasRequest = event.volunteerRequests && Array.isArray(event.volunteerRequests) &&
          event.volunteerRequests.some(request => {
            const workerId = typeof request.workerId === 'object' ? 
              request.workerId._id || request.workerId.toString() : request.workerId.toString();
            return workerId === user._id.toString();
          });
        
        // Set volunteer status based on worker's participation
        let volunteerStatus = 'none';
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
        
        return { ...event, volunteerStatus };
      });
      
      setBranchEvents(eventsWithStatus);
    } catch (err) {
      console.error('❌ [WorkerTabs] Error loading branch events:', err);
      console.error('❌ [WorkerTabs] Error details:', err.response?.data);
      console.error('❌ [WorkerTabs] Error status:', err.response?.status);
      setError(`Failed to load branch events: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMyEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.WORKERS.MY_EVENTS);
      setMyEvents(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error('Error loading my events:', err);
      setError('Failed to load my events');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.WORKERS.PENDING_EVENTS);
      setPendingEvents(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error('❌ [WorkerTabs] Error loading pending events:', err);
      console.error('❌ [WorkerTabs] Error details:', err.response?.data);
      console.error('❌ [WorkerTabs] Error status:', err.response?.status);
      setError(`Failed to load pending events: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const loadRegisteredGuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.WORKERS.MY_GUESTS);
      const guests = response.data;
      
      // Ensure we always set an array
      let guestsArray = [];
      if (Array.isArray(guests)) {
        guestsArray = guests;
      } else if (guests && Array.isArray(guests.data)) {
        guestsArray = guests.data;
      } else if (guests && guests.guests && Array.isArray(guests.guests)) {
        guestsArray = guests.guests;
      }
      
      setRegisteredGuests(guestsArray);
    } catch (err) {
      console.error('Error loading registered guests:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load registered guests');
      setRegisteredGuests([]); // Ensure it's still an array
    } finally {
      setLoading(false);
    }
  };
  const handleVolunteerForEvent = async (eventId, selectionData = null) => {
    try {
      const requestBody = selectionData ? {
        targetStateId: selectionData.stateId,
        targetBranchId: selectionData.branchId
      } : {};

      const response = await api.post(`${API_ENDPOINTS.WORKERS.BASE}/events/${eventId}/volunteer`, requestBody);
      
      if (response.status === 200 || response.status === 201) {
        const result = response.data.data || response.data; // Handle nested data structure
        if (result?.status === 'approved') {
          alert('Successfully volunteered! You can now register guests for this event.');
          loadMyEvents(); // Refresh My Events tab
        } else if (result?.status === 'pending') {
          alert(`Volunteer request submitted to ${selectionData?.branchName || 'branch pastor'} for approval.`);
          loadPendingEvents(); // Refresh Pending Events tab
        } else {
          // Fallback for older message format
          if (result?.message?.includes('approved')) {
            alert('Successfully volunteered! You can now register guests for this event.');
            loadMyEvents(); // Refresh My Events tab
          } else {
            alert('Volunteer request submitted! Waiting for branch pastor approval.');
            loadPendingEvents(); // Refresh Pending Events tab
          }
        }
        loadAllEvents(); // Refresh All Events to update button states
        loadBranchEvents(); // Refresh Branch Events to update button states
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      const errorMessage = err.response?.data?.message || 'Unknown error';
      alert(`Failed to volunteer: ${errorMessage}`);
    }
  };

  // Handle tab change and close mobile menu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="container-fluid">
      {/* Back Button (only show when not on overview tab) */}
      {activeTab !== 'overview' && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleTabChange('overview')}
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Overview
          </button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="position-relative">
        {/* Mobile Navigation */}
        <div className="d-md-none mb-3">
          <div className="position-relative mb-3">
            <h5 className="mb-0 text-center">
              {activeTab === 'overview' && <><i className="bi bi-speedometer2 me-2"></i>Overview</>}
              {activeTab === 'all-events' && <><i className="bi bi-calendar3 me-2"></i>All Events</>}
              {activeTab === 'branch-events' && <><i className="bi bi-building me-2"></i>Branch Events</>}
              {activeTab === 'my-events' && <><i className="bi bi-calendar-check me-2"></i>My Events</>}
              {activeTab === 'pending-events' && <><i className="bi bi-clock me-2"></i>Pending Events</>}
              {activeTab === 'registered-guests' && <><i className="bi bi-people me-2"></i>Registered Guests</>}
            </h5>
            <button 
              className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0"
              style={{ width: '32px', height: '32px', padding: '0', marginTop: '-8px' }}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'} small`}></i>
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mobile-nav-menu show d-md-none">
          <div className="list-group">
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
              className={`list-group-item list-group-item-action ${activeTab === 'branch-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('branch-events')}
            >
              <i className="bi bi-building me-2"></i>
              Branch Events
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'my-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('my-events')}
            >
              <i className="bi bi-calendar-check me-2"></i>
              My Events
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'pending-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending-events')}
            >
              <i className="bi bi-clock me-2"></i>
              Pending Events
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'registered-guests' ? 'active' : ''}`}
              onClick={() => handleTabChange('registered-guests')}
            >
              <i className="bi bi-people me-2"></i>
              Registered Guests
            </button>
          </div>
        </div>
          )}
        </div>

        {/* Desktop Navigation */}
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
              className={`nav-link ${activeTab === 'branch-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('branch-events')}
            >
              <i className="bi bi-building me-2"></i>
              Branch Events
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
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'pending-events' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending-events')}
            >
              <i className="bi bi-clock me-2"></i>
              Pending Events
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'registered-guests' ? 'active' : ''}`}
              onClick={() => handleTabChange('registered-guests')}
            >
              <i className="bi bi-people me-2"></i>
              Registered Guests
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab user={user} overviewStats={overviewStats} />
        )}
        {activeTab === 'all-events' && (
          <WorkerEventsList
            events={allEvents}
            loading={loading}
            error={error}
            handleVolunteerForEvent={handleVolunteerForEvent}
            user={user}
            title="All Events"
            description="All published events from all branches and states. You can volunteer for any event here."
          />
        )}
        {activeTab === 'branch-events' && (
          <WorkerEventsList
            events={branchEvents}
            loading={loading}
            error={error}
            handleVolunteerForEvent={handleVolunteerForEvent}
            user={user}
            title="Branch Events"
            description="Events specific to your branch - including events created by your branch pastor and events delegated to your branch."
          />
        )}
        {activeTab === 'my-events' && (
          <MyEventsTab
            myEvents={allEvents.filter(event => event.volunteerStatus && ['approved', 'pending', 'rejected'].includes(event.volunteerStatus))}
            loading={loading}
            error={error}
          />
        )}
        {activeTab === 'pending-events' && (
          <PendingEventsTab
            pendingEvents={pendingEvents}
            loading={loading}
            error={error}
          />
        )}
        {activeTab === 'registered-guests' && (
          <RegisteredGuestsTab
            registeredGuests={registeredGuests}
            loading={loading}
            error={error}
            setShowGuestModal={setShowGuestModal}
            userRole={user?.role}
            onGuestUpdate={handleGuestUpdate}
          />
        )}
      </div>

      {/* Guest Registration Modal */}
      {showGuestModal && (
        <GuestRegistrationModal
          onClose={() => setShowGuestModal(false)}
          onSuccess={() => {
            setShowGuestModal(false);
            loadRegisteredGuests();
          }}
        />
      )}
    </div>
  );
};

export default WorkerTabs;
