import React from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime } from '../../helpers/workerTabs.helpers';

const RegisteredGuestsTab = ({ registeredGuests, loading, error, setShowGuestModal, userRole }) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h5 className="mb-0">My Registered Guests</h5>
      <button
        className="btn btn-primary"
        onClick={() => setShowGuestModal(true)}
      >
        <i className="bi bi-person-plus me-2"></i>
        Register New Guest
      </button>
    </div>
    {loading ? (
      <LoadingCard />
    ) : error ? (
      <ErrorDisplay message={error} />
    ) : !Array.isArray(registeredGuests) ? (
      <ErrorDisplay message="Error loading guests data" />
    ) : registeredGuests.length === 0 ? (
      <EmptyState message="No guests registered yet" />
    ) : (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ minWidth: '180px' }}>Guest Info</th>
                  <th scope="col" style={{ minWidth: '140px' }}>Contact</th>
                  <th scope="col" style={{ minWidth: '220px' }}>Event Details</th>
                  <th scope="col" style={{ minWidth: '150px' }}>Comments</th>
                  <th scope="col" style={{ minWidth: '160px' }}>Date & Time</th>
                  <th scope="col" style={{ minWidth: '120px' }}>Status</th>
                  <th scope="col" style={{ minWidth: '140px' }}>Registered</th>
                  {(userRole === 'branch_admin' || userRole === 'zonal_admin') && 
                    <th scope="col" style={{ minWidth: '130px' }}>Actions</th>
                  }
                </tr>
              </thead>
              <tbody>
                {registeredGuests.map(guest => {
                  const eventLocation = guest.event ? formatEventLocation(guest.event) : 'No Event';
                  const eventDateTime = guest.event ? formatEventDateTime(guest.event) : { date: 'N/A', time: 'N/A' };
                  const registeredAt = guest.createdAt ? new Date(guest.createdAt) : null;
                  return (
                    <tr key={guest._id}>
                      <td style={{ minWidth: '180px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-semibold text-truncate" style={{ maxWidth: '160px' }} title={guest.name}>
                            {guest.name}
                          </div>
                          <small className="text-muted text-truncate" style={{ maxWidth: '160px' }} title={guest.email}>
                            {guest.email}
                          </small>
                        </div>
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div className="fw-medium">{guest.phone}</div>
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }} title={guest.event?.name || guest.event?.title || 'N/A'}>
                            {guest.event?.name || guest.event?.title || 'N/A'}
                          </div>
                          <small className="text-muted text-truncate" style={{ maxWidth: '200px' }} title={eventLocation}>
                            <i className="bi bi-geo-alt me-1"></i>{eventLocation}
                          </small>
                        </div>
                      </td>
                      <td className="text-muted" style={{ minWidth: '150px' }}>
                        <div className="text-truncate" style={{ maxWidth: '130px' }} title={guest.comments || '-'}>
                          {guest.comments || '-'}
                        </div>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-medium">{eventDateTime.date}</div>
                          <small className="text-muted">{eventDateTime.time}</small>
                        </div>
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        <span className={`badge ${guest.isCheckedIn ? 'bg-success' : 'bg-warning'} px-2 py-1`}>
                          {guest.isCheckedIn ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div className="d-flex flex-column">
                          {registeredAt ? (
                            <>
                              <div className="fw-medium">{registeredAt.toLocaleDateString()}</div>
                              <small className="text-muted">
                                {registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </>
                          ) : (
                            <small className="text-muted">Unknown</small>
                          )}
                        </div>
                      </td>
                      {(userRole === 'branch_admin' || userRole === 'zonal_admin') && (
                        <td style={{ minWidth: '130px' }}>
                          <button
                            className="btn btn-sm btn-outline-primary px-2 py-1"
                            onClick={() => window.open(`mailto:${guest.email}`, '_blank')}
                            title="Send Email"
                          >
                            <i className="bi bi-envelope me-1"></i>
                            Email
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default RegisteredGuestsTab;
