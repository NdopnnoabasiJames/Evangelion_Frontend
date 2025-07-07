import React, { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { API_ENDPOINTS } from '../../../utils/constants';
import { LoadingCard, ErrorDisplay } from '../../common/Loading';

const PickupStationsTab = ({ 
  title = "Pickup Stations", 
  endpoint, 
  columns = [],
  showZone = true,
  showBranch = true,
  showState = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('location');
  const [sortDirection, setSortDirection] = useState('asc');

  const { data: pickupStationsResponse, loading, error, refetch } = useApi(endpoint, { immediate: true });

  // Extract pickup stations data similar to how dashboard service does it
  const pickupStations = React.useMemo(() => {
    if (!pickupStationsResponse) return [];
    
    // Handle different response formats
    const data = pickupStationsResponse.data || pickupStationsResponse;
    if (data && data.length > 0) {
    }
    return Array.isArray(data) ? data : [];
  }, [pickupStationsResponse, endpoint]);

  // Filter and sort stations
  const filteredStations = React.useMemo(() => {
    if (!pickupStations || !Array.isArray(pickupStations)) {
      return [];
    }
    
    let filtered = pickupStations.filter(station => {
      const hasName = station && (station.name || station.location);
      const searchField = station.name || station.location || '';
      const matchesSearch = !searchTerm || 
        searchField.toLowerCase().includes(searchTerm.toLowerCase());
      
      return hasName && matchesSearch;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [pickupStations, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStations = filteredStations.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (!filteredStations.length) return;

    const headers = columns.map(col => col.label).join(',');
    const rows = filteredStations.map(station => 
      columns.map(col => {
        const value = station[col.field] || '';
        // Escape commas and quotes for CSV
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pickup-stations-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sortDirection === 'asc' 
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  if (loading) {
    return <LoadingCard message="Loading pickup stations..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        message="Failed to load pickup stations" 
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="pickup-stations-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-geo-alt me-2"></i>
          {title}
        </h4>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-success btn-sm"
            onClick={exportToCSV}
            disabled={!filteredStations.length}
          >
            <i className="bi bi-download me-1"></i>
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by station name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <small className="text-muted">
            Showing {paginatedStations.length} of {filteredStations.length} stations
          </small>
        </div>
      </div>

      {/* Table */}
      {filteredStations.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-geo-alt-fill text-muted display-1"></i>
          <h5 className="text-muted mt-3">No pickup stations found</h5>
          {searchTerm && (
            <p className="text-muted">Try adjusting your search terms</p>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  {columns.map(column => (
                    <th 
                      key={column.field}
                      className="cursor-pointer user-select-none"
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                      {renderSortIcon(column.field)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedStations.map((station, index) => (
                  <tr key={station.id || index}>
                    {columns.map(column => (
                      <td key={column.field}>
                        {column.render 
                          ? column.render(station[column.field], station)
                          : station[column.field] || '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pickup stations pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return (
                      <li key={page} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default PickupStationsTab;
