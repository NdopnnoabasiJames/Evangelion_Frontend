import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout/Layout";
import { LoadingCard, ErrorDisplay } from "../components/common/Loading";
import PageHeader, {
  HeaderConfigurations,
} from "../components/common/PageHeader";
import {
  StatisticsGrid,
  StatisticsCardTypes,
} from "../components/common/StatisticsCard";
import SuperAdminTabs from "../components/dashboard/SuperAdminTabs";
import StateAdminTabs from "../components/dashboard/StateAdminTabs";
import BranchAdminTabs from "../components/dashboard/BranchAdminTabs";
import ZonalAdminTabs from "../components/dashboard/ZonalAdminTabs";
import WorkerTabs from "../components/dashboard/WorkerTabs";
import RegistrarTabs from "../components/dashboard/RegistrarTabs";
import { ROLES } from "../utils/constants";
import analyticsService from "../services/analyticsService";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile with populated state/branch information
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const response = await analyticsService.getUserProfile();
        const profile = response?.data?.data || response?.data || response;
        setUserProfile(profile);
      } catch (err) {
        console.error("Dashboard: Error fetching user profile:", err);
        // Fallback to user from auth context
        setUserProfile(user);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Load dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch real data based on user role
        const realData = await analyticsService.getDashboardStatsByRole(
          user.role
        );

        // Add metadata
        const dashboardData = {
          ...realData,
          lastUpdated: new Date().toLocaleString(),
          notifications: Math.floor(Math.random() * 5) + 1, // Keep notifications random for now
        };

        setDashboardData(dashboardData);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard data");

        // Fallback to mock data on error
        const mockData = getDashboardMockData(user.role);
        setDashboardData(mockData);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);
  // Mock data generator
  const getDashboardMockData = (role) => {
    const baseData = {
      lastUpdated: new Date().toLocaleString(),
      notifications: Math.floor(Math.random() * 5) + 1,
    };
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return {
          ...baseData,
          totalStates: 12,
          totalEvents: 45,
          totalUsers: 1234,
          totalGuests: 5678,
          recentActivity: "New state added: Lagos",
        };
      case ROLES.STATE_ADMIN:
        return {
          ...baseData,
          branches: 8,
          activeEvents: 12,
          totalGuests: 892,
          recentActivity: 'Branch "Ikeja Zone" updated',
        };
      case ROLES.BRANCH_ADMIN:
        return {
          ...baseData,
          zones: 5,
          workers: 25,
          registrars: 8,
          recentActivity: "New worker assigned",
        };
      case ROLES.WORKER:
        return {
          ...baseData,
          guestsRegistered: 156,
          thisWeek: 23,
          recentActivity: "Guest registration completed",
        };
      case ROLES.REGISTRAR:
        return {
          ...baseData,
          checkinsToday: 42,
          totalCheckins: 312,
          recentActivity: "Check-in session active",
        };
      default:
        return baseData;
    }
  };
  const refreshDashboard = async () => {
    if (!user) return;

    try {
      setError(null);
      const realData = await analyticsService.getDashboardStatsByRole(
        user.role
      );
      const dashboardData = {
        ...realData,
        lastUpdated: new Date().toLocaleString(),
        notifications: Math.floor(Math.random() * 5) + 1,
      };
      setDashboardData(dashboardData);
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      // Fallback to mock data on error
      const mockData = getDashboardMockData(user.role);
      setDashboardData(mockData);
    }
  }; // Role-specific dashboard content
  const getDashboardContent = () => {
    if (!dashboardData) return null;

    switch (user?.role) {
      case ROLES.SUPER_ADMIN:
        return <SuperAdminTabs dashboardData={dashboardData} />;
      case ROLES.STATE_ADMIN:
        return <StateAdminTabs dashboardData={dashboardData} />;
      case ROLES.BRANCH_ADMIN:
        return <BranchAdminTabs dashboardData={dashboardData} />;

      case ROLES.ZONAL_ADMIN:
        return <ZonalAdminTabs dashboardData={dashboardData} />;
      case ROLES.WORKER:
        return <WorkerTabs dashboardData={dashboardData} />;

      case ROLES.REGISTRAR:
        return <RegistrarTabs dashboardData={dashboardData} />;

      default:
        return (
          <div className="text-center py-4 text-muted">No data available</div>
        );
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
              <p className="text-muted">Welcome back, {user?.name}</p>
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
              <p className="text-muted">Welcome back, {user?.name}</p>
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
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                  const mockData = getDashboardMockData(user?.role);
                  setDashboardData(mockData);
                } catch (err) {
                  setError("Failed to load dashboard data");
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
          {...HeaderConfigurations.dashboard(
            user?.role,
            user?.firstName || user?.name || user?.email,
            refreshDashboard,
            userProfile?.state,
            userProfile?.branch
          )}
        />

        {dashboardData?.lastUpdated && (
          <div className="mb-3">
            <small className="text-muted">
              Last updated: {dashboardData.lastUpdated}
            </small>
          </div>
        )}
        {getDashboardContent()}
      </div>
    </Layout>
  );
};

export default Dashboard;
