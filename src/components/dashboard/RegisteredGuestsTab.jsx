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
              <thead className="table-light"><tr><th scope="col">Guest Name</th><th scope="col">Contact</th><th scope="col">Event</th><th scope="col">Comments</th><th scope="col">Event Date & Time</th><th scope="col">Status</th><th scope="col">Registered</th>{(userRole === 'branch_admin' || userRole === 'zonal_admin') && <th scope="col">Actions</th>}</tr></thead>
              <tbody>{registeredGuests.map(guest => {
                const eventLocation = guest.event ? formatEventLocation(guest.event) : 'No Event';
                const eventDateTime = guest.event ? formatEventDateTime(guest.event) : { date: 'N/A', time: 'N/A' };
                const registeredAt = guest.createdAt ? new Date(guest.createdAt) : null;
                return (
                  <tr key={guest._id}>
                    <td><div><div className="fw-semibold">{guest.name}</div><small className="text-muted">{guest.email}</small></div></td>
                    <td><div><div>{guest.phone}</div></div></td>
                    <td><div><div className="fw-medium">{guest.event?.name || guest.event?.title || 'N/A'}</div><small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{eventLocation}</small></div></td>
                    <td className="text-muted">{guest.comments || '-'}</td>
                    <td><div><div>{eventDateTime.date}</div><small className="text-muted">{eventDateTime.time}</small></div></td>
                    <td><span className={`badge ${guest.isCheckedIn ? 'bg-success' : 'bg-warning'}`}>{guest.isCheckedIn ? 'Checked In' : 'Registered'}</span></td>
                    <td><div>{registeredAt ? (<><div>{registeredAt.toLocaleDateString()}</div><small className="text-muted">{registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></>) : (<small className="text-muted">Unknown</small>)}</div></td>
                    {(userRole === 'branch_admin' || userRole === 'zonal_admin') && (
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => window.open(`mailto:${guest.email}`, '_blank')}
                          title="Send Email"
                        >
                          <i className="bi bi-envelope me-1"></i>
                          Send Mail
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default RegisteredGuestsTab;
