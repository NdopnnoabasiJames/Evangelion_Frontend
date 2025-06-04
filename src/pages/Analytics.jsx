import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { LoadingCard, ErrorDisplay } from '../components/common/Loading';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { StatisticsGrid, StatisticsCardTypes } from '../components/common/StatisticsCard';
import { API_ENDPOINTS, ROLES } from '../utils/constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  // Fetch analytics data
  const { data: analytics, loading: analyticsLoading, error: analyticsError } = useApi(
    '/api/analytics/dashboard', 
    { immediate: true }
  );

  useEffect(() => {
    if (analytics) {
      setAnalyticsData(analytics);
    }
    setLoading(analyticsLoading);
    setError(analyticsError);
  }, [analytics, analyticsLoading, analyticsError]);

  const refreshAnalytics = () => {
    window.location.reload();
  };

  const exportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics report...');
  };

  // Role-based access control
  const canViewAnalytics = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.role);

  if (!canViewAnalytics) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <i className="bi bi-shield-exclamation" style={{ fontSize: '4rem', color: 'var(--primary-purple)', opacity: 0.5 }}></i>
            <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>Access Denied</h4>
            <p className="text-muted">You don't have permission to view analytics.</p>
          </div>
        </div>
      </Layout>
    );  }

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <PageHeader 
            {...HeaderConfigurations.analytics(refreshAnalytics, exportReport)}
          />
          <div className="row g-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="col-lg-6 col-12">
                <LoadingCard height="300px" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <ErrorDisplay 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="container-fluid py-4">
        <PageHeader 
          {...HeaderConfigurations.analytics(refreshAnalytics, exportReport)}
        />        {/* Key Metrics Summary */}
        <StatisticsGrid
          cards={[
            StatisticsCardTypes.totalEvents(analyticsData?.summary?.totalEvents || 0),
            {
              title: 'Total Guests',
              value: analyticsData?.summary?.totalGuests || 0,
              icon: 'bi-people',
              color: 'var(--accent-yellow)',
              textColor: 'dark'
            },
            {
              title: 'Active Workers', 
              value: analyticsData?.summary?.totalWorkers || 0,
              icon: 'bi-person-workspace',
              color: '#28a745'
            },
            {
              title: 'Total Check-ins',
              value: analyticsData?.summary?.totalCheckIns || 0,
              icon: 'bi-clipboard-check', 
              color: '#17a2b8'
            }
          ]}
          columns={4}
        />

        {/* Charts Section */}
        <div className="row g-4 mt-4">
          {/* Event Participation Trends */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
                  Event Participation Trends
                </h5>
              </div>
              <div className="card-body">
                <EventParticipationChart data={analyticsData?.eventTrends} />
              </div>
            </div>
          </div>

          {/* Guest Registration Statistics */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
                  Guest Registration
                </h5>
              </div>
              <div className="card-body">
                <GuestRegistrationChart data={analyticsData?.guestStats} />
              </div>
            </div>
          </div>

          {/* Worker Performance */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
                  Worker Performance
                </h5>
              </div>
              <div className="card-body">
                <WorkerPerformanceChart data={analyticsData?.workerPerformance} />
              </div>
            </div>
          </div>

          {/* Check-in Analytics */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
                  Check-in Analytics
                </h5>
              </div>
              <div className="card-body">
                <CheckInAnalyticsChart data={analyticsData?.checkInAnalytics} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Event Participation Trends Chart
const EventParticipationChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Event Participation',
        data: data?.values || [65, 78, 45, 89, 67, 95],
        borderColor: 'rgb(86, 43, 121)',
        backgroundColor: 'rgba(86, 43, 121, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Guest Registration Statistics Chart
const GuestRegistrationChart = ({ data }) => {
  const chartData = {
    labels: ['Registered', 'Checked In', 'No Show'],
    datasets: [
      {
        data: data?.values || [70, 25, 5],
        backgroundColor: [
          'rgb(86, 43, 121)',
          'rgb(255, 205, 6)',
          'rgb(220, 53, 69)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

// Worker Performance Chart
const WorkerPerformanceChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Worker A', 'Worker B', 'Worker C', 'Worker D', 'Worker E'],
    datasets: [
      {
        label: 'Guests Registered',
        data: data?.values || [120, 89, 76, 65, 45],
        backgroundColor: 'rgba(86, 43, 121, 0.8)',
        borderColor: 'rgb(86, 43, 121)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// Check-in Analytics Chart
const CheckInAnalyticsChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Check-ins',
        data: data?.values || [45, 52, 38, 67, 89, 95, 78],
        backgroundColor: 'rgba(255, 205, 6, 0.8)',
        borderColor: 'rgb(255, 205, 6)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default Analytics;
