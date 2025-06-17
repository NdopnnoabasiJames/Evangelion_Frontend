import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";

export const dashboardService = {
  // Get current user profile with populated state/branch information
  getUserProfile: async () => {
    try {
      const response = await api.get("/api/auth/profile");
      return response.data?.data?.data || response.data?.data || response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
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

  // Super Admin Dashboard Stats
  getSuperAdminDashboardStats: async () => {
    try {
      const [basicAnalytics, statesResponse, eventsResponse, zoneStats] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
          api.get("/api/states"),
          api.get("/api/events"),
          api.get("/api/zones/statistics"),
        ]);

      const statesData = statesResponse.data?.data || statesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};
      const zoneStatsData = zoneStats.data?.data || zoneStats.data || {};

      const totalUsers = analyticsData?.totalUsers || 0;

      const stats = {
        totalStates: Array.isArray(statesData) ? statesData.length : 0,
        totalEvents: Array.isArray(eventsData) ? eventsData.length : 0,
        totalUsers: totalUsers,
        totalGuests: analyticsData?.totalGuests || 0,
        checkedInGuests: analyticsData?.checkedInGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0,
        // Zone statistics
        totalZones: zoneStatsData?.totalZones || 0,
        activeZones: zoneStatsData?.activeZones || 0,
        inactiveZones: zoneStatsData?.inactiveZones || 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching super admin stats:", error);
      return {
        totalStates: 0,
        totalEvents: 0,
        totalUsers: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        checkInRate: 0,
        totalZones: 0,
        activeZones: 0,
        inactiveZones: 0,
      };
    }
  },

  // State Admin Dashboard Stats
  getStateAdminDashboardStats: async () => {
    try {
      const userProfileResponse = await api.get("/api/auth/profile");
      const userProfile =
        userProfileResponse.data?.data?.data ||
        userProfileResponse.data?.data ||
        userProfileResponse.data;
      const stateId = userProfile?.state?._id || userProfile?.state;

      if (!stateId) {
        throw new Error("State admin must have a state assigned");
      }

      const [basicAnalytics, branchesResponse, zonesResponse, eventsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
          api.get(`/api/branches/by-state/${stateId}`),
          api.get(`/api/zones/by-state/${stateId}`),
          api.get(API_ENDPOINTS.EVENTS.ACCESSIBLE),
        ]);

      const branchesData = branchesResponse.data?.data || branchesResponse.data || [];
      const zonesData = zonesResponse.data?.data || zonesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};

      const activeEvents = Array.isArray(eventsData)
        ? eventsData.filter((event) => {
            const isActiveByFlag = event.isActive === true;
            const isActiveByStatus = ["published", "draft"].includes(event.status);
            return isActiveByFlag || isActiveByStatus;
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
      console.error("Error fetching state admin stats:", error);
      return {
        totalBranches: 0,
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        checkInRate: 0,
      };
    }
  },

  // Branch Admin Dashboard Stats
  getBranchAdminDashboardStats: async () => {
    try {
      const response = await api.get('/api/admin-hierarchy/branch/dashboard-stats');
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('Error fetching branch admin dashboard stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch branch admin dashboard statistics');
    }
  },

  // Worker Dashboard Stats
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
        guestsRegistered: 0,
        thisWeek: thisWeekRegistrations,
        recentActivity: "Guest registration activity",
      };

      return stats;
    } catch (error) {
      console.error("Error fetching worker stats:", error);
      return {
        guestsRegistered: 0,
        thisWeek: 0,
        recentActivity: "Guest registration activity",
      };
    }
  },

  // Registrar Dashboard Stats
  getRegistrarDashboardStats: async () => {
    try {
      const stats = {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: "Check-in session activity",
      };
      return stats;
    } catch (error) {
      console.error("Error fetching registrar stats:", error);
      return {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: "Check-in session activity",
      };
    }
  },  // Get role-specific dashboard data
  getDashboardStatsByRole: async (userRole) => {
    switch (userRole) {
      case "super_admin":
        // Dynamically import to avoid circular dependency
        const { systemMetricsService } = await import("./systemMetricsService");
        return systemMetricsService.getEnhancedSuperAdminStats();
      case "state_admin":
        return dashboardService.getStateAdminDashboardStats();
      case "branch_admin":
        return dashboardService.getBranchAdminDashboardStats();
      case "worker":
        return dashboardService.getWorkerDashboardStats();
      case "registrar":
        return dashboardService.getRegistrarDashboardStats();
      default:
        return dashboardService.getDashboardAnalytics();
    }
  },
};

export default dashboardService;
