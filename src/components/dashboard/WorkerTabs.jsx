import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import workerService from '../../services/workerService';
import { API_ENDPOINTS } from '../../utils/constants';
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
      
      // Fetch worker statistics
      const response = await fetch(API_ENDPOINTS.WORKERS.STATS, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
            
      if (response.ok) {
        const data = await response.json();
        
        // Backend returns { data: { totalEvents, totalRegisteredGuests, totalCheckedInGuests } }
        // Handle both direct and wrapped responses
        const stats = data.data || data;
        
        // Ensure stats has the expected structure
        const normalizedStats = {
          totalEvents: stats.totalEvents || 0,                           // Approved events (participated)
          totalEventsVolunteered: stats.totalEventsVolunteered || 0,     // Total volunteer requests
          totalRegisteredGuests: stats.totalRegisteredGuests || 0,       // Guests registered by worker
          totalCheckedInGuests: stats.totalCheckedInGuests || 0          // Checked-in guests
        };
        
        setOverviewStats(normalizedStats);
      } else {
        const errorText = await response.text();
        console.error('[WorkerTabs] Failed to fetch worker stats, status:', response.status, 'Error:', errorText);
        setError(`Failed to load statistics: ${response.status}`);
      }
    } catch (err) {
      console.error('[WorkerTabs] Error loading overview stats:', err);
      setError('Failed to load overview statistics');
    } finally {
      setLoading(false);
    }
  };
  const loadAllEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.ALL_EVENTS}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const events = await response.json();
        setAllEvents(Array.isArray(events) ? events : events.data || []);
      }
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
      const response = await fetch(`${API_ENDPOINTS.WORKERS.MY_EVENTS}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const events = await response.json();
        setMyEvents(Array.isArray(events) ? events : events.data || []);
      }
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
      const response = await fetch(`${API_ENDPOINTS.WORKERS.MY_GUESTS}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      
      if (response.ok) {
        const guests = await response.json();
        
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
      } else {
        console.error('Failed to fetch guests, status:', response.status);
        setError(`Failed to load guests: ${response.status}`);
        setRegisteredGuests([]); // Ensure it's still an array
      }
    } catch (err) {
      console.error('Error loading registered guests:', err);
      setError('Failed to load registered guests');
      setRegisteredGuests([]); // Ensure it's still an array
    } finally {
      setLoading(false);
    }
  };
  const handleVolunteerForEvent = async (eventId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.BASE}/events/${eventId}/volunteer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
        if (response.ok) {
        const result = await response.json();
        if (result?.message?.includes('approved')) {
          alert('Successfully volunteered! You can now register guests for this event.');
          loadMyEvents(); // Refresh My Events tab
        } else {
          alert('Volunteer request submitted! Waiting for branch admin approval.');
        }
        loadAllEvents(); // Refresh All Events to update button states
      } else {
        const error = await response.json();
        alert(`Failed to volunteer: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      alert('Failed to volunteer for event');
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
