import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';
import dashboardStatsService from '../../services/dashboardStatsService';

const ZonalAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoneStats, setZoneStats] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadZoneStatistics();
    }
  }, [activeTab]);  const loadZoneStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('ZonalAdminTabs: Loading real zone statistics...');
      console.log('ZonalAdminTabs: Current user object:', user);
      console.log('ZonalAdminTabs: User zone:', user?.zone);
      console.log('ZonalAdminTabs: User branch:', user?.branch);
      console.log('ZonalAdminTabs: User state:', user?.state);
      
        // Call the real dashboard stats service for zonal admin
      const dashboardStats = await dashboardStatsService.getDashboardStatsByRole('zonal_admin');
      
      console.log('ZonalAdminTabs: Received dashboard stats:', dashboardStats);
      
      const zoneData = {
        totalRegistrars: dashboardStats.totalRegistrars || 0,
        activeEvents: dashboardStats.activeEvents || 0,
        totalGuests: dashboardStats.totalGuests || 0,
        recentCheckIns: dashboardStats.recentCheckIns || 0,
        zoneName: user?.zone?.name || 'Your Zone',
        branchName: user?.branch?.name || 'Your Branch',
        stateName: user?.state?.name || 'Your State'
      };
      
      console.log('ZonalAdminTabs: Processed zone data:', zoneData);
      setZoneStats(zoneData);
    } catch (err) {
      console.error('Error loading zone statistics:', err);
      setError(err.message || 'Failed to load zone statistics');
      
      // Fallback to empty stats on error
      setZoneStats({
        totalRegistrars: 0,
        activeEvents: 0,
        totalGuests: 0,
        recentCheckIns: 0,
        zoneName: user?.zone?.name || 'Your Zone',
        branchName: user?.branch?.name || 'Your Branch',
        stateName: user?.state?.name || 'Your State'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="row g-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <LoadingCard height="120px" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay 
          message={error}
          onRetry={loadZoneStatistics}
        />
      );
    }

    return (
      <div>
        {/* Zone Information Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-primary bg-gradient text-white">
              <div className="card-body">
                <h5 className="card-title mb-1">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Zone Administration
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <small className="opacity-75">Zone:</small>
                    <div className="fw-bold">{zoneStats?.zoneName}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="opacity-75">Branch:</small>
                    <div className="fw-bold">{zoneStats?.branchName}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="opacity-75">State:</small>
                    <div className="fw-bold">{zoneStats?.stateName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded">
                      <i className="fas fa-users fa-lg"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Total Registrars</h6>
                    <h3 className="mb-0">{zoneStats?.totalRegistrars || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-success bg-opacity-10 text-success p-3 rounded">
                      <i className="fas fa-calendar-alt fa-lg"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Active Events</h6>
                    <h3 className="mb-0">{zoneStats?.activeEvents || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-info bg-opacity-10 text-info p-3 rounded">
                      <i className="fas fa-user-friends fa-lg"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Total Guests</h6>
                    <h3 className="mb-0">{zoneStats?.totalGuests || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-warning bg-opacity-10 text-warning p-3 rounded">
                      <i className="fas fa-check-circle fa-lg"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Recent Check-ins</h6>
                    <h3 className="mb-0">{zoneStats?.recentCheckIns || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-bolt me-2"></i>
                  Quick Actions
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <button className="btn btn-outline-primary w-100">
                      <i className="fas fa-bus me-2"></i>
                      Manage Pickup Stations
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-success w-100">
                      <i className="fas fa-users me-2"></i>
                      View Registrars
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-info w-100">
                      <i className="fas fa-calendar me-2"></i>
                      Manage Events
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-warning w-100">
                      <i className="fas fa-chart-bar me-2"></i>
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="fas fa-calendar fa-3x text-muted mb-3"></i>
          <h4>Events Management</h4>
          <p className="text-muted">Zone-level event management will be available here.</p>
          <button className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Create Zone Event
          </button>
        </div>
      </div>
    );
  };

  const renderPickupStations = () => {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="fas fa-bus fa-3x text-muted mb-3"></i>
          <h4>Pickup Stations</h4>
          <p className="text-muted">Manage bus pickup locations and schedules for your zone.</p>
          <button className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Add Pickup Station
          </button>
        </div>
      </div>
    );
  };

  const renderRegistrars = () => {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="fas fa-users fa-3x text-muted mb-3"></i>
          <h4>Registrars</h4>
          <p className="text-muted">View and manage registrars assigned to your zone.</p>
          <button className="btn btn-primary">
            <i className="fas fa-eye me-2"></i>
            View Registrars
          </button>
        </div>
      </div>
    );
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
            role="tab"
          >
            <i className="fas fa-chart-line me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            type="button"
            role="tab"
          >
            <i className="fas fa-calendar me-2"></i>
            Events
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickup-stations')}
            type="button"
            role="tab"
          >
            <i className="fas fa-bus me-2"></i>
            Pickup Stations
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'registrars' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrars')}
            type="button"
            role="tab"
          >
            <i className="fas fa-users me-2"></i>
            Registrars
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'pickup-stations' && renderPickupStations()}
        {activeTab === 'registrars' && renderRegistrars()}
      </div>
    </div>
  );
};

export default ZonalAdminTabs;
