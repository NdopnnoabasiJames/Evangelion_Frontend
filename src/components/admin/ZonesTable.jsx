import React from 'react';

const ZonesTable = ({ zones, onEdit, onDelete }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Zone Name</th>
            <th>Branch</th>
            <th>Zonal Admin</th>
            <th>Pickup Stations</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {zones.map(zone => (
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
                  {zone.branchId?.name || 'Unknown'}
                </span>
              </td>
              <td>
                {zone.zonalAdmin ? (
                  <div>
                    <div className="fw-bold">{zone.zonalAdmin.name}</div>
                    <small className="text-muted">{zone.zonalAdmin.email}</small>
                  </div>
                ) : (
                  <span className="text-muted">No admin assigned</span>
                )}
              </td>
              <td>
                <span className="badge bg-info">
                  {zone.pickupStationCount || 0} stations
                </span>
              </td>
              <td>
                <span className={`badge ${zone.isActive ? 'bg-success' : 'bg-warning'}`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <small className="text-muted">
                  {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : 'N/A'}
                </small>
              </td>
              <td>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => onEdit(zone)}
                    title="Edit zone"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => onDelete(zone)}
                    title="Delete zone"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ZonesTable;
