import React from 'react';
import { ROLES } from '../../utils/constants';

const PendingZonesTable = ({ zones, onEdit, onDelete, onApprove, onReject, user }) => {
  // Ensure zones is always an array
  const safeZones = Array.isArray(zones) ? zones : [];

  return (
    <div className="table-responsive">
      <div style={{ marginBottom: '8px', fontWeight: 500 }}>
      </div>
      <table className="table table-hover">
        <thead>
          <tr>
            <th><i className="bi bi-geo-alt"></i> Zone Name</th>
            <th><i className="bi bi-building"></i> Branch</th>
            <th><i className="bi bi-person"></i> Zonal Admin</th>
            <th><i className="bi bi-box"></i> Pickup Stations</th>
            <th><i className="bi bi-info-circle"></i> Status</th>
            <th><i className="bi bi-calendar"></i> Created</th>
            {/* Only show Actions column for super admin */}
            {user?.role === ROLES.SUPER_ADMIN && <th><i className="bi bi-gear"></i> Actions</th>}
          </tr>
        </thead>
        <tbody>
          {safeZones.length === 0 ? (
            <tr>
              <td colSpan={user?.role === ROLES.SUPER_ADMIN ? 7 : 6} className="text-center text-muted">
                <i className="bi bi-inbox me-2"></i>No pending zones to display.
              </td>
            </tr>
          ) : (
            safeZones.map(zone => (
              <tr key={zone._id}>
                <td>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    <div>
                      <strong>{zone.name}</strong>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge bg-primary">
                    <i className="bi bi-building me-1"></i>
                    {zone.branchId?.name || 'Unknown'}
                  </span>
                </td>
                <td>
                  {zone.zonalAdmin ? (
                    <div>
                      <div className="fw-bold"><i className="bi bi-person me-1"></i>{zone.zonalAdmin.name}</div>
                      <small className="text-muted">{zone.zonalAdmin.email}</small>
                    </div>
                  ) : (
                    <span className="text-muted"><i className="bi bi-person-x me-1"></i>No admin assigned</span>
                  )}
                </td>
                <td>
                  <span className="badge bg-info">
                    <i className="bi bi-box me-1"></i>
                    {zone.pickupStationCount || 0} stations
                  </span>
                </td>
                <td>
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-hourglass-split me-1"></i>Pending
                  </span>
                </td>
                <td>
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : 'N/A'}
                  </small>
                </td>
                {/* Only show Actions for super admin */}
                {user?.role === ROLES.SUPER_ADMIN && (
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        onClick={() => onApprove && onApprove(zone)}
                        title="Approve zone"
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onReject && onReject(zone)}
                        title="Reject zone"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onEdit(zone)}
                        title="Edit zone"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onDelete(zone)}
                        title="Delete zone"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingZonesTable;
