// Helper functions for Guests.jsx
import { API_BASE_URL } from '../utils/constants';

export const getStatusBadge = (status) => {
  const statusColors = {
    'registered': 'bg-primary',
    'checked_in': 'bg-success',
    'no_show': 'bg-warning',
    'cancelled': 'bg-danger'
  };
  return (
    <span className={`badge ${statusColors[status] || 'bg-secondary'} text-white`}>
      {status?.replace('_', ' ').toUpperCase() || 'REGISTERED'}
    </span>
  );
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
    
    console.log('🔍 DEBUG: Fetch endpoint:', endpoint);
    console.log('🔍 DEBUG: Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 DEBUG: Raw API response:', data);
      console.log('🔍 DEBUG: First guest sample:', data.guests?.[0] || data[0]);
      
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
      console.log('=== FRONTEND GUESTS DEBUG ===');
      console.log('API Response data:', data);
      console.log('Guests array:', data.guests || data || []);
      if ((data.guests || data || []).length > 0) {
        const firstGuest = (data.guests || data || [])[0];
        console.log('First guest sample:', {
          name: firstGuest.name,
          firstTimer: firstGuest.firstTimer,
          firstTimerMarkedBy: firstGuest.firstTimerMarkedBy,
          status: firstGuest.status
        });
      }
      console.log('=== END FRONTEND DEBUG ===');
      
      setGuests(data.guests || data || []);
    }
  } catch (err) {
    setError('Search failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};
