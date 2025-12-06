import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StateAdminOverview from './StateAdminOverview';
import BranchAdminManagement from './BranchAdminManagement';
import StateAdminEvents from './StateAdminEvents';
import BranchesManagement from '../admin/BranchesManagement';
import ZonesManagement from '../admin/ZonesManagement';
import PickupStationsManagement from '../admin/PickupStationsManagement';
import StateAdminPickupStationsTab from './tabs/StateAdminPickupStationsTab';
import WorkersManagement from '../admin/WorkersManagement';
import GuestsManagement from '../admin/GuestsManagement';
import analyticsService from '../../services/analyticsService';
import { toast } from 'react-toastify';

const StateAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      // Show success message
      toast.success(`${adminData.name} has been approved successfully!`);
      // Refresh both lists after approval
      loadPendingBranchAdmins();
      loadApprovedBranchAdmins();
    } catch (err) {
      console.error('Error approving branch admin:', err);
      toast.error('Failed to approve admin. Please try again.');
    }
  };

  const handleRejectBranchAdmin = async (adminId, reason) => {
    try {
      await analyticsService.rejectBranchAdmin(adminId, reason);
      // Show success message
      toast.success('Admin has been rejected successfully!');
      // Refresh pending list after rejection
      loadPendingBranchAdmins();
    } catch (err) {
      console.error('Error rejecting branch admin:', err);
      toast.error('Failed to reject admin. Please try again.');
    }
  };

  // Handle tab change and close mobile menu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div>
      {/* Back Button (only show when not on overview tab) */}
      {activeTab !== 'overview' && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleTabChange('overview')}
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Overview
          </button>
        </div>
      )}
      
      {/* Mobile Navigation */}
      <div className="d-md-none mb-3">
        <div className="position-relative mb-3">
          <h5 className="mb-0 text-center">
            {activeTab === 'overview' && <><i className="bi bi-graph-up me-2"></i>Overview</>}
            {activeTab === 'events' && <><i className="bi bi-calendar-event me-2"></i>Events</>}
            {activeTab === 'branch-admin-management' && <><i className="bi bi-shield-check me-2"></i>Branch Admins</>}
            {activeTab === 'branches' && <><i className="bi bi-building me-2"></i>Branches</>}
            {activeTab === 'zones' && <><i className="bi bi-geo-alt me-2"></i>Zones</>}
            {activeTab === 'workers' && <><i className="bi bi-people-fill me-2"></i>Workers</>}
            {activeTab === 'guests' && <><i className="bi bi-person-check me-2"></i>Guests</>}
            {activeTab === 'pickup-stations' && <><i className="bi bi-pin-map me-2"></i>Pickup Stations</>}
          </h5>
          <button 
            className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0"
            style={{ width: '32px', height: '32px', padding: '0', marginTop: '-8px' }}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'} small`}></i>
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu show d-md-none">
            <div className="list-group">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
                type="button"
              >
                <i className="bi bi-graph-up me-2"></i>
                Overview
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleTabChange('events')}
                type="button"
              >
                <i className="bi bi-calendar-event me-2"></i>
                Events
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'branch-admin-management' ? 'active' : ''}`}
                onClick={() => handleTabChange('branch-admin-management')}
                type="button"
              >
                <i className="bi bi-shield-check me-2"></i>
                Branch Admins
                {pendingBranchAdmins.length > 0 && (
                  <span className="badge bg-warning text-dark ms-2">
                    {pendingBranchAdmins.length}
                  </span>
                )}
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'branches' ? 'active' : ''}`}
                onClick={() => handleTabChange('branches')}
                type="button"
              >
                <i className="bi bi-building me-2"></i>
                Branches
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'zones' ? 'active' : ''}`}
                onClick={() => handleTabChange('zones')}
                type="button"
              >
                <i className="bi bi-geo-alt me-2"></i>
                Zones
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'workers' ? 'active' : ''}`}
                onClick={() => handleTabChange('workers')}
                type="button"
              >
                <i className="bi bi-people-fill me-2"></i>
                Workers
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'guests' ? 'active' : ''}`}
                onClick={() => handleTabChange('guests')}
                type="button"
              >
                <i className="bi bi-person-check me-2"></i>
                Guests
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'pickup-stations' ? 'active' : ''}`}
                onClick={() => handleTabChange('pickup-stations')}
                type="button"
              >
                <i className="bi bi-pin-map me-2"></i>
                Pickup Stations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Tab Navigation */}
      <ul className="nav nav-tabs mb-4 d-none d-md-flex" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
            type="button"
          >
            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
            type="button"
          >
            <i className="bi bi-calendar-event me-2"></i>
            Events
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branch-admin-management' ? 'active' : ''}`}
            onClick={() => handleTabChange('branch-admin-management')}
            type="button"
          >
            <i className="bi bi-shield-check me-2"></i>
            Branch Admins
            {pendingBranchAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingBranchAdmins.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => handleTabChange('branches')}
            type="button"
          >
            <i className="bi bi-building me-2"></i>
            Branches
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => handleTabChange('zones')}
            type="button"
          >
            <i className="bi bi-geo-alt me-2"></i>
            Zones
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => handleTabChange('workers')}
            type="button"
          >
            <i className="bi bi-people-fill me-2"></i>
            Workers
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => handleTabChange('guests')}
            type="button"
          >
            <i className="bi bi-person-check me-2"></i>
            Guests
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''}`}
            onClick={() => handleTabChange('pickup-stations')}
            type="button"
          >
            <i className="bi bi-pin-map me-2"></i>
            Pickup Stations
          </button>
        </li>
      </ul>{/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <StateAdminOverview 
            stateStatistics={stateStatistics}
            dashboardData={dashboardData}
            approvedBranchAdmins={approvedBranchAdmins}
            pendingBranchAdmins={pendingBranchAdmins}
            onManageBranchAdmins={() => setActiveTab('branch-admin-management')}
            onCreateEvent={() => setActiveTab('events')}
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
          />        )}        {activeTab === 'events' && <StateAdminEvents />}
        {activeTab === 'zones' && <ZonesManagement />}
        {activeTab === 'workers' && <WorkersManagement />}
        {activeTab === 'guests' && <GuestsManagement />}
        {activeTab === 'pickup-stations' && <StateAdminPickupStationsTab />}
      </div>
    </div>
  );
};

export default StateAdminTabs;
