import api from './api';
import adminManagementService from './adminManagement';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Service for comprehensive system metrics and enhanced dashboard data
 */
export const systemMetricsService = {
  // Get comprehensive system metrics
  getSystemMetrics: async () => {
    try {
      const response = await api.get('/api/users/system-metrics');
      
      const systemMetrics = response.data?.data || response.data || {};
      
      return systemMetrics;
    } catch (error) {
      console.error('SystemMetrics: Error fetching system metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch system metrics');
    }
  },

  // Get admin hierarchy statistics
  getAdminHierarchyStats: async () => {
    try {
      const response = await api.get('/api/users/admin-hierarchy-stats');
      
      const hierarchyStats = response.data?.data || response.data || {};
      
      return hierarchyStats;
    } catch (error) {
      console.error('SystemMetrics: Error fetching admin hierarchy stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin hierarchy statistics');
    }
  },

  // Get user role breakdown
  getUserRoleBreakdown: async () => {
    try {
      const response = await api.get('/api/users/user-role-breakdown');
      
      const roleBreakdown = response.data?.data || response.data || {};
      
      return roleBreakdown;
    } catch (error) {
      console.error('SystemMetrics: Error fetching user role breakdown:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user role breakdown');
    }
  },
  // Enhanced Super Admin Dashboard with Phase 2 metrics
  getEnhancedSuperAdminStats: async () => {
    try {
      
      const [
        systemMetrics,
        hierarchyStats,
        roleBreakdown,
        pendingAdmins,
        pickupStationsResponse
      ] = await Promise.all([
        systemMetricsService.getSystemMetrics(),
        systemMetricsService.getAdminHierarchyStats(),
        systemMetricsService.getUserRoleBreakdown(),
        adminManagementService.getPendingAdmins(),        api.get(API_ENDPOINTS.PICKUP_STATIONS.BASE).catch(err => {
          console.error('Error fetching pickup stations:', err);
          return { data: [] };
        })      ]);

      const pickupStationsData = pickupStationsResponse.data?.data || pickupStationsResponse.data || [];

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
        totalPickupStations: Array.isArray(pickupStationsData) ? pickupStationsData.length : 0,
        
        // Admin breakdown for visual charts
        adminsByRole: {
          stateAdmins: hierarchyStats?.stateAdmins || 0,
          branchAdmins: hierarchyStats?.branchAdmins || 0,
          branchMes: hierarchyStats?.branchMes || 0,
          zonalAdmins: hierarchyStats?.zonalAdmins || 0,
          workers: hierarchyStats?.workers || 0
        }
      };

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
        totalPickupStations: 0,
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
