import { API_ENDPOINTS } from '../../../utils/constants';

export const useZoneManagement = () => {
  const loadZones = async (setZones, setZonesLoading, setZonesError) => {
    setZonesLoading(true);
    setZonesError(null);
    try {
      const response = await fetch(API_ENDPOINTS.ZONES.ALL_WITH_ADMINS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let zonesArray = [];
      if (Array.isArray(data)) {
        zonesArray = data;
      } else if (data && Array.isArray(data.data)) {
        zonesArray = data.data;
      } else if (data && data.zones && Array.isArray(data.zones)) {
        zonesArray = data.zones;
      } else {
        console.warn('Unexpected zones response format:', data);
        zonesArray = [];
      }
      
      setZones(zonesArray);
    } catch (err) {
      console.error('Error loading zones:', err);
      setZonesError(err.message || 'Failed to load zones');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleZoneFilterChange = (setZoneFilters, filterType, value) => {
    setZoneFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearZoneFilters = (setZoneFilters) => {
    setZoneFilters({
      stateFilter: 'all',
      branchFilter: 'all',
      statusFilter: 'all',
      adminFilter: 'all'
    });
  };

  return {
    loadZones,
    handleZoneFilterChange,
    clearZoneFilters
  };
};
