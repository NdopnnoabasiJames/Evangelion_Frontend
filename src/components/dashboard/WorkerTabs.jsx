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
import RegisteredGuestsTab from './RegisteredGuestsTab';
import GuestRegistrationModal from './GuestRegistrationModal';
import RoleSwitchingSection from './RoleSwitchingSection';
import { formatEventLocation, formatEventDateTime, getVolunteerButtonState } from '../../helpers/workerTabs.helpers';

const WorkerTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
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
        loadMyEvents();
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
      const response = await api.get(API_ENDPOINTS.WORKERS.ALL_EVENTS);
      setAllEvents(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error('Error loading all events:', err);
      setError('Failed to load events');
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
      setError('Failed to load branch events');
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
  const handleVolunteerForEvent = async (eventId) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.WORKERS.BASE}/events/${eventId}/volunteer`);
      
      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        if (result?.message?.includes('approved')) {
          alert('Successfully volunteered! You can now register guests for this event.');
          loadMyEvents(); // Refresh My Events tab
        } else {
          alert('Volunteer request submitted! Waiting for branch pastor approval.');
        }
        loadAllEvents(); // Refresh All Events to update button states
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      const errorMessage = err.response?.data?.message || 'Unknown error';
      alert(`Failed to volunteer: ${errorMessage}`);
    }
  };

  return (
    <div className="container-fluid">
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-speedometer2 me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-events')}
          >
            <i className="bi bi-calendar3 me-2"></i>
            All Events
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'my-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-events')}
          >
            <i className="bi bi-calendar-check me-2"></i>
            My Events
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'registered-guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('registered-guests')}
          >
            <i className="bi bi-people me-2"></i>
            Registered Guests
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <>
            <RoleSwitchingSection user={user} />
            <OverviewTab user={user} overviewStats={overviewStats} />
          </>
        )}
        {activeTab === 'all-events' && (
          <AllEventsTab
            allEvents={allEvents}
            loading={loading}
            error={error}
            handleVolunteerForEvent={handleVolunteerForEvent}
            user={user}
          />
        )}
        {activeTab === 'my-events' && (
          <MyEventsTab
            myEvents={myEvents}
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
