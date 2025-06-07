import api from './api';

/**
 * Service for managing admin registrations, approvals, and hierarchy
 */
export const adminManagementService = {
  // Super Admin functions
  getPendingAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching pending admin registrations...');
      const response = await api.get('/api/users/pending-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching pending admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending admin registrations');
    }
  },

  getApprovedAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching approved admin registrations...');
      const response = await api.get('/api/users/approved-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching approved admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch approved admin registrations');
    }
  },

  approveAdmin: async (adminId, adminData) => {
    try {
      console.log('AdminManagement: Approving admin - ID:', adminId, 'Type:', typeof adminId, 'Data:', adminData);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/approve-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error approving admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve admin registration');
    }
  },

  rejectAdmin: async (adminId, reason) => {
    try {
      console.log('AdminManagement: Rejecting admin - ID:', adminId, 'Type:', typeof adminId, 'Reason:', reason);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/reject-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error rejecting admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject admin registration');
    }
  },

  getAdminApprovalHistory: async () => {
    try {
      console.log('AdminManagement: Fetching admin approval history...');
      const response = await api.get('/api/users/admin-approval-history');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching admin approval history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin approval history');
    }
  },

  // State Admin functions for Branch Admin management
  getPendingBranchAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching pending branch admin registrations...');
      const response = await api.get('/api/users/pending-branch-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching pending branch admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending branch admin registrations');
    }
  },

  getApprovedBranchAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching approved branch admin registrations...');
      const response = await api.get('/api/users/approved-branch-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching approved branch admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch approved branch admin registrations');
    }
  },

  approveBranchAdmin: async (adminId, adminData) => {
    try {
      console.log('AdminManagement: Approving branch admin - ID:', adminId, 'Type:', typeof adminId, 'Data:', adminData);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Branch Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/approve-branch-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error approving branch admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve branch admin registration');
    }
  },

  rejectBranchAdmin: async (adminId, reason) => {
    try {
      console.log('AdminManagement: Rejecting branch admin - ID:', adminId, 'Type:', typeof adminId, 'Reason:', reason);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Branch Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/reject-branch-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error rejecting branch admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject branch admin registration');
    }
  },

  // Branch Admin functions for Zonal Admin management
  getPendingZonalAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching pending zonal admin registrations...');
      const response = await api.get('/api/users/pending-zonal-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching pending zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending zonal admin registrations');
    }
  },

  getApprovedZonalAdmins: async () => {
    try {
      console.log('AdminManagement: Fetching approved zonal admin registrations...');
      const response = await api.get('/api/users/approved-zonal-admins');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('AdminManagement: Error fetching approved zonal admins:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch approved zonal admin registrations');
    }
  },

  approveZonalAdmin: async (adminId, adminData) => {
    try {
      console.log('AdminManagement: Approving zonal admin - ID:', adminId, 'Type:', typeof adminId, 'Data:', adminData);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/approve-zonal-admin/${adminId}`, adminData);
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error approving zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve zonal admin registration');
    }
  },

  rejectZonalAdmin: async (adminId, reason) => {
    try {
      console.log('AdminManagement: Rejecting zonal admin - ID:', adminId, 'Type:', typeof adminId, 'Reason:', reason);
      
      if (!adminId || adminId === 'undefined') {
        throw new Error('Zonal Admin ID is undefined or invalid');
      }
      
      const response = await api.post(`/api/users/reject-zonal-admin/${adminId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('AdminManagement: Error rejecting zonal admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject zonal admin registration');
    }
  }
};

export default adminManagementService;
