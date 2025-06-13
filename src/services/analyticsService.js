import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";

export const analyticsService = {
  // Get current user profile with populated state/branch information
  getUserProfile: async () => {
    try {
      const response = await api.get("/api/auth/profile");
      return response.data?.data?.data || response.data?.data || response.data;
    } catch (error) {
      console.error("Analytics: Error fetching user profile:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  },

  // Get basic dashboard analytics
  getDashboardAnalytics: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch dashboard analytics"
      );
    }
  },

  // Admin Management Functions for Super Admin
  // Get pending admin registrations
  getPendingAdmins: async () => {
    try {
      const response = await api.get("/api/users/pending-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Analytics: Error fetching pending admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch pending admin registrations"
      );
    }
  },

  // Get approved admin registrations
  getApprovedAdmins: async () => {
    try {
      const response = await api.get("/api/users/approved-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Analytics: Error fetching approved admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch approved admin registrations"
      );
    }
  },

  // Approve admin registration
  approveAdmin: async (adminId, adminData) => {
    try {
      if (!adminId || adminId === "undefined") {
        throw new Error("Admin ID is undefined or invalid");
      }

      const response = await api.post(
        `/api/users/approve-admin/${adminId}`,
        adminData
      );
      return response.data;
    } catch (error) {
      console.error("Analytics: Error approving admin:", error);
      throw new Error(
        error.response?.data?.message || "Failed to approve admin registration"
      );
    }
  },

  // Reject admin registration
  rejectAdmin: async (adminId, reason) => {
    try {
      if (!adminId || adminId === "undefined") {
        throw new Error("Admin ID is undefined or invalid");
      }

      const response = await api.post(`/api/users/reject-admin/${adminId}`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Analytics: Error rejecting admin:", error);
      throw new Error(
        error.response?.data?.message || "Failed to reject admin registration"
      );
    }
  },
  // Get admin approval history
  getAdminApprovalHistory: async () => {
    try {
      const response = await api.get("/api/users/admin-approval-history");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Analytics: Error fetching admin approval history:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch admin approval history"
      );
    }
  },
  // Get super admin dashboard statistics
  getSuperAdminDashboardStats: async () => {
    try {
      // Fetch multiple data sources for super admin using CORRECT endpoints
      const [basicAnalytics, statesResponse, eventsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD), // /api/admin/guests/analytics/basic
          api.get("/api/states"), // Correct states endpoint        api.get('/api/events') // Use basic events endpoint instead of accessible
        ]);

      // Extract data from API responses - they have { data: [...] } structure
      const statesData = statesResponse.data?.data || statesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};

      // For user count, let's try to get it from basic analytics or set a default
      const totalUsers = analyticsData?.totalUsers || 0;

      const stats = {
        totalStates: Array.isArray(statesData) ? statesData.length : 0,
        totalEvents: Array.isArray(eventsData) ? eventsData.length : 0,
        totalUsers: totalUsers,
        totalGuests: analyticsData?.totalGuests || 0,
        checkedInGuests: analyticsData?.checkedInGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0,
      };

      return stats;
    } catch (error) {
      console.error("Analytics: Error fetching super admin stats:", error);
      console.error("Analytics: Error details:", error.response?.data);

      // Return fallback data instead of throwing error
      const fallbackStats = {
        totalStates: 0,
        totalEvents: 0,
        totalUsers: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        checkInRate: 0,
      };

      return fallbackStats;
    }
  }, // Get state admin dashboard statistics
  getStateAdminDashboardStats: async () => {
    try {
      // First get the current user's profile to get their state ID
      const userProfileResponse = await api.get("/api/auth/profile");
      const userProfile =
        userProfileResponse.data?.data?.data ||
        userProfileResponse.data?.data ||
        userProfileResponse.data;
      const stateId = userProfile?.state?._id || userProfile?.state;

      if (!stateId) {
        console.error("Analytics: State admin has no state assigned");
        console.error("Analytics: User profile structure:", userProfile);
        throw new Error("State admin must have a state assigned");
      }

      const [basicAnalytics, branchesResponse, zonesResponse, eventsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
          api.get(`/api/branches/by-state/${stateId}`),
          api.get(`/api/zones/by-state/${stateId}`),
          api.get(API_ENDPOINTS.EVENTS.ACCESSIBLE),
        ]);

      // Extract data from API responses
      const branchesData =
        branchesResponse.data?.data || branchesResponse.data || [];
      const zonesData = zonesResponse.data?.data || zonesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};

      // Log all event statuses to understand what values we're getting
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        eventsData.forEach((event, index) => {
          // Silent processing - no console logs
        });
      }
      const activeEvents = Array.isArray(eventsData)
        ? eventsData.filter((event) => {
            // Events are considered active if they have isActive: true OR status is 'published'
            // Based on the database structure, we need to check both fields
            const isActiveByFlag = event.isActive === true;
            const isActiveByStatus = ["published", "draft"].includes(
              event.status
            );
            const isActive = isActiveByFlag || isActiveByStatus;

            return isActive;
          })
        : [];

      const stats = {
        totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
        totalZones: Array.isArray(zonesData) ? zonesData.length : 0,
        activeEvents: activeEvents.length,
        totalGuests: analyticsData?.totalGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0,
      };

      return stats;
    } catch (error) {
      console.error("Analytics: Error fetching state admin stats:", error);
      console.error(
        "Analytics: Error details:",
        error.response?.data?.message || error.message
      );

      // Log response status and data if available
      if (error.response) {
        console.error(
          "Analytics: Error response status:",
          error.response.status
        );
        console.error("Analytics: Error response data:", error.response.data);
      }

      return {
        totalBranches: 0,
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        checkInRate: 0,
      };
    }
  },

  // Branch Admin functions for State Admin  // Get pending branch admin registrations
  getPendingBranchAdmins: async () => {
    try {
      const response = await api.get("/api/users/pending-branch-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Analytics: Error fetching pending branch admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch pending branch admin registrations"
      );
    }
  },

  // Get approved branch admin registrations
  getApprovedBranchAdmins: async () => {
    try {
      const response = await api.get("/api/users/approved-branch-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Analytics: Error fetching approved branch admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch approved branch admin registrations"
      );
    }
  },

  // Approve branch admin registration
  approveBranchAdmin: async (adminId, adminData) => {
    try {
      if (!adminId || adminId === "undefined") {
        throw new Error("Branch Admin ID is undefined or invalid");
      }

      const response = await api.post(
        `/api/users/approve-branch-admin/${adminId}`,
        adminData
      );
      return response.data;
    } catch (error) {
      console.error("Analytics: Error approving branch admin:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to approve branch admin registration"
      );
    }
  },

  // Reject branch admin registration
  rejectBranchAdmin: async (adminId, reason) => {
    try {
      if (!adminId || adminId === "undefined") {
        throw new Error("Branch Admin ID is undefined or invalid");
      }

      const response = await api.post(
        `/api/users/reject-branch-admin/${adminId}`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error("Analytics: Error rejecting branch admin:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to reject branch admin registration"
      );
    }
  },
  // Branch Admin functions for Zone Admin management
  getPendingZonalAdmins: async () => {
    try {
      console.log('Analytics: Fetching pending zonal admin registrations...');
      const response = await api.get('/api/admin-hierarchy/branch/pending-zone-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Analytics: Error fetching pending zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending zonal admin registrations');
    }
  },

  getApprovedZonalAdmins: async () => {
    try {
      console.log('Analytics: Fetching approved zonal admin registrations...');
      const response = await api.get('/api/admin-hierarchy/branch/approved-zone-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Analytics: Error fetching approved zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch approved zonal admin registrations');
    }
  },

  approveZonalAdmin: async (adminId, adminData) => {
    try {
      console.log('Analytics: Approving zonal admin - ID:', adminId, 'Type:', typeof adminId, 'Data:', adminData);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/admin-hierarchy/branch/approve-zone-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('Analytics: Error approving zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve zonal admin registration');
    }
  },

  rejectZonalAdmin: async (adminId, reason) => {
    try {
      console.log('Analytics: Rejecting zonal admin - ID:', adminId, 'Type:', typeof adminId, 'Reason:', reason);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/admin-hierarchy/branch/reject-zone-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('Analytics: Error rejecting zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject zonal admin registration');
    }
  },

  getBranchAdminDashboardStats: async () => {
    try {
      console.log('Analytics: Fetching branch admin dashboard stats...');
      const response = await api.get('/api/admin-hierarchy/branch/dashboard-stats');
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('Analytics: Error fetching branch admin dashboard stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch branch admin dashboard statistics');
    }
  },

  // Get worker dashboard statistics
  getWorkerDashboardStats: async () => {
    try {
      const [trendsResponse] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.TRENDS, { params: { days: 7 } }),
      ]);

      const thisWeekRegistrations =
        trendsResponse.data?.reduce(
          (sum, day) => sum + (day.registrations || 0),
          0
        ) || 0;

      const stats = {
        guestsRegistered: 0, // We'll need to implement MY_GUESTS endpoint later
        thisWeek: thisWeekRegistrations,
        recentActivity: "Guest registration activity",
      };

      return stats;
    } catch (error) {
      console.error("Analytics: Error fetching worker stats:", error);
      return {
        guestsRegistered: 0,
        thisWeek: 0,
        recentActivity: "Guest registration activity",
      };
    }
  },
  // Get registrar dashboard statistics
  getRegistrarDashboardStats: async () => {
    try {
      // For now, return basic stats until we implement the registrar dashboard endpoint
      const stats = {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: "Check-in session activity",
      };
      return stats;
    } catch (error) {
      console.error("Analytics: Error fetching registrar stats:", error);
      return {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: "Check-in session activity",
      };
    }
  }, // Get role-specific dashboard data
  getDashboardStatsByRole: async (userRole) => {
    switch (userRole) {
      case "super_admin":
        return analyticsService.getEnhancedSuperAdminStats();
      case "state_admin":
        return analyticsService.getStateAdminDashboardStats();
      case "branch_admin":
        return analyticsService.getBranchAdminDashboardStats();
      case "worker":
        return analyticsService.getWorkerDashboardStats();
      case "registrar":
        return analyticsService.getRegistrarDashboardStats();
      default:
        console.log("Analytics: Falling back to default getDashboardAnalytics");
        return analyticsService.getDashboardAnalytics();
    }
  },

  // Get registration trends
  getRegistrationTrends: async (days = 30) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.TRENDS, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch registration trends"
      );
    }
  },

  // Get worker performance data
  getWorkerPerformance: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(
        API_ENDPOINTS.ANALYTICS.WORKER_PERFORMANCE,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch worker performance"
      );
    }
  },

  // Get event summary
  getEventSummary: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EVENT_SUMMARY);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch event summary"
      );
    }
  },

  // Export analytics data
  exportAnalytics: async (filters = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EXPORT, {
        params: filters,
        responseType: "blob",
      });

      // Create blob URL for download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to export analytics data"
      );
    }
  },

  // System Metrics Functions for Phase 2 Super Admin Dashboard
  // Get comprehensive system metrics
  getSystemMetrics: async () => {
    try {
      const response = await api.get("/api/users/system-metrics");

      // Extract the actual data from nested structure
      const systemMetrics = response.data?.data || response.data || {};

      return systemMetrics;
    } catch (error) {
      console.error("Analytics: Error fetching system metrics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch system metrics"
      );
    }
  },
  // Get admin hierarchy statistics
  getAdminHierarchyStats: async () => {
    try {
      const response = await api.get("/api/users/admin-hierarchy-stats");

      // Extract the actual data from nested structure
      const hierarchyStats = response.data?.data || response.data || {};

      return hierarchyStats;
    } catch (error) {
      console.error("Analytics: Error fetching admin hierarchy stats:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch admin hierarchy statistics"
      );
    }
  },
  // Get user role breakdown
  getUserRoleBreakdown: async () => {
    try {
      const response = await api.get("/api/users/user-role-breakdown");

      // Extract the actual data from nested structure
      const roleBreakdown = response.data?.data || response.data || {};

      return roleBreakdown;
    } catch (error) {
      console.error("Analytics: Error fetching user role breakdown:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch user role breakdown"
      );
    }
  },
  // Enhanced Super Admin Dashboard with Phase 2 metrics
  getEnhancedSuperAdminStats: async () => {
    try {
      const [systemMetrics, hierarchyStats, roleBreakdown, pendingAdmins] =
        await Promise.all([
          analyticsService.getSystemMetrics(),
          analyticsService.getAdminHierarchyStats(),
          analyticsService.getUserRoleBreakdown(),
          analyticsService.getPendingAdmins(),
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
          workers: hierarchyStats?.workers || 0,
        },
      };

      return enhancedStats;
    } catch (error) {
      console.error(
        "Analytics: Error fetching enhanced super admin stats:",
        error
      );
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
          workers: 0,
        },
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
          values: [],
        };
      }

      return {
        labels: trendsData.map((item) =>
          new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        ),
        values: trendsData.map((item) => item.registrations),
      };
    },

    // Process worker performance for bar chart
    workerPerformanceToBarChart: (workerData) => {
      if (!workerData || !Array.isArray(workerData)) {
        return {
          labels: [],
          values: [],
        };
      }

      return {
        labels: workerData
          .slice(0, 10)
          .map((worker) => worker.workerName || "Unknown"),
        values: workerData
          .slice(0, 10)
          .map((worker) => worker.totalRegistrations),
      };
    },

    // Process basic analytics for statistics cards
    basicAnalyticsToCards: (basicData) => {
      if (!basicData) {
        return {
          totalEvents: 0,
          totalGuests: 0,
          totalWorkers: 0,
          totalCheckIns: 0,
        };
      }

      return {
        totalEvents: basicData.totalEvents || 0,
        totalGuests: basicData.totalGuests || 0,
        totalWorkers: basicData.totalWorkers || 0,
        totalCheckIns: basicData.checkedInGuests || 0,
      };
    },

    // Process guest stats for doughnut chart
    guestStatsToDoughnut: (basicData) => {
      if (!basicData || !basicData.transportBreakdown) {
        return {
          values: [0, 0, 0],
          labels: ["Registered", "Checked In", "No Show"],
        };
      }

      const total = basicData.totalGuests || 0;
      const checkedIn = basicData.checkedInGuests || 0;
      const noShow = total - checkedIn;

      return {
        values: [total, checkedIn, noShow],
        labels: ["Registered", "Checked In", "No Show"],
      };
    },

    // Process check-in analytics for bar chart (weekly data)
    checkInAnalyticsToBar: (basicData, trendsData) => {
      // For now, we'll use recent trends data to simulate weekly check-in data
      if (!trendsData || !Array.isArray(trendsData)) {
        return {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [45, 52, 38, 67, 89, 95, 78], // Fallback data
        };
      }

      // Get last 7 days of data
      const last7Days = trendsData.slice(-7);
      return {
        labels: last7Days.map((item) =>
          new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          })
        ),
        values: last7Days.map((item) => item.registrations),
      };
    },
  },
};

export default analyticsService;
