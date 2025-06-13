// Import specialized services
import dashboardService from "./dashboardService";
import adminManagementService from "./adminManagement";
import analyticsDataService from "./analyticsDataService";
import systemMetricsService from "./systemMetricsService";

/**
 * Main analytics service that acts as a facade for all analytics functionality
 * This service combines multiple specialized services for better organization
 */
export const analyticsService = {
  // Re-export dashboard services
  getUserProfile: dashboardService.getUserProfile,
  getDashboardAnalytics: dashboardService.getDashboardAnalytics,
  getSuperAdminDashboardStats: dashboardService.getSuperAdminDashboardStats,
  getStateAdminDashboardStats: dashboardService.getStateAdminDashboardStats,
  getBranchAdminDashboardStats: dashboardService.getBranchAdminDashboardStats,
  getWorkerDashboardStats: dashboardService.getWorkerDashboardStats,
  getRegistrarDashboardStats: dashboardService.getRegistrarDashboardStats,
  getDashboardStatsByRole: dashboardService.getDashboardStatsByRole,

  // Re-export admin management services
  getPendingAdmins: adminManagementService.getPendingAdmins,
  getApprovedAdmins: adminManagementService.getApprovedAdmins,
  approveAdmin: adminManagementService.approveAdmin,
  rejectAdmin: adminManagementService.rejectAdmin,
  getAdminApprovalHistory: adminManagementService.getAdminApprovalHistory,
  getPendingBranchAdmins: adminManagementService.getPendingBranchAdmins,
  getApprovedBranchAdmins: adminManagementService.getApprovedBranchAdmins,
  approveBranchAdmin: adminManagementService.approveBranchAdmin,
  rejectBranchAdmin: adminManagementService.rejectBranchAdmin,
  getPendingZonalAdmins: adminManagementService.getPendingZonalAdmins,
  getApprovedZonalAdmins: adminManagementService.getApprovedZonalAdmins,
  approveZonalAdmin: adminManagementService.approveZonalAdmin,
  rejectZonalAdmin: adminManagementService.rejectZonalAdmin,

  // Re-export analytics data services
  getRegistrationTrends: analyticsDataService.getRegistrationTrends,
  getWorkerPerformance: analyticsDataService.getWorkerPerformance,
  getEventSummary: analyticsDataService.getEventSummary,
  exportAnalytics: analyticsDataService.exportAnalytics,
  processChartData: analyticsDataService.processChartData,

  // Re-export system metrics services
  getSystemMetrics: systemMetricsService.getSystemMetrics,
  getAdminHierarchyStats: systemMetricsService.getAdminHierarchyStats,
  getUserRoleBreakdown: systemMetricsService.getUserRoleBreakdown,
  getEnhancedSuperAdminStats: systemMetricsService.getEnhancedSuperAdminStats,
};

export default analyticsService;
