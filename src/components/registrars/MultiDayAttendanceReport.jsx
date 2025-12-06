import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const MultiDayAttendanceReport = ({ event, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  useEffect(() => {
    if (event) {
      loadAttendanceReport();
    }
  }, [event]);

  const loadAttendanceReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/registrars/events/${event._id}/multiday-attendance-report`);
      
      // Handle nested data structure like we did in MultiDayCheckInManager
      const reportInfo = response.data.data || response.data;
      
      setReportData(reportInfo);
    } catch (error) {
      console.error('Error loading attendance report:', error);
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendancePercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-warning';
    return 'text-danger';
  };

  const getAttendanceBadgeColor = (daysAttended, totalDays) => {
    const percentage = (daysAttended / totalDays) * 100;
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-warning';
    if (percentage >= 50) return 'bg-info';
    return 'bg-danger';
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.guestAttendanceMatrix) {
      toast.error('No data to export');
      return;
    }

    const csvRows = [];
    
    // Header row
    const headers = ['Guest Name', 'Phone', 'Total Days', 'Days Attended', 'Attendance %'];
    reportData.eventDates.forEach(date => {
      headers.push(formatDate(date));
    });
    csvRows.push(headers.join(','));

    // Data rows
    reportData.guestAttendanceMatrix.forEach(guestData => {
      const attendancePercentage = Math.round(
        (guestData.totalDaysAttended / reportData.eventDates.length) * 100
      );
      
      const row = [
        `"${guestData.guest.name}"`,
        guestData.guest.phone || 'N/A',
        reportData.eventDates.length,
        guestData.totalDaysAttended,
        `${attendancePercentage}%`
      ];
      
      // Add attendance for each date
      reportData.eventDates.forEach(date => {
        const attended = guestData.attendanceDays.includes(date);
        row.push(attended ? 'Yes' : 'No');
      });
      
      csvRows.push(row.join(','));
    });

    // Create and download the file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title}_attendance_report.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Attendance report exported successfully!');
  };

  if (loading) {
    return (
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading attendance report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="alert alert-danger">
                Failed to load attendance report
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overallStats = {
    totalGuests: reportData?.dailyStats?.[0]?.totalGuests || 0,
    averageAttendance: reportData?.dailyStats?.length > 0 ? Math.round(
      reportData.dailyStats.reduce((sum, day) => sum + day.percentage, 0) / reportData.dailyStats.length
    ) : 0,
    perfectAttendees: reportData?.guestAttendanceMatrix?.filter(
      guest => guest.totalDaysAttended === reportData?.eventDates?.length
    ).length || 0
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-graph-up me-2"></i>
              Attendance Report: {reportData.event.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {/* Event Info */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="d-flex align-items-center">
                  <span className="badge bg-info me-2">Multi-Day Event</span>
                  <span className="text-muted">
                    {formatDate(reportData.event.startDate)} - {formatDate(reportData.event.endDate)}
                  </span>
                  <span className="badge bg-secondary ms-2">
                    {reportData.eventDates.length} days
                  </span>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'summary' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('summary')}
                  >
                    Summary
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'detailed' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('detailed')}
                  >
                    Detailed
                  </button>
                </div>
              </div>
            </div>

            {/* Overall Statistics */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h3 className="text-primary mb-0">{overallStats.totalGuests}</h3>
                    <small className="text-muted">Total Registered</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h3 className={`mb-0 ${getAttendancePercentageColor(overallStats.averageAttendance)}`}>
                      {overallStats.averageAttendance}%
                    </h3>
                    <small className="text-muted">Average Daily Attendance</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h3 className="text-success mb-0">{overallStats.perfectAttendees}</h3>
                    <small className="text-muted">Perfect Attendance</small>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === 'summary' ? (
              // Summary View
              <div>
                <h6 className="mb-3">Daily Attendance Summary</h6>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Checked In</th>
                        <th>Total Guests</th>
                        <th>Percentage</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailyStats.map((day, index) => (
                        <tr key={day.date}>
                          <td>{formatDate(day.date)}</td>
                          <td>
                            <span className="badge bg-secondary">Day {index + 1}</span>
                          </td>
                          <td>
                            <strong className="text-success">{day.checkedIn}</strong>
                          </td>
                          <td>{day.totalGuests}</td>
                          <td>
                            <span className={getAttendancePercentageColor(day.percentage)}>
                              {day.percentage}%
                            </span>
                          </td>
                          <td>
                            <div className="progress" style={{ height: '8px', width: '100px' }}>
                              <div
                                className={`progress-bar ${
                                  day.percentage >= 90 ? 'bg-success' : 
                                  day.percentage >= 70 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${day.percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Detailed View
              <div>
                <h6 className="mb-3">Individual Guest Attendance</h6>
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-striped table-sm">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th style={{ minWidth: '200px' }}>Guest Name</th>
                        <th>Contact</th>
                        <th>Days Attended</th>
                        <th>Percentage</th>
                        {reportData.eventDates.map((date, index) => (
                          <th key={date} className="text-center" style={{ minWidth: '60px' }}>
                            D{index + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.guestAttendanceMatrix
                        .sort((a, b) => b.totalDaysAttended - a.totalDaysAttended)
                        .map(guestData => {
                          const attendancePercentage = Math.round(
                            (guestData.totalDaysAttended / reportData.eventDates.length) * 100
                          );
                          
                          return (
                            <tr key={guestData.guest._id}>
                              <td>
                                <div className="fw-semibold">{guestData.guest.name}</div>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {guestData.guest.phone || guestData.guest.email}
                                </small>
                              </td>
                              <td>
                                <span className={`badge ${getAttendanceBadgeColor(guestData.totalDaysAttended, reportData.eventDates.length)}`}>
                                  {guestData.totalDaysAttended}/{reportData.eventDates.length}
                                </span>
                              </td>
                              <td>
                                <span className={getAttendancePercentageColor(attendancePercentage)}>
                                  {attendancePercentage}%
                                </span>
                              </td>
                              {reportData.eventDates.map(date => (
                                <td key={date} className="text-center">
                                  {guestData.attendanceDays.includes(date) ? (
                                    <i className="bi bi-check-circle text-success"></i>
                                  ) : (
                                    <i className="bi bi-x-circle text-danger"></i>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-primary"
              onClick={exportToCSV}
              disabled={!reportData || loading}
            >
              <i className="bi bi-download me-1"></i>
              Export Report
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiDayAttendanceReport;
