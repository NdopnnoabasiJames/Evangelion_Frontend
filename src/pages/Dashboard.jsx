import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout/Layout';
import { LoadingCard, ErrorDisplay } from '../components/common/Loading';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { StatisticsGrid, StatisticsCardTypes } from '../components/common/StatisticsCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Simulate loading dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock dashboard data based on user role
        const mockData = getDashboardMockData(user?.role);
        setDashboardData(mockData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);
  // Mock data generator
  const getDashboardMockData = (role) => {
    const baseData = {
      lastUpdated: new Date().toLocaleString(),
      notifications: Math.floor(Math.random() * 5) + 1
    };

    switch (role) {
      case 'SUPER_ADMIN':
        return {
          ...baseData,
          totalStates: 12,
          totalEvents: 45,
          totalUsers: 1234,
          totalGuests: 5678,
          recentActivity: 'New state added: Lagos'
        };
      case 'STATE_ADMIN':
        return {
          ...baseData,
          branches: 8,
          activeEvents: 12,
          totalGuests: 892,
          recentActivity: 'Branch "Ikeja Zone" updated'
        };
      case 'BRANCH_ADMIN':
        return {
          ...baseData,
          zones: 5,
          workers: 25,
          registrars: 8,
          recentActivity: 'New worker assigned'
        };
      case 'WORKER':
        return {
          ...baseData,
          guestsRegistered: 156,
          thisWeek: 23,
          recentActivity: 'Guest registration completed'
        };
      case 'REGISTRAR':
        return {
          ...baseData,
          checkinsToday: 42,
          totalCheckins: 312,
          recentActivity: 'Check-in session active'
        };
      default:
        return baseData;
    }
  };

  const refreshDashboard = () => {
    if (user) {
      const mockData = getDashboardMockData(user.role);
      setDashboardData(mockData);
    }
  };
  // Role-specific dashboard content
  const getDashboardContent = () => {
    if (!dashboardData) return null;

    switch (user?.role) {
      case 'SUPER_ADMIN':
        return (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.totalStates(dashboardData.totalStates),
              StatisticsCardTypes.totalEvents(dashboardData.totalEvents),
              StatisticsCardTypes.totalUsers(dashboardData.totalUsers),
              StatisticsCardTypes.totalGuests(dashboardData.totalGuests)
            ]}
            columns={4}
          />
        );
      
      case 'STATE_ADMIN':
        return (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.branches(dashboardData.branches),
              StatisticsCardTypes.activeEvents(dashboardData.activeEvents),
              StatisticsCardTypes.totalGuests(dashboardData.totalGuests)
            ]}
            columns={3}
          />
        );
      
      case 'BRANCH_ADMIN':
        return (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.zones(dashboardData.zones),
              StatisticsCardTypes.totalWorkers(dashboardData.workers),
              StatisticsCardTypes.totalRegistrars(dashboardData.registrars)
            ]}
            columns={3}
          />
        );
      
      case 'WORKER':
        return (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.guestsRegistered(dashboardData.guestsRegistered),
              StatisticsCardTypes.thisWeekRegistrations(dashboardData.thisWeek)
            ]}
            columns={2}
          />
        );
      
      case 'REGISTRAR':
        return (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.checkinsToday(dashboardData.checkinsToday),
              StatisticsCardTypes.totalCheckins(dashboardData.totalCheckins)
            ]}
            columns={2}
          />
        );
      
      default:
        return <div className="text-center py-4 text-muted">No data available</div>;
    }
  };
  // Handle loading state
  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-primary">Dashboard</h2>
              <p className="text-muted">Welcome back, {user?.firstName || user?.email}</p>
            </div>
          </div>
          <div className="row g-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-sm-6 col-12">
                <LoadingCard height="120px" />
              </div>
            ))}
          </div>
          <div className="row mt-4">
            <div className="col-12">
              <LoadingCard height="150px" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-primary">Dashboard</h2>
              <p className="text-muted">Welcome back, {user?.firstName || user?.email}</p>
            </div>
          </div>
          <ErrorDisplay 
            message={error}
            onRetry={() => {
              setError(null);
              setLoading(true);
              // Trigger data reload
              const loadDashboardData = async () => {
                try {
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  const mockData = getDashboardMockData(user?.role);
                  setDashboardData(mockData);
                } catch (err) {
                  setError('Failed to load dashboard data');
                } finally {
                  setLoading(false);
                }
              };
              loadDashboardData();
            }}
          />
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="container-fluid">
        <PageHeader
          {...HeaderConfigurations.dashboard(user?.role, user?.firstName || user?.email, refreshDashboard)}
        />
        
        {dashboardData?.lastUpdated && (
          <div className="mb-3">
            <small className="text-muted">
              Last updated: {dashboardData.lastUpdated}
            </small>
          </div>
        )}
        
        {getDashboardContent()}
        
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Quick Actions</h5>
                {dashboardData?.notifications > 0 && (
                  <span className="badge bg-danger">{dashboardData.notifications}</span>
                )}
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2">
                  {user?.role === 'WORKER' && (
                    <button className="btn btn-primary">Register New Guest</button>
                  )}
                  {user?.role === 'REGISTRAR' && (
                    <button className="btn btn-success">Check-in Guest</button>
                  )}
                  {['BRANCH_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                    <>
                      <button className="btn btn-primary">Create Event</button>
                      <button className="btn btn-outline-primary">View Reports</button>
                    </>
                  )}
                </div>
                {dashboardData?.recentActivity && (
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted">
                      <strong>Recent Activity:</strong> {dashboardData.recentActivity}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
