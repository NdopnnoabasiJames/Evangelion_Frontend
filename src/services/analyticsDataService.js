import api from "./api";
import { API_ENDPOINTS } from "../utils/constants";

export const analyticsDataService = {
  // Get registration trends
  getRegistrationTrends: async (days = 30) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.TRENDS, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch registration trends"
      );
    }
  },

  // Get worker performance data
  getWorkerPerformance: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await api.get(
        API_ENDPOINTS.ANALYTICS.WORKER_PERFORMANCE,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch worker performance"
      );
    }
  },

  // Get event summary
  getEventSummary: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EVENT_SUMMARY);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch event summary"
      );
    }
  },

  // Export analytics data
  exportAnalytics: async (filters = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.ANALYTICS.EXPORT, {
        params: filters,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to export analytics data"
      );
    }
  },

  // Process data for Chart.js format
  processChartData: {
    // Process trends data for line chart
    trendsToLineChart: (trendsData) => {
      if (!trendsData || !Array.isArray(trendsData)) {
        return {
          labels: [],
          values: [],
        };
      }

      return {
        labels: trendsData.map((item) =>
          new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        ),
        values: trendsData.map((item) => item.registrations),
      };
    },

    // Process worker performance for bar chart
    workerPerformanceToBarChart: (workerData) => {
      if (!workerData || !Array.isArray(workerData)) {
        return {
          labels: [],
          values: [],
        };
      }

      return {
        labels: workerData
          .slice(0, 10)
          .map((worker) => worker.workerName || "Unknown"),
        values: workerData
          .slice(0, 10)
          .map((worker) => worker.totalRegistrations),
      };
    },

    // Process basic analytics for statistics cards
    basicAnalyticsToCards: (basicData) => {
      if (!basicData) {
        return {
          totalEvents: 0,
          totalGuests: 0,
          totalWorkers: 0,
          totalCheckIns: 0,
        };
      }

      return {
        totalEvents: basicData.totalEvents || 0,
        totalGuests: basicData.totalGuests || 0,
        totalWorkers: basicData.totalWorkers || 0,
        totalCheckIns: basicData.checkedInGuests || 0,
      };
    },

    // Process guest stats for doughnut chart
    guestStatsToDoughnut: (basicData) => {
      if (!basicData || !basicData.transportBreakdown) {
        return {
          values: [0, 0, 0],
          labels: ["Registered", "Checked In", "No Show"],
        };
      }

      const total = basicData.totalGuests || 0;
      const checkedIn = basicData.checkedInGuests || 0;
      const noShow = total - checkedIn;

      return {
        values: [total, checkedIn, noShow],
        labels: ["Registered", "Checked In", "No Show"],
      };
    },

    // Process check-in analytics for bar chart (weekly data)
    checkInAnalyticsToBar: (basicData, trendsData) => {
      if (!trendsData || !Array.isArray(trendsData)) {
        return {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [45, 52, 38, 67, 89, 95, 78],
        };
      }

      const last7Days = trendsData.slice(-7);
      return {
        labels: last7Days.map((item) =>
          new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          })
        ),
        values: last7Days.map((item) => item.registrations),
      };
    },
  },
};

export default analyticsDataService;
