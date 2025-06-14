import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';
import dashboardStatsService from '../../services/dashboardStatsService';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { StatusBadge } from '../../utils/statusUtils';

const ZonalAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Debug log for tab changes
  useEffect(() => {
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoneStats, setZoneStats] = useState(null);

  // Fetch events accessible to this zonal admin
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  useEffect(() => {
    if (activeTab === 'overview') {
      loadZoneStatistics();
    }
  }, [activeTab]);  const loadZoneStatistics = async () => {
    setLoading(true);
    setError(null);
    try {      
      // Call the real dashboard stats service for zonal admin
      const dashboardStats = await dashboardStatsService.getDashboardStatsByRole('zonal_admin');
      const zoneData = {
        totalRegistrars: dashboardStats.totalRegistrars || 0,
        activeEvents: dashboardStats.activeEvents || 0,
        totalGuests: dashboardStats.totalGuests || 0,
        recentCheckIns: dashboardStats.recentCheckIns || 0,
        zoneName: user?.zone?.name || 'Your Zone',
        branchName: user?.branch?.name || 'Your Branch',
        stateName: user?.state?.name || 'Your State',
        // Add assignment info
        hasZoneAssignment: !!user?.zone,
        zoneId: user?.zone?._id,
        assignedZonesCount: user?.assignedZones?.length || 0
      };      
      setZoneStats(zoneData);
      
      if (zoneData.totalRegistrars === 0) {
        console.info('ZonalAdminTabs: No registrars assigned to zone:', zoneData.zoneName);
      }
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
        stateName: user?.state?.name || 'Your State',
        hasZoneAssignment: !!user?.zone,
        zoneId: user?.zone?._id,
        assignedZonesCount: user?.assignedZones?.length || 0
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
              <div className="card-body">                <h5 className="card-title mb-1">
                  <i className="bi bi-geo-alt-fill me-2"></i>
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
        </div>        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded">
                      <i className="bi bi-people-fill fs-3"></i>
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
                      <i className="bi bi-calendar-event-fill fs-3"></i>
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
                      <i className="bi bi-person-hearts fs-3"></i>
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
                      <i className="bi bi-check-circle-fill fs-3"></i>
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
  };  const renderEvents = () => {
    if (eventsLoading) {
      return (
        <div className="row g-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <LoadingCard loading className="h-100" minHeight="200px">
                <div className="card-body">
                  <div className="skeleton-item mb-3" style={{ width: '70%', height: '1.5rem' }}></div>
                  <div className="skeleton-item mb-2" style={{ width: '100%', height: '1rem' }}></div>
                  <div className="skeleton-item mb-2" style={{ width: '60%', height: '1rem' }}></div>
                </div>
              </LoadingCard>
            </div>
          ))}
        </div>
      );
    }

    if (eventsError) {
      return (
        <ErrorDisplay 
          error={eventsError} 
          onRetry={refetchEvents}
          title="Failed to load events"
        />
      );
    }

    const events = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);
    
    if (events.length === 0) {
      return (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-event text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Events Found</h4>
            <p className="text-muted">
              No events have been delegated to your zone yet.<br/>
              Events delegated by branch admins will appear here.
            </p>
            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Zone: {user?.zone?.name || 'Not assigned'}
              </small>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="row g-4">
        {events.map((event) => (
          <div key={event._id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 border border-primary border-opacity-10 card-hover-lift">
              <div className="card-header bg-gradient border-0 pb-0">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="card-title mb-1 text-truncate" style={{ color: 'var(--primary-purple)' }}>
                    {event.name}
                  </h5>
                  <StatusBadge status={event.status} type="event" className="flex-shrink-0 ms-2" />
                </div>
                {event.creatorLevel && (
                  <small className="text-muted">
                    <i className="bi bi-person-badge me-1"></i>
                    {event.creatorLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Event
                  </small>
                )}
              </div>
              
              <div className="card-body">
                <div className="mb-3">                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-calendar-date text-primary me-2"></i>
                    <span className="fw-medium">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-clock text-primary me-2"></i>
                    <span>
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>                  <div className="d-flex align-items-center">
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    <span className="text-truncate">
                      {event.location || 
                       (event.availableBranches?.length > 0 
                         ? event.availableBranches.map(branch => branch?.location || branch?.name || branch).filter(Boolean).join(', ')
                         : event.availableZones?.length > 0
                           ? event.availableZones.map(zone => zone?.name || zone).filter(Boolean).join(', ')
                           : 'Location TBD'
                       )}
                    </span>
                  </div>
                </div>

                {event.description && (
                  <p className="card-text text-muted small mb-3" 
                     style={{ 
                       display: '-webkit-box',
                       WebkitLineClamp: 2,
                       WebkitBoxOrient: 'vertical',
                       overflow: 'hidden'
                     }}>
                    {event.description}
                  </p>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-eye me-1"></i>
                      View Details
                    </button>
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-geo-alt me-1"></i>
                      Assign Pickup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mt-3">
            <p className="text-muted mb-0">
              Showing {events.length} event{events.length !== 1 ? 's' : ''} for {user?.zone?.name || 'your zone'}
            </p>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={refetchEvents}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
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
