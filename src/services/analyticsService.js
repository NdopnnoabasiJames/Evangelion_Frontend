import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const analyticsService = {
  // Get basic dashboard analytics
  getDashboardAnalytics: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard analytics');
    }
  },

  // Admin Management Functions for Super Admin
  // Get pending admin registrations
  getPendingAdmins: async () => {
    try {
      console.log('Analytics: Fetching pending admin registrations...');
      const response = await api.get('/api/users/pending-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Analytics: Error fetching pending admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending admin registrations');
    }
  },
  // Approve admin registration
  approveAdmin: async (adminId, adminData) => {
    try {
      console.log('Analytics: Approving admin - ID:', adminId, 'Type:', typeof adminId, 'Data:', adminData);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/approve-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('Analytics: Error approving admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve admin registration');
    }
  },
  // Reject admin registration
  rejectAdmin: async (adminId, reason) => {
    try {
      console.log('Analytics: Rejecting admin - ID:', adminId, 'Type:', typeof adminId, 'Reason:', reason);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/reject-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('Analytics: Error rejecting admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject admin registration');
    }
  },

  // Get admin approval history
  getAdminApprovalHistory: async () => {
    try {
      console.log('Analytics: Fetching admin approval history...');
      const response = await api.get('/api/users/admin-approval-history');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Analytics: Error fetching admin approval history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin approval history');
    }
  },

  // Get super admin dashboard statistics
  getSuperAdminDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching super admin dashboard stats...');
      
      // Fetch multiple data sources for super admin using CORRECT endpoints
      const [
        basicAnalytics,
        statesResponse,
        eventsResponse
      ] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD), // /api/admin/guests/analytics/basic
        api.get('/api/states'), // Correct states endpoint
        api.get('/api/events') // Use basic events endpoint instead of accessible
      ]);      console.log('Analytics: Basic analytics response:', basicAnalytics.data);
      console.log('Analytics: States response:', statesResponse.data);
      console.log('Analytics: Events response:', eventsResponse.data);

      // Extract data from API responses - they have { data: [...] } structure
      const statesData = statesResponse.data?.data || statesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};

      // For user count, let's try to get it from basic analytics or set a default
      const totalUsers = analyticsData?.totalUsers || 0;

      const stats = {
        totalStates: Array.isArray(statesData) ? statesData.length : 0,
        totalEvents: Array.isArray(eventsData) ? eventsData.length : 0,
        totalUsers: totalUsers,
        totalGuests: analyticsData?.totalGuests || 0,
        checkedInGuests: analyticsData?.checkedInGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0
      };

      console.log('Analytics: Final stats object:', stats);
      return stats;
    } catch (error) {
      console.error('Analytics: Error fetching super admin stats:', error);
      console.error('Analytics: Error details:', error.response?.data);
      
      // Return fallback data instead of throwing error
      const fallbackStats = {
        totalStates: 0,
        totalEvents: 0,
        totalUsers: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        checkInRate: 0
      };
      
      console.log('Analytics: Returning fallback stats:', fallbackStats);
      return fallbackStats;
    }
  },
  // Get state admin dashboard statistics
  getStateAdminDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching state admin dashboard stats...');
      
      const [
        basicAnalytics,
        eventsResponse
      ] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
        api.get('/api/events')
      ]);      // Extract data from API responses
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};

      const activeEvents = Array.isArray(eventsData) ? eventsData.filter(event => 
        ['active', 'published', 'in_progress'].includes(event.status)
      ) : [];

      const stats = {
        branches: 0, // We'll need to implement this endpoint later
        activeEvents: activeEvents.length,
        totalGuests: analyticsData?.totalGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0
      };

      console.log('Analytics: State admin stats:', stats);
      return stats;
    } catch (error) {
      console.error('Analytics: Error fetching state admin stats:', error);
      return {
        branches: 0,
        activeEvents: 0,
        totalGuests: 0,
        checkInRate: 0
      };
    }
  },
  // Get branch admin dashboard statistics
  getBranchAdminDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching branch admin dashboard stats...');
      
      const [
        basicAnalytics
      ] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD)
      ]);      // Extract data from API responses
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};

      const stats = {
        zones: 0, // We'll need to implement this endpoint later
        workers: 0, // We'll need to implement this endpoint later
        registrars: 0, // We'll need to implement this endpoint later
        totalGuests: analyticsData?.totalGuests || 0
      };

      console.log('Analytics: Branch admin stats:', stats);
      return stats;
    } catch (error) {
      console.error('Analytics: Error fetching branch admin stats:', error);
      return {
        zones: 0,
        workers: 0,
        registrars: 0,
        totalGuests: 0
      };
    }
  },
  // Get worker dashboard statistics
  getWorkerDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching worker dashboard stats...');
      
      const [
        trendsResponse
      ] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.TRENDS, { params: { days: 7 } })
      ]);

      const thisWeekRegistrations = trendsResponse.data?.reduce((sum, day) => 
        sum + (day.registrations || 0), 0
      ) || 0;

      const stats = {
        guestsRegistered: 0, // We'll need to implement MY_GUESTS endpoint later
        thisWeek: thisWeekRegistrations,
        recentActivity: 'Guest registration activity'
      };

      console.log('Analytics: Worker stats:', stats);
      return stats;
    } catch (error) {
      console.error('Analytics: Error fetching worker stats:', error);
      return {
        guestsRegistered: 0,
        thisWeek: 0,
        recentActivity: 'Guest registration activity'
      };
    }
  },
  // Get registrar dashboard statistics
  getRegistrarDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching registrar dashboard stats...');
      
      // For now, return basic stats until we implement the registrar dashboard endpoint
      const stats = {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: 'Check-in session activity'
      };

      console.log('Analytics: Registrar stats:', stats);
      return stats;
    } catch (error) {
      console.error('Analytics: Error fetching registrar stats:', error);
      return {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: 'Check-in session activity'
      };
    }
  },  // Get role-specific dashboard data
  getDashboardStatsByRole: async (userRole) => {
    console.log('Analytics: getDashboardStatsByRole called with role:', userRole);
    
    switch (userRole) {
      case 'super_admin':
        console.log('Analytics: Calling getEnhancedSuperAdminStats for Phase 2');
        return analyticsService.getEnhancedSuperAdminStats();
      case 'state_admin':
        return analyticsService.getStateAdminDashboardStats();
      case 'branch_admin':
        return analyticsService.getBranchAdminDashboardStats();
      case 'worker':
        return analyticsService.getWorkerDashboardStats();
      case 'registrar':
        return analyticsService.getRegistrarDashboardStats();
      default:
        console.log('Analytics: Falling back to default getDashboardAnalytics');
        return analyticsService.getDashboardAnalytics();
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
