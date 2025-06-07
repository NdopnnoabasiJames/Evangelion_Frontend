import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import adminManagementService from './adminManagementService';
import dashboardStatsService from './dashboardStatsService';
import systemMetricsService from './systemMetricsService';

export const analyticsService = {
  // Re-export admin management functions
  ...adminManagementService,
  
  // Re-export dashboard stats functions
  ...dashboardStatsService,
  
  // Re-export system metrics functions
  ...systemMetricsService,
  // Core analytics functions
  getDashboardAnalytics: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard analytics');
    }
  },

  // Get registration trends
  getRegistrationTrends: async (days = 30) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.TRENDS, { 
        params: { days } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch registration trends');
    }
  },

  // Get worker performance data
  getWorkerPerformance: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(API_ENDPOINTS.ANALYTICS.WORKER_PERFORMANCE, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch worker performance');
    }
  },

  // Get event summary
  getEventSummary: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EVENT_SUMMARY);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event summary');
    }
  },

  // Export analytics data
  exportAnalytics: async (filters = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EXPORT, {
        params: filters,
        responseType: 'blob'
      });
      
      // Create blob URL for download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export analytics data');
    }
  },

  // System Metrics Functions for Phase 2 Super Admin Dashboard
  // Get comprehensive system metrics
  getSystemMetrics: async () => {
    try {
      console.log('Analytics: Fetching comprehensive system metrics...');
      const response = await api.get('/api/users/system-metrics');
      console.log('Analytics: System metrics raw response:', response.data);
      
      // Extract the actual data from nested structure
      const systemMetrics = response.data?.data || response.data || {};
      console.log('Analytics: Extracted system metrics:', systemMetrics);
      
      return systemMetrics;
    } catch (error) {
      console.error('Analytics: Error fetching system metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch system metrics');
    }
  },
  // Get admin hierarchy statistics
  getAdminHierarchyStats: async () => {
    try {
      console.log('Analytics: Fetching admin hierarchy statistics...');
      const response = await api.get('/api/users/admin-hierarchy-stats');
      console.log('Analytics: Admin hierarchy raw response:', response.data);
      
      // Extract the actual data from nested structure
      const hierarchyStats = response.data?.data || response.data || {};
      console.log('Analytics: Extracted hierarchy stats:', hierarchyStats);
      
      return hierarchyStats;
    } catch (error) {
      console.error('Analytics: Error fetching admin hierarchy stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin hierarchy statistics');
    }
  },
  // Get user role breakdown
  getUserRoleBreakdown: async () => {
    try {
      console.log('Analytics: Fetching user role breakdown...');
      const response = await api.get('/api/users/user-role-breakdown');
      console.log('Analytics: User role breakdown raw response:', response.data);
      
      // Extract the actual data from nested structure
      const roleBreakdown = response.data?.data || response.data || {};
      console.log('Analytics: Extracted role breakdown:', roleBreakdown);
      
      return roleBreakdown;
    } catch (error) {
      console.error('Analytics: Error fetching user role breakdown:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user role breakdown');
    }
  },
  // Enhanced Super Admin Dashboard with Phase 2 metrics
  getEnhancedSuperAdminStats: async () => {
    try{
      console.log('Analytics: Fetching enhanced super admin dashboard stats...');
        const [
        systemMetrics,
        hierarchyStats,
        roleBreakdown,
        pendingAdmins
      ] = await Promise.all([
        analyticsService.getSystemMetrics(),
        analyticsService.getAdminHierarchyStats(),
        analyticsService.getUserRoleBreakdown(),
        analyticsService.getPendingAdmins()
      ]);      const enhancedStats = {
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

      console.log('Analytics: Enhanced super admin stats:', enhancedStats);
      return enhancedStats;
    } catch (error) {
      console.error('Analytics: Error fetching enhanced super admin stats:', error);
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
  },

  // Process data for Chart.js format
  processChartData: {
    // Process trends data for line chart
    trendsToLineChart: (trendsData) => {
      if (!trendsData || !Array.isArray(trendsData)) {
        return {
          labels: [],
          values: []
        };
      }

      return {
        labels: trendsData.map(item => new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })),
        values: trendsData.map(item => item.registrations)
      };
    },

    // Process worker performance for bar chart
    workerPerformanceToBarChart: (workerData) => {
      if (!workerData || !Array.isArray(workerData)) {
        return {
          labels: [],
          values: []
        };
      }

      return {
        labels: workerData.slice(0, 10).map(worker => worker.workerName || 'Unknown'),
        values: workerData.slice(0, 10).map(worker => worker.totalRegistrations)
      };
    },

    // Process basic analytics for statistics cards
    basicAnalyticsToCards: (basicData) => {
      if (!basicData) {
        return {
          totalEvents: 0,
          totalGuests: 0,
          totalWorkers: 0,
          totalCheckIns: 0
        };
      }

      return {
        totalEvents: basicData.totalEvents || 0,
        totalGuests: basicData.totalGuests || 0,
        totalWorkers: basicData.totalWorkers || 0,
        totalCheckIns: basicData.checkedInGuests || 0
      };
    },

    // Process guest stats for doughnut chart
    guestStatsToDoughnut: (basicData) => {
      if (!basicData || !basicData.transportBreakdown) {
        return {
          values: [0, 0, 0],
          labels: ['Registered', 'Checked In', 'No Show']
        };
      }

      const total = basicData.totalGuests || 0;
      const checkedIn = basicData.checkedInGuests || 0;
      const noShow = total - checkedIn;

      return {
        values: [total, checkedIn, noShow],
        labels: ['Registered', 'Checked In', 'No Show']
      };
    },

    // Process check-in analytics for bar chart (weekly data)
    checkInAnalyticsToBar: (basicData, trendsData) => {
      // For now, we'll use recent trends data to simulate weekly check-in data
      if (!trendsData || !Array.isArray(trendsData)) {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [45, 52, 38, 67, 89, 95, 78] // Fallback data
        };
      }

      // Get last 7 days of data
      const last7Days = trendsData.slice(-7);
      return {
        labels: last7Days.map(item => new Date(item.date).toLocaleDateString('en-US', { 
          weekday: 'short' 
        })),
        values: last7Days.map(item => item.registrations)
      };
    }
  }
};

export default analyticsService;
