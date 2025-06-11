import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";

/**
 * Service for role-specific dashboard statistics
 */
export const dashboardStatsService = {
  // Get current user profile with populated hierarchy information
  getUserProfile: async () => {
    try {
      const response = await api.get("/api/auth/profile");
      return response.data?.data?.data || response.data?.data || response.data;
    } catch (error) {
      console.error("DashboardStats: Error fetching user profile:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  },

  // Super Admin Dashboard Statistics
  getSuperAdminDashboardStats: async () => {
    try {
      const [basicAnalytics, statesResponse, eventsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
          api.get("/api/states"),
          api.get("/api/events"),
        ]);

      const statesData = statesResponse.data?.data || statesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};

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
      console.error("DashboardStats: Error fetching super admin stats:", error);
      console.error("DashboardStats: Error details:", error.response?.data);

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
  },

  // State Admin Dashboard Statistics
  getStateAdminDashboardStats: async () => {
    try {
      const userProfileResponse = await api.get("/api/auth/profile");
      const userProfile =
        userProfileResponse.data?.data?.data ||
        userProfileResponse.data?.data ||
        userProfileResponse.data;
      const stateId = userProfile?.state?._id || userProfile?.state;

      if (!stateId) {
        console.error("DashboardStats: State admin has no state assigned");
        console.error("DashboardStats: User profile structure:", userProfile);
        throw new Error("State admin must have a state assigned");
      }

      const [basicAnalytics, branchesResponse, zonesResponse, eventsResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
          api.get(`/api/branches/by-state/${stateId}`),
          api.get(`/api/zones/by-state/${stateId}`),
          api.get("/api/events"),
        ]);

      const branchesData =
        branchesResponse.data?.data || branchesResponse.data || [];
      const zonesData = zonesResponse.data?.data || zonesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};

      const activeEvents = Array.isArray(eventsData)
        ? eventsData.filter((event) =>
            ["active", "published", "in_progress"].includes(event.status)
          )
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
      console.error("DashboardStats: Error fetching state admin stats:", error);
      return {
        totalBranches: 0,
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        checkInRate: 0,
      };
    }
  },

  // Branch Admin Dashboard Statistics
  getBranchAdminDashboardStats: async () => {
    try {
      const userProfileResponse = await api.get("/api/auth/profile");
      const userProfile =
        userProfileResponse.data?.data?.data ||
        userProfileResponse.data?.data ||
        userProfileResponse.data;
      const branchId = userProfile?.branch?._id || userProfile?.branch;

      if (!branchId) {
        console.error("DashboardStats: Branch admin has no branch assigned");
        throw new Error("Branch admin must have a branch assigned");
      }

      const [basicAnalytics, zonesResponse] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
        api.get(`/api/zones/by-branch/${branchId}`),
      ]);

      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};
      const zonesData = zonesResponse.data?.data || zonesResponse.data || [];
      const stats = {
        totalZones: Array.isArray(zonesData) ? zonesData.length : 0,
        activeEvents: 0, // We'll implement this endpoint later
        totalGuests: analyticsData?.totalGuests || 0,
        totalRegistrations: analyticsData?.totalRegistrations || 0,
        // Legacy fields for backward compatibility
        zones: Array.isArray(zonesData) ? zonesData.length : 0,
        workers: 0,
        registrars: 0,
      };

      return stats;
    } catch (error) {
      console.error(
        "DashboardStats: Error fetching branch admin stats:",
        error
      );
      return {
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        totalRegistrations: 0,
        zones: 0,
        workers: 0,
        registrars: 0,
      };
    }
  },

  // Worker Dashboard Statistics
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
        guestsRegistered: 0, // We'll implement MY_GUESTS endpoint later
        thisWeek: thisWeekRegistrations,
        recentActivity: "Guest registration activity",
      };

      return stats;
    } catch (error) {
      console.error("DashboardStats: Error fetching worker stats:", error);
      return {
        guestsRegistered: 0,
        thisWeek: 0,
        recentActivity: "Guest registration activity",
      };
    }
  }, // Zonal Admin Dashboard Statistics
  getZonalAdminDashboardStats: async () => {
    try {
      // First get user profile to understand the zonal admin's zone assignment
      const userProfileResponse = await api.get("/api/auth/profile");
      const userProfile =
        userProfileResponse.data?.data?.data ||
        userProfileResponse.data?.data ||
        userProfileResponse.data;

      const [basicAnalytics, registrarSummary] = await Promise.all([
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
        api.get(API_ENDPOINTS.REGISTRARS.ASSIGNMENTS_SUMMARY),
      ]);

      const analyticsData =
        basicAnalytics.data?.data || basicAnalytics.data || {};
      const registrarData =
        registrarSummary.data?.data || registrarSummary.data || {};

      const stats = {
        totalRegistrars: registrarData?.totalRegistrars || 0,
        activeEvents: 0, // We'll implement this endpoint later
        totalGuests: analyticsData?.totalGuests || 0,
        recentCheckIns: analyticsData?.checkedInGuests || 0,

        // Legacy fields for backward compatibility
        registrars: registrarData?.totalRegistrars || 0,
        assignedRegistrars: registrarData?.assignedRegistrars || 0,
        unassignedRegistrars: registrarData?.unassignedRegistrars || 0,
      };

      // Info for zero registrars (normal for new system)
      if (stats.totalRegistrars === 0) {
        console.info(
          "DashboardStats: No registrars found for zone:",
          userProfile?.zone?.name || "No zone assigned"
        );
        console.info(
          "DashboardStats: This is normal for a new system or zone with no registrar assignments yet"
        );
      }
      return stats;
    } catch (error) {
      console.error("DashboardStats: Error fetching zonal admin stats:", error);

      // Return fallback stats
      const fallbackStats = {
        totalRegistrars: 0,
        activeEvents: 0,
        totalGuests: 0,
        recentCheckIns: 0,
        registrars: 0,
        assignedRegistrars: 0,
        unassignedRegistrars: 0,
      };
      return fallbackStats;
    }
  },

  // Registrar Dashboard Statistics
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
      console.error("DashboardStats: Error fetching registrar stats:", error);
      return {
        checkinsToday: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        recentActivity: "Check-in session activity",
      };
    }
  },

  // Get role-specific dashboard data
  getDashboardStatsByRole: async (userRole) => {
    switch (userRole) {
      case "super_admin":
        const { systemMetricsService } = await import("./systemMetricsService");
        return systemMetricsService.getEnhancedSuperAdminStats();
      case "state_admin":
        return dashboardStatsService.getStateAdminDashboardStats();
      case "branch_admin":
        return dashboardStatsService.getBranchAdminDashboardStats();
      case "zonal_admin":
        return dashboardStatsService.getZonalAdminDashboardStats();
      case "worker":
        return dashboardStatsService.getWorkerDashboardStats();
      case "registrar":
        return dashboardStatsService.getRegistrarDashboardStats();
      default:
        const { analyticsService } = await import("./analyticsService");
        return analyticsService.getDashboardAnalytics();
    }
  },
};

export default dashboardStatsService;
