// Helper functions for Guests.jsx
import { API_BASE_URL } from '../utils/constants';

export const getStatusBadge = (status) => {
  const statusColors = {
    'registered': 'bg-primary',
    'invited': 'bg-secondary',
    'checked_in': 'bg-success',
    'cancelled': 'bg-warning',
    'first timer': 'bg-primary',
    'C/assimilation': 'bg-info'
  };
  return (
    <span className={`badge ${statusColors[status] || 'bg-secondary'} text-white`}>
      {status?.replace('_', ' ').toUpperCase() || 'REGISTERED'}
    </span>
  );
};

export const getRegistrationTypeBadge = (registrationType) => {
  if (registrationType === 'auto') {
    return (
      <span className="badge bg-info text-white d-inline-flex align-items-center">
        <i className="bi bi-robot me-1" style={{ fontSize: '0.8em' }}></i>
        Auto
      </span>
    );
  } else {
    return (
      <span className="badge bg-primary text-white d-inline-flex align-items-center">
        <i className="bi bi-person me-1" style={{ fontSize: '0.8em' }}></i>
        Manual
      </span>
    );
  }
};

export const fetchGuestsHelper = async ({
  user,
  selectedEvent,
  setLoading,
  setGuests,
  setStatistics,
  setError,
  API_ENDPOINTS
}) => {
  try {
    setLoading(true);
    
    let endpoint = '';
    if ([
      'SUPER_ADMIN',
      'SUPER_ME',
      'STATE_ADMIN',
      'BRANCH_ADMIN',
      'BRANCH_ME',
      'ZONAL_ADMIN'
    ].includes(user?.role)) {
      endpoint = `${API_ENDPOINTS.ADMIN.GUESTS}${selectedEvent ? `?eventId=${selectedEvent}` : ''}`;
    } else if (user?.role === 'WORKER') {
      endpoint = `${API_ENDPOINTS.WORKERS.MY_GUESTS}${selectedEvent ? `?eventId=${selectedEvent}` : ''}`;
    } else {
      endpoint = API_ENDPOINTS.GUESTS.BASE;
    }
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setGuests(data.guests || data || []);
      if (data.summary) {
        setStatistics(data.summary);
      }
    } else {
      setError('Failed to fetch guests');
    }
  } catch (err) {
    setError('Error loading guests: ' + err.message);
  } finally {
    setLoading(false);
  }
};

export const fetchPickupStationsHelper = async ({
  user,
  setLoadingPickupStations,
  setPickupStations,
  API_ENDPOINTS
}) => {
  if (!user?.branch?._id) return;
  try {
    setLoadingPickupStations(true);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PICKUP_STATIONS.BY_BRANCH}/${user.branch._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      setPickupStations(data || []);
    } else {
      console.error('Failed to fetch pickup stations');
    }
  } catch (error) {
    console.error('Error fetching pickup stations:', error);
  } finally {
    setLoadingPickupStations(false);
  }
};

export const handleQuickSearchHelper = async ({
  searchTerm,
  canSearchAdvanced,
  fetchGuests,
  setLoading,
  setGuests,
  setError,
  API_ENDPOINTS
}) => {
  if (!searchTerm.trim()) {
    await fetchGuests();
    return;
  }
  try {
    setLoading(true);
    let endpoint = '';
    if (canSearchAdvanced) {
      endpoint = `${API_ENDPOINTS.GUESTS.QUICK_SEARCH}?q=${encodeURIComponent(searchTerm)}`;
    } else {
      endpoint = `${API_ENDPOINTS.WORKERS.MY_GUESTS}?search=${encodeURIComponent(searchTerm)}`;
    }
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      setGuests(data.guests || data || []);
    }
  } catch (err) {
    setError('Search failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};
