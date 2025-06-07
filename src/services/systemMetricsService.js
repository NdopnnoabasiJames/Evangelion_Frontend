import api from './api';
import adminManagementService from './adminManagementService';

/**
 * Service for comprehensive system metrics and enhanced dashboard data
 */
export const systemMetricsService = {
  // Get comprehensive system metrics
  getSystemMetrics: async () => {
    try {
      console.log('SystemMetrics: Fetching comprehensive system metrics...');
      const response = await api.get('/api/users/system-metrics');
      console.log('SystemMetrics: System metrics raw response:', response.data);
      
      const systemMetrics = response.data?.data || response.data || {};
      console.log('SystemMetrics: Extracted system metrics:', systemMetrics);
      
      return systemMetrics;
    } catch (error) {
      console.error('SystemMetrics: Error fetching system metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch system metrics');
    }
  },

  // Get admin hierarchy statistics
  getAdminHierarchyStats: async () => {
    try {
      console.log('SystemMetrics: Fetching admin hierarchy statistics...');
      const response = await api.get('/api/users/admin-hierarchy-stats');
      console.log('SystemMetrics: Admin hierarchy raw response:', response.data);
      
      const hierarchyStats = response.data?.data || response.data || {};
      console.log('SystemMetrics: Extracted hierarchy stats:', hierarchyStats);
      
      return hierarchyStats;
    } catch (error) {
      console.error('SystemMetrics: Error fetching admin hierarchy stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin hierarchy statistics');
    }
  },

  // Get user role breakdown
  getUserRoleBreakdown: async () => {
    try {
      console.log('SystemMetrics: Fetching user role breakdown...');
      const response = await api.get('/api/users/user-role-breakdown');
      console.log('SystemMetrics: User role breakdown raw response:', response.data);
      
      const roleBreakdown = response.data?.data || response.data || {};
      console.log('SystemMetrics: Extracted role breakdown:', roleBreakdown);
      
      return roleBreakdown;
    } catch (error) {
      console.error('SystemMetrics: Error fetching user role breakdown:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user role breakdown');
    }
  },

  // Enhanced Super Admin Dashboard with Phase 2 metrics
  getEnhancedSuperAdminStats: async () => {
    try {
      console.log('SystemMetrics: Fetching enhanced super admin dashboard stats...');
      
      const [
        systemMetrics,
        hierarchyStats,
        roleBreakdown,
        pendingAdmins
      ] = await Promise.all([
        systemMetricsService.getSystemMetrics(),
        systemMetricsService.getAdminHierarchyStats(),
        systemMetricsService.getUserRoleBreakdown(),
        adminManagementService.getPendingAdmins()
      ]);

      const enhancedStats = {
        // Phase 1 data (existing)
        pendingAdmins: Array.isArray(pendingAdmins) ? pendingAdmins.length : 0,
        pendingAdminsList: pendingAdmins,
        
        // Phase 2 data (new comprehensive metrics)
        systemMetrics,
        hierarchyStats,
        roleBreakdown,
        
        // Derived metrics for dashboard cards
        totalUsers: systemMetrics?.totalUsers || 0,
        totalStates: systemMetrics?.totalStates || 0,
        totalBranches: systemMetrics?.totalBranches || 0,
        totalZones: systemMetrics?.totalZones || 0,
        totalEvents: systemMetrics?.totalEvents || 0,
        totalGuests: systemMetrics?.totalGuests || 0,
        
        // Admin breakdown for visual charts
        adminsByRole: {
          stateAdmins: hierarchyStats?.stateAdmins || 0,
          branchAdmins: hierarchyStats?.branchAdmins || 0,
          zonalAdmins: hierarchyStats?.zonalAdmins || 0,
          workers: hierarchyStats?.workers || 0
        }
      };

      console.log('SystemMetrics: Enhanced super admin stats:', enhancedStats);
      return enhancedStats;
    } catch (error) {
      console.error('SystemMetrics: Error fetching enhanced super admin stats:', error);
      
      // Return fallback data with both Phase 1 and Phase 2 structure
      return {
        pendingAdmins: 0,
        pendingAdminsList: [],
        systemMetrics: {},
        hierarchyStats: {},
        roleBreakdown: {},
        totalUsers: 0,
        totalStates: 0,
        totalBranches: 0,
        totalZones: 0,
        totalEvents: 0,
        totalGuests: 0,
        adminsByRole: {
          stateAdmins: 0,
          branchAdmins: 0,
          zonalAdmins: 0,
          workers: 0
        }
      };
    }
  }
};

export default systemMetricsService;
