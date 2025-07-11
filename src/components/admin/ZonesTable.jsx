import React from 'react';

const ZonesTable = ({ zones }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th><i className="bi bi-geo-alt"></i> Zone Name</th>
            <th><i className="bi bi-building"></i> Branch</th>
            <th><i className="bi bi-person"></i> Zonal Admin</th>
            <th><i className="bi bi-box"></i> Pickup Stations</th>
            <th><i className="bi bi-info-circle"></i> Status</th>
            <th><i className="bi bi-calendar"></i> Created</th>
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
                <span className={`badge ${zone.isActive ? 'bg-success' : 'bg-warning text-dark'}`}>
                  <i className={`bi ${zone.isActive ? 'bi-check-circle' : 'bi-hourglass-split'} me-1`}></i>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <small className="text-muted">
                  <i className="bi bi-calendar me-1"></i>
                  {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : 'N/A'}
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ZonesTable;
