import { API_ENDPOINTS, API_BASE_URL } from '../../../utils/constants';

export const useBranchManagement = () => {
  const loadBranches = async (setBranches, setBranchesLoading, setBranchesError) => {
    setBranchesLoading(true);
    setBranchesError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BRANCHES.ALL_WITH_ADMINS}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let branchesArray = [];
      if (Array.isArray(data)) {
        branchesArray = data;
      } else if (data && Array.isArray(data.data)) {
        branchesArray = data.data;
      } else if (data && data.branches && Array.isArray(data.branches)) {
        branchesArray = data.branches;
      } else {
        console.warn('Unexpected branches response format:', data);
        branchesArray = [];
      }
      
      setBranches(branchesArray);
    } catch (err) {
      console.error('Error loading branches:', err);
      setBranchesError(err.message || 'Failed to load branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const getUniqueStates = (branches) => {
    const branchesArray = Array.isArray(branches) ? branches : [];
    const states = branchesArray
      .map(branch => branch.state)
      .filter(state => state && state.trim() !== '');
    
    const uniqueStates = states.filter((state, index, self) => 
      self.indexOf(state) === index
    );
    
    return uniqueStates.sort();
  };

  const getFilteredBranches = (branches, branchFilters) => {
    const branchesArray = Array.isArray(branches) ? branches : [];
    
    return branchesArray.filter(branch => {
      // State filter
      if (branchFilters.stateFilter !== 'all' && branch.state !== branchFilters.stateFilter) {
        return false;
      }
      
      // Status filter
      if (branchFilters.statusFilter !== 'all') {
        const hasActiveEvents = branch.activeEventsCount > 0;
        if (branchFilters.statusFilter === 'active' && !hasActiveEvents) {
          return false;
        }
        if (branchFilters.statusFilter === 'inactive' && hasActiveEvents) {
          return false;
        }
      }
      
      // Admin filter
      if (branchFilters.adminFilter !== 'all') {
        const hasAdmin = branch.adminCount > 0;
        if (branchFilters.adminFilter === 'with_admin' && !hasAdmin) {
          return false;
        }
        if (branchFilters.adminFilter === 'without_admin' && hasAdmin) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleFilterChange = (setBranchFilters, filterType, value) => {
    setBranchFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = (setBranchFilters) => {
    setBranchFilters({
      stateFilter: 'all',
      statusFilter: 'all',
      adminFilter: 'all'
    });
  };

  return {
    loadBranches,
    getUniqueStates,
    getFilteredBranches,
    handleFilterChange,
    clearFilters
  };
};
