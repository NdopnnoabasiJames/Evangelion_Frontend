import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";
import { systemMetricsService } from "./systemMetricsService";

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
  },  // Super Admin Dashboard Stats
  getSuperAdminDashboardStats: async () => {
    try {
      const [basicAnalytics, statesResponse, branchesResponse, eventsResponse, zoneStats, pickupStationsResponse, usersResponse] =
        await Promise.all([
          api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD).then(res => {
            console.log('[DashboardService] Analytics response:', res.data);
            return res;
          }).catch(err => {
            console.error('[DashboardService] Analytics API error:', err.response?.data || err.message);
            throw err;
          }),
          api.get("/api/states").then(res => {
            console.log('[DashboardService] States response length:', res.data?.length || 'no data');
            return res;
          }).catch(err => {
            console.error('[DashboardService] States API error:', err.response?.data || err.message);
            throw err;
          }),
          api.get("/api/branches").then(res => {
            console.log('[DashboardService] Branches response length:', res.data?.length || 'no data');
            return res;
          }).catch(err => {
            console.error('[DashboardService] Branches API error:', err.response?.data || err.message);
            throw err;
          }),
          api.get("/api/events").then(res => {
            console.log('[DashboardService] Events response length:', res.data?.length || 'no data');
            return res;
          }).catch(err => {
            console.error('[DashboardService] Events API error:', err.response?.data || err.message);
            throw err;
          }),
          api.get("/api/zones/statistics").then(res => {
            console.log('[DashboardService] Zone stats response:', res.data);
            return res;
          }).catch(err => {
            console.error('[DashboardService] Zone stats API error:', err.response?.data || err.message);
            throw err;
          }),          api.get(API_ENDPOINTS.PICKUP_STATIONS.BASE).catch(err => {
            console.error('Error fetching pickup stations:', err);
            return { data: [] };
          }),
          api.get(API_ENDPOINTS.ADMIN.USERS).then(res => {
            console.log('[DashboardService] Users response length:', res.data?.length || 'no data');
            return res;
          }).catch(err => {
            console.error('[DashboardService] Users API error:', err.response?.data || err.message);
            throw err;
          }),
        ]);

      console.log('[DashboardService] All API calls completed successfully');

      const statesData = statesResponse.data?.data || statesResponse.data || [];
      const branchesData = branchesResponse.data?.data || branchesResponse.data || [];
      const eventsData = eventsResponse.data?.data || eventsResponse.data || [];
      const analyticsData = basicAnalytics.data?.data || basicAnalytics.data || {};
      const zoneStatsData = zoneStats.data?.data || zoneStats.data || {};      const pickupStationsData = pickupStationsResponse.data?.data || pickupStationsResponse.data || [];
      const usersData = usersResponse.data?.data || usersResponse.data || [];

      const totalUsers = analyticsData?.totalUsers || 0;

      // Calculate active events (assuming events with isActive: true or similar)
      const activeEvents = Array.isArray(eventsData) 
        ? eventsData.filter(event => event.isActive !== false).length 
        : 0;

      // Calculate admin role breakdown
      const adminsByRole = {
        stateAdmins: 0,
        branchAdmins: 0,
        zonalAdmins: 0,
        workers: 0
      };

      if (Array.isArray(usersData)) {
        usersData.forEach(user => {
          switch (user.role) {
            case 'state_admin':
              adminsByRole.stateAdmins++;
              break;
            case 'branch_admin':
              adminsByRole.branchAdmins++;
              break;
            case 'zonal_admin':
              adminsByRole.zonalAdmins++;
              break;
            case 'worker':
              adminsByRole.workers++;
              break;
          }
        });
      }      const stats = {
        totalStates: Array.isArray(statesData) ? statesData.length : 0,
        totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
        totalEvents: Array.isArray(eventsData) ? eventsData.length : 0,
        activeEvents: activeEvents,
        totalUsers: totalUsers,
        totalGuests: analyticsData?.totalGuests || 0,
        checkedInGuests: analyticsData?.checkedInGuests || 0,
        checkInRate: analyticsData?.checkInRate || 0,
        // Zone statistics
        totalZones: zoneStatsData?.totalZones || 0,
        activeZones: zoneStatsData?.activeZones || 0,
        inactiveZones: zoneStatsData?.inactiveZones || 0,
        // Pickup stations statistics
        totalPickupStations: Array.isArray(pickupStationsData) ? pickupStationsData.length : 0,
        // Admin role breakdown
        adminsByRole: adminsByRole,
      };

      console.log('[DashboardService] Final dashboard stats:', stats);
      console.log('[DashboardService] Analytics data breakdown:', {
        analyticsDataRaw: analyticsData,
        totalGuests: analyticsData?.totalGuests,
        checkedInGuests: analyticsData?.checkedInGuests,
        checkInRate: analyticsData?.checkInRate
      });

      return stats;
    } catch (error) {
      console.error("Error fetching super admin stats:", error);      return {
        totalStates: 0,
        totalBranches: 0,
        totalEvents: 0,
        activeEvents: 0,
        totalUsers: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        checkInRate: 0,
        totalZones: 0,
        activeZones: 0,
        inactiveZones: 0,
        totalPickupStations: 0,
        adminsByRole: {
          stateAdmins: 0,
          branchAdmins: 0,
          zonalAdmins: 0,
          workers: 0
        },
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
      // Use worker-specific stats endpoint instead of admin analytics
      const response = await api.get(API_ENDPOINTS.WORKERS.STATS);
      const stats = response.data || {};

      return {
        guestsRegistered: stats.totalRegisteredGuests || 0,
        totalEvents: stats.totalEvents || 0,
        checkedInGuests: stats.totalCheckedInGuests || 0,
        thisWeek: 0, // We can add weekly stats later if needed
        recentActivity: "Worker dashboard activity",
      };
    } catch (error) {
      console.error("Error fetching worker stats:", error);
      return {
        guestsRegistered: 0,
        totalEvents: 0,
        checkedInGuests: 0,
        thisWeek: 0,
        recentActivity: "Worker dashboard activity",
      };
    }
  },

  // Registrar Dashboard Stats
  getRegistrarDashboardStats: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.REGISTRARS.STATS);
      const data = response.data;
      
      // Backend returns { stats: {...}, recentActivity: [...] }
      const stats = data.stats || {};
      
      return {
        checkinsToday: stats.guestsCount || 0,
        totalCheckins: stats.guestsCount || 0,
        totalEventsVolunteered: stats.eventsCount || 0,
        eventsCount: stats.eventsCount || 0,
        assignedZones: stats.assignedZones || 0,
        guestsCount: stats.guestsCount || 0,
        recentActivity: data.recentActivity || [],
        isApproved: stats.isApproved || false,
        dateJoined: stats.dateJoined || null,
        ...stats
      };
    } catch (error) {
      console.error("Error fetching registrar stats:", error);
      return {
        checkinsToday: 0,
        totalCheckins: 0,
        totalEventsVolunteered: 0,
        eventsCount: 0,
        assignedZones: 0,
        guestsCount: 0,
        recentActivity: [],
        isApproved: false,
        dateJoined: null,
      };
    }
  },  // Get role-specific dashboard data
  getDashboardStatsByRole: async (userRole) => {
    console.log(`[DashboardService] getDashboardStatsByRole called with role: ${userRole}`);
    
    switch (userRole) {
      case "super_admin":
      case "super_me":
        console.log(`[DashboardService] Calling enhanced super admin stats for role: ${userRole}`);
        // Use static import
        return systemMetricsService.getEnhancedSuperAdminStats();
      case "state_admin":
        console.log(`[DashboardService] Calling state admin stats`);
        return dashboardService.getStateAdminDashboardStats();
      case "branch_admin":
      case "branch_me":
        console.log(`[DashboardService] Calling branch admin stats for role: ${userRole}`);
        return dashboardService.getBranchAdminDashboardStats();
      case "worker":
        console.log(`[DashboardService] Calling worker stats`);
        return dashboardService.getWorkerDashboardStats();
      case "registrar":
        console.log(`[DashboardService] Calling registrar stats`);
        return dashboardService.getRegistrarDashboardStats();
      default:
        console.log(`[DashboardService] Unknown role: ${userRole}, returning empty stats`);
        // Return basic stats for unknown roles instead of calling admin endpoints
        return {
          message: `Dashboard data not available for role: ${userRole}`,
          stats: {}
        };
    }
  },
};

export default dashboardService;
