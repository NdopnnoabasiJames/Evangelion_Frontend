import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StateAdminOverview from './StateAdminOverview';
import BranchAdminManagement from './BranchAdminManagement';
import StateAdminEvents from './StateAdminEvents';
import BranchesManagement from '../admin/BranchesManagement';
import analyticsService from '../../services/analyticsService';

const StateAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingBranchAdmins, setPendingBranchAdmins] = useState([]);
  const [approvedBranchAdmins, setApprovedBranchAdmins] = useState([]);
  const [stateStatistics, setStateStatistics] = useState({
    totalBranches: 0,
    totalZones: 0,
    activeEvents: 0,
    totalGuests: 0
  });
  // Load data when component mounts or tab changes
  useEffect(() => {
    loadPendingBranchAdmins();
    if (activeTab === 'overview') {
      loadStateStatistics();
      loadApprovedBranchAdmins();
    }
  }, [activeTab]);
  
  // Initial load when component mounts
  useEffect(() => {
    loadPendingBranchAdmins();
    loadStateStatistics();
    loadApprovedBranchAdmins();
  }, []);

  const loadStateStatistics = async () => {
    try {
      const stats = await analyticsService.getStateAdminDashboardStats();
      setStateStatistics(stats || {
        totalBranches: 0,
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0
      });
    } catch (err) {
      console.error('Error loading state statistics:', err);
    }
  };

  const loadPendingBranchAdmins = async () => {
    try {
      const data = await analyticsService.getPendingBranchAdmins();
      setPendingBranchAdmins(data || []);
    } catch (err) {
      console.error('Error loading pending branch admins count:', err);
    }
  };
  const loadApprovedBranchAdmins = async () => {
    try {
      const data = await analyticsService.getApprovedBranchAdmins();
      setApprovedBranchAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved branch admins:', err);
    }
  };

  const handleApproveBranchAdmin = async (adminId, adminData) => {
    try {
      await analyticsService.approveBranchAdmin(adminId, adminData);
      // Refresh both lists after approval
      loadPendingBranchAdmins();
      loadApprovedBranchAdmins();
    } catch (err) {
      console.error('Error approving branch admin:', err);
    }
  };

  const handleRejectBranchAdmin = async (adminId, reason) => {
    try {
      await analyticsService.rejectBranchAdmin(adminId, reason);
      // Refresh pending list after rejection
      loadPendingBranchAdmins();
    } catch (err) {
      console.error('Error rejecting branch admin:', err);
    }
  };
  return (
    <div>
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
            type="button"
          >
            <i className="bi bi-building me-2"></i>
            Branches
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branch-admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('branch-admin-management')}
            type="button"          >
            <i className="bi bi-shield-check me-2"></i>
            Branch Admin Management
            {pendingBranchAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingBranchAdmins.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            type="button"
          >            <i className="bi bi-calendar-event me-2"></i>
            Events
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <StateAdminOverview 
            stateStatistics={stateStatistics}
            dashboardData={dashboardData}
            approvedBranchAdmins={approvedBranchAdmins}
            pendingBranchAdmins={pendingBranchAdmins}
            onManageBranchAdmins={() => setActiveTab('branch-admin-management')}
          />
        )}        {activeTab === 'branches' && <BranchesManagement />}
        {activeTab === 'branch-admin-management' && (
          <BranchAdminManagement 
            pendingBranchAdmins={pendingBranchAdmins}
            approvedBranchAdmins={approvedBranchAdmins}
            loading={false}
            approvedLoading={false}
            error={null}
            approvedError={null}
            onApproveBranchAdmin={handleApproveBranchAdmin}
            onRejectBranchAdmin={handleRejectBranchAdmin}
            onRefreshPending={loadPendingBranchAdmins}
            onRefreshApproved={loadApprovedBranchAdmins}
          />
        )}
        {activeTab === 'events' && <StateAdminEvents />}
      </div>
    </div>
  );
};

export default StateAdminTabs;
