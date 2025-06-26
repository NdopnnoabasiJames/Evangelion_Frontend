import analyticsService from '../../../services/analyticsService';

export const useAdminManagement = () => {
  const loadPendingAdmins = async (setPendingAdmins, setLoading, setError) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getPendingAdmins();
      setPendingAdmins(data || []);
    } catch (err) {
      console.error('Error loading pending admins:', err);
      setError(err.message || 'Failed to load pending admins');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedAdmins = async (setApprovedAdmins, setApprovedLoading, setApprovedError) => {
    setApprovedLoading(true);
    setApprovedError(null);
    try {
      const data = await analyticsService.getApprovedAdmins();
      setApprovedAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved admins:', err);
      setApprovedError(err.message || 'Failed to load approved admins');
    } finally {
      setApprovedLoading(false);
    }
  };

  const loadAdminHistory = async (setAdminHistory, setLoading, setError) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getAdminApprovalHistory();
      setAdminHistory(data || []);
    } catch (err) {
      console.error('Error loading admin history:', err);
      setError(err.message || 'Failed to load admin history');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async (adminId, loadPendingAdmins, loadApprovedAdmins, setError) => {
    try {
      setError(null);
      await analyticsService.approveAdmin(adminId);
      
      // Refresh both lists
      await Promise.all([
        loadPendingAdmins(),
        loadApprovedAdmins()
      ]);
    } catch (err) {
      console.error('Error approving admin:', err);
      setError(err.message || 'Failed to approve admin');
    }
  };

  const handleRejectAdmin = async (adminId, reason, loadPendingAdmins, setError) => {
    try {
      setError(null);
      await analyticsService.rejectAdmin(adminId, reason);
      
      // Refresh pending list
      await loadPendingAdmins();
    } catch (err) {
      console.error('Error rejecting admin:', err);
      setError(err.message || 'Failed to reject admin');
    }
  };

  return {
    loadPendingAdmins,
    loadApprovedAdmins,
    loadAdminHistory,
    handleApproveAdmin,
    handleRejectAdmin
  };
};
