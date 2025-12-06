import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const AttendanceReport = ({ eventId, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const { execute: fetchReport, loading: reportLoading } = useApi(null, { immediate: false });
  const { execute: fetchEvent, loading: eventLoading } = useApi(null, { immediate: false });

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      loadAttendanceReport();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const response = await fetchEvent(`${API_ENDPOINTS.EVENTS.BASE}/${eventId}`);
      const event = response?.data || response; // Extract the actual event data
      setEventDetails(event);
    } catch (error) {
      console.error('Failed to load event details:', error);
    }
  };

  const loadAttendanceReport = async () => {
    try {
      const endpoint = `${API_ENDPOINTS.EVENTS.BASE}/${eventId}/attendance-report`;
      const report = await fetchReport(endpoint);
      setReportData(report);
    } catch (error) {
      console.error('Failed to load attendance report:', error);
    }
  };

  if (eventLoading || reportLoading) {
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Loading attendance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-md">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-clipboard-data me-2"></i>
              Attendance Summary - {eventDetails?.name}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {reportData ? (
              <div>
                {/* Event Type Info */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <span className={`badge ${
                        eventDetails?.eventType === 'single-day' 
                          ? 'bg-success' 
                          : eventDetails?.eventType === 'multi-day-specific'
                          ? 'bg-warning text-dark'
                          : 'bg-info'
                      }`}>
                        {eventDetails?.eventType === 'single-day' 
                          ? 'Single Day Event'
                          : eventDetails?.eventType === 'multi-day-specific'
                          ? 'Multi-Day Specific Event'
                          : eventDetails?.eventType === 'multi-day'
                          ? 'Multi-Day Event'
                          : 'Single Day Event'
                        }
                      </span>
                      {eventDetails?.eventType === 'multi-day-specific' && reportData.data?.specificDates && (
                        <small className="text-muted ms-2">
                          {reportData.data.specificDates.length} specific dates
                        </small>
                      )}
                    </div>
                    {reportData.data?.overallStats?.averageAttendanceRate && (
                      <div className="text-end">
                        <small className="text-muted">Avg Attendance Rate</small>
                        <div className="fw-bold text-primary">
                          {reportData.data.overallStats.averageAttendanceRate}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Stats for Single Day or Overall Multi-Day Stats */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="card text-center border-primary h-100">
                      <div className="card-body">
                        <i className="bi bi-people-fill text-primary display-4 mb-3"></i>
                        <h2 className="text-primary mb-2">
                          {reportData.data?.totalRegistered || 0}
                        </h2>
                        <h6 className="text-muted mb-0">Total Registered</h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card text-center border-success h-100">
                      <div className="card-body">
                        <i className="bi bi-person-check-fill text-success display-4 mb-3"></i>
                        <h2 className="text-success mb-2">
                          {eventDetails?.eventType === 'single-day' 
                            ? (reportData.data?.totalCheckedIn || 0)
                            : (reportData.data?.overallStats?.totalDays || 'N/A')
                          }
                        </h2>
                        <h6 className="text-muted mb-0">
                          {eventDetails?.eventType === 'single-day' ? 'Checked In' : 'Total Days'}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Reports for Multi-Day Events */}
                {reportData.data?.dailyReports && (
                  <div className="mt-4">
                    <h6 className="mb-3">Daily Attendance Breakdown</h6>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm table-striped">
                        <thead className="table-dark sticky-top">
                          <tr>
                            <th>Date</th>
                            <th className="text-center">Registered</th>
                            <th className="text-center">Checked In</th>
                            <th className="text-center">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.data.dailyReports.map((dayReport, index) => (
                            <tr key={index}>
                              <td>
                                <div className="fw-medium">
                                  {new Date(dayReport.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td className="text-center">{dayReport.totalRegistered}</td>
                              <td className="text-center">
                                <span className="fw-bold text-success">
                                  {dayReport.totalCheckedIn}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={`badge ${
                                  parseFloat(dayReport.attendanceRate) >= 80 
                                    ? 'bg-success'
                                    : parseFloat(dayReport.attendanceRate) >= 60
                                    ? 'bg-warning text-dark'
                                    : 'bg-danger'
                                }`}>
                                  {dayReport.attendanceRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted p-4">
                <i className="bi bi-clipboard-x display-4 mb-3"></i>
                <h5>No Data Available</h5>
                <p className="mb-0">No attendance data found for this event.</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;