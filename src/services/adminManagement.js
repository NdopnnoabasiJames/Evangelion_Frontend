import api from "./api";

export const adminManagementService = {
  // Super Admin - Admin Management
  getPendingAdmins: async () => {
    try {
      const response = await api.get("/api/users/pending-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching pending admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch pending admin registrations"
      );
    }
  },

  getApprovedAdmins: async () => {
    try {
      const response = await api.get("/api/users/approved-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching approved admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch approved admin registrations"
      );
    }
  },

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
      console.error("Error approving admin:", error);
      throw new Error(
        error.response?.data?.message || "Failed to approve admin registration"
      );
    }
  },

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
      console.error("Error rejecting admin:", error);
      throw new Error(
        error.response?.data?.message || "Failed to reject admin registration"
      );
    }
  },

  getAdminApprovalHistory: async () => {
    try {
      const response = await api.get("/api/users/admin-approval-history");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching admin approval history:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch admin approval history"
      );
    }
  },  // State Admin - Branch Admin Management
  getPendingBranchAdmins: async () => {
    try {
      const response = await api.get("/api/users/pending-branch-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching pending branch admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch pending branch admin registrations"
      );
    }
  },
  getApprovedBranchAdmins: async () => {
    try {
      const response = await api.get("/api/users/approved-branch-admins");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching approved branch admins:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch approved branch admin registrations"
      );
    }
  },
  approveBranchAdmin: async (adminId, adminData) => {
    try {
      if (!adminId || adminId === "undefined") {
        throw new Error("Branch Admin ID is undefined or invalid");
      }      const response = await api.post(
        `/api/users/approve-branch-admin/${adminId}`,
        adminData
      );
      return response.data;
    } catch (error) {
      console.error("Error approving branch admin:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to approve branch admin registration"
      );
    }
  },
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
      console.error("Error rejecting branch admin:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to reject branch admin registration"
      );
    }
  },

  // Branch Admin - Zone Admin Management
  getPendingZonalAdmins: async () => {
    try {
      const response = await api.get('/api/admin-hierarchy/branch/pending-zone-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching pending zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending zonal admin registrations');
    }
  },

  getApprovedZonalAdmins: async () => {
    try {
      const response = await api.get('/api/admin-hierarchy/branch/approved-zone-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching approved zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch approved zonal admin registrations');
    }
  },

  approveZonalAdmin: async (adminId, adminData) => {
    try {      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/admin-hierarchy/branch/approve-zone-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('Error approving zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve zonal admin registration');
    }
  },

  rejectZonalAdmin: async (adminId, reason) => {
    try {
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/admin-hierarchy/branch/reject-zone-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject zonal admin registration');
    }
  },

  // Branch/Zone Approval Workflow (Super Admin)
  getBranchesByStatus: async (status) => {
    const response = await api.get(`/api/branches/status/${status}`);
    return response.data;
  },
  approveBranch: async (branchId) => {
    const response = await api.patch(`/api/branches/${branchId}/approve`);
    return response.data;
  },
  rejectBranch: async (branchId) => {
    const response = await api.patch(`/api/branches/${branchId}/reject`);
    return response.data;
  },
  getZonesByStatus: async (status) => {
    const response = await api.get(`/api/zones/status/${status}`);
    return response.data;
  },
  approveZone: async (zoneId) => {
    const response = await api.patch(`/api/zones/${zoneId}/approve`);
    return response.data;
  },
  rejectZone: async (zoneId) => {
    const response = await api.patch(`/api/zones/${zoneId}/reject`);
    return response.data;
  },
};

export default adminManagementService;
