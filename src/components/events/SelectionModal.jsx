import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const SelectionModal = ({ event, userRole, onClose, onComplete }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { execute: fetchOptions } = useApi(null, { immediate: false });
  const { execute: submitSelection } = useApi(null, { immediate: false });

  useEffect(() => {
    fetchAvailableOptions();
  }, [event._id]);  const fetchAvailableOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userRole === 'state_admin') {
        // Fetch branches accessible to the state admin
        console.log('SelectionModal: Fetching branches for state admin...');
        console.log('SelectionModal: API endpoint:', API_ENDPOINTS.ADMIN.BRANCHES);
        
        const response = await fetchOptions(
          `${API_ENDPOINTS.ADMIN.BRANCHES}`
        );
        
        console.log('SelectionModal: Branches API response:', response);
        console.log('SelectionModal: Response type:', typeof response);
        console.log('SelectionModal: Response data:', response?.data);
        
        // Handle different response formats
        let branches = [];
        if (response && response.data) {
          branches = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response && Array.isArray(response)) {
          branches = response;
        } else if (response) {
          branches = [response];
        }
        
        console.log('SelectionModal: Processed branches:', branches);
        setAvailableItems(branches);
        
      } else if (userRole === 'branch_admin') {
        // Fetch zones accessible to the branch admin
        console.log('SelectionModal: Fetching zones for branch admin...');
        console.log('SelectionModal: API endpoint:', API_ENDPOINTS.ADMIN.ZONES);
        
        const response = await fetchOptions(
          `${API_ENDPOINTS.ADMIN.ZONES}`
        );
        
        console.log('SelectionModal: Zones API response:', response);
        console.log('SelectionModal: Response type:', typeof response);
        console.log('SelectionModal: Response data:', response?.data);
        
        // Handle different response formats
        let zones = [];
        if (response && response.data) {
          zones = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response && Array.isArray(response)) {
          zones = response;
        } else if (response) {
          zones = [response];
        }
        
        console.log('SelectionModal: Processed zones:', zones);
        setAvailableItems(zones);
      }
    } catch (error) {
      console.error('SelectionModal: Error fetching available options:', error);
      console.error('SelectionModal: Error details:', error.response);
      setError(error.response?.data?.message || error.message || 'Failed to load available options');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = userRole === 'state_admin' 
        ? `${API_ENDPOINTS.EVENTS.SELECT_BRANCHES}/${event._id}/select-branches`
        : `${API_ENDPOINTS.EVENTS.SELECT_ZONES}/${event._id}/select-zones`;

      const body = userRole === 'state_admin'
        ? { selectedBranches: selectedItems }
        : { selectedZones: selectedItems };

      await submitSelection(endpoint, {
        method: 'PATCH',
        body
      });

      onComplete();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const itemType = userRole === 'state_admin' ? 'branches' : 'zones';
  const itemLabel = userRole === 'state_admin' ? 'Branches' : 'Zones';

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Select {itemLabel} for "{event.name}"
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {availableItems.map(item => (
                  <div key={item._id} className="col-md-6">
                    <div 
                      className={`card cursor-pointer ${selectedItems.includes(item._id) ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                      onClick={() => handleItemToggle(item._id)}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{item.name}</h6>
                            {item.location && (
                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i>
                                {item.location}
                              </small>
                            )}
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleItemToggle(item._id)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <div className="me-auto">
              <small className="text-muted">
                {selectedItems.length} {itemType} selected
              </small>
            </div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Delegating...
                </>
              ) : (
                `Delegate to Selected ${itemLabel}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
