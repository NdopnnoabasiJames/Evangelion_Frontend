import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { API_ENDPOINTS } from '../../../utils/constants';
import PickupStationsTab from './PickupStationsTab';

const BranchAdminPickupStationsTab = () => {
  const { user } = useAuth();
  
  const columns = [
    {
      field: 'location',
      label: (
        <>
          <i className="bi bi-geo-alt-fill me-1"></i>
          Station Name
        </>
      )
    },
    {
      field: 'capacity',
      label: (
        <>
          <i className="bi bi-people-fill me-1"></i>
          Capacity
        </>
      ),
      render: (value) => (
        <div className="d-flex align-items-center">
          <i className="bi bi-person-check text-success me-2"></i>
          <span>{value ? `${value} people` : '-'}</span>
        </div>
      )
    },
    {
      field: 'departureTime',
      label: (
        <>
          <i className="bi bi-clock-fill me-1"></i>
          Departure Time
        </>
      ),
      render: (value) => {
        if (!value) return (
          <div className="d-flex align-items-center text-muted">
            <i className="bi bi-dash-circle me-2"></i>
            <span>-</span>
          </div>
        );
        try {
          const time = new Date(`1970-01-01T${value}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          return (
            <div className="d-flex align-items-center">
              <i className="bi bi-alarm text-primary me-2"></i>
              <span>{time}</span>
            </div>
          );
        } catch {
          return (
            <div className="d-flex align-items-center">
              <i className="bi bi-clock text-warning me-2"></i>
              <span>{value}</span>
            </div>
          );
        }
      }
    },
    {
      field: 'zoneId',
      label: (
        <>
          <i className="bi bi-diagram-3-fill me-1"></i>
          Zone
        </>
      ),
      render: (value, station) => (
        <div className="d-flex align-items-center">
          <i className="bi bi-pin-map text-info me-2"></i>
          <span>{station.zoneId?.name || '-'}</span>
        </div>
      )
    }
  ];

  // Construct endpoint with branch ID from user
  const endpoint = user?.branch?._id 
    ? `${API_ENDPOINTS.PICKUP_STATIONS.BY_BRANCH}/${user.branch._id}`
    : API_ENDPOINTS.PICKUP_STATIONS.BASE;

  return (
    <PickupStationsTab
      title="Branch Pickup Stations"
      endpoint={endpoint}
      columns={columns}
      showZone={false}
      showBranch={false}
      showState={false}
    />
  );
};

export default BranchAdminPickupStationsTab;
