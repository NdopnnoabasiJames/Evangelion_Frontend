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
  const { execute: submitSelection } = useApi(null, { immediate: false });  useEffect(() => {
    fetchAvailableOptions();
  }, [event._id]);
  // Pre-select items that were originally selected for the creator's own events
  // but only if they're not already delegated
  useEffect(() => {
    if (availableItems.length > 0) {
      const preSelectedItems = [];
      
      if (userRole === 'state_admin' && event.creatorLevel === 'state_admin' && event.selectedBranches) {
        // Pre-select branches that were originally selected but are not yet delegated
        event.selectedBranches.forEach(branch => {
          const branchId = typeof branch === 'object' ? branch._id : branch;
          if (branchId && !isItemDelegated(branchId.toString())) {
            preSelectedItems.push(branchId.toString());
          }
        });
      } else if (userRole === 'branch_admin' && event.creatorLevel === 'branch_admin' && event.selectedZones) {
        // Pre-select zones that were originally selected but are not yet delegated
        event.selectedZones.forEach(zone => {
          const zoneId = typeof zone === 'object' ? zone._id : zone;
          if (zoneId && !isItemDelegated(zoneId.toString())) {
            preSelectedItems.push(zoneId.toString());
          }
        });
      }
      
      setSelectedItems(preSelectedItems);
    }
  }, [availableItems, event, userRole]);const fetchAvailableOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userRole === 'state_admin') {
        const response = await fetchOptions(
          `${API_ENDPOINTS.ADMIN.BRANCHES}`
        );
        setAvailableItems(response?.data || response || []);
        
      } else if (userRole === 'branch_admin') {
        const response = await fetchOptions(
          `${API_ENDPOINTS.ADMIN.ZONES}`
        );
        setAvailableItems(response?.data || response || []);
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load available options');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId) => {
    // Prevent selection if already delegated
    const isDelegated = isItemDelegated(itemId);
    if (isDelegated) return;

    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };  // Check if item is already delegated to this event
  const isItemDelegated = (itemId) => {
    if (userRole === 'state_admin') {
      // Check if branch is already in availableBranches (delegated/selected)
      return event.availableBranches?.some(branch => {
        if (typeof branch === 'object' && branch._id) {
          return branch._id === itemId || branch._id.toString() === itemId.toString();
        }
        return branch === itemId || branch.toString() === itemId.toString();
      }) || false;
    } else if (userRole === 'branch_admin') {
      // Check if zone is already in availableZones (delegated/selected)
      return event.availableZones?.some(zone => {
        if (typeof zone === 'object' && zone._id) {
          return zone._id === itemId || zone._id.toString() === itemId.toString();
        }
        return zone === itemId || zone.toString() === itemId.toString();
      }) || false;
    }
    return false;
  };

  // Get available items (not yet delegated)
  const getAvailableItems = () => {
    return availableItems.filter(item => !isItemDelegated(item._id));
  };

  // Get delegated items
  const getDelegatedItems = () => {
    return availableItems.filter(item => isItemDelegated(item._id));
  };
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setSubmitting(true);
    setError(null);    try {
      const endpoint = userRole === 'state_admin' 
        ? `${API_ENDPOINTS.EVENTS.SELECT_BRANCHES.replace(':eventId', event._id)}`
        : `${API_ENDPOINTS.EVENTS.SELECT_ZONES.replace(':eventId', event._id)}`;

      const body = userRole === 'state_admin'
        ? { selectedBranches: selectedItems }
        : { selectedZones: selectedItems };

      await submitSelection(endpoint, {
        method: 'PATCH',
        body
      });

      // Show success notification
      if (window.showNotification) {
        window.showNotification(
          `Successfully delegated "${event.name}" to ${selectedItems.length} ${itemType}!`,
          'success'
        );
      } else {
        alert(`✅ Successfully delegated "${event.name}" to ${selectedItems.length} ${itemType}!`);
      }

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
              </div>            ) : (
              <div>
                <div className="mb-3">
                  <h6 className="mb-2">
                    <i className="bi bi-list-ul me-2"></i>
                    All {itemLabel} 
                    <small className="text-muted ms-2">
                      ({getAvailableItems().length} available, {getDelegatedItems().length} delegated)
                    </small>
                  </h6>
                </div>
                
                <div className="row g-3">
                  {availableItems.map(item => {
                    const isDelegated = isItemDelegated(item._id);
                    return (
                      <div key={item._id} className="col-md-6">                        <div 
                          className={`card ${
                            isDelegated 
                              ? 'border-secondary bg-light' 
                              : selectedItems.includes(item._id) 
                                ? 'border-primary bg-primary bg-opacity-10 cursor-pointer' 
                                : 'border-success cursor-pointer'
                          }`}
                          onClick={() => !isDelegated && handleItemToggle(item._id)}
                          style={{ 
                            cursor: isDelegated ? 'not-allowed' : 'pointer',
                            opacity: isDelegated ? '0.6' : '1',
                            filter: isDelegated ? 'grayscale(30%)' : 'none',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className={`mb-1 ${isDelegated ? 'text-muted' : ''}`}>
                                  {item.name}
                                </h6>
                                {item.location && (
                                  <small className={isDelegated ? 'text-muted' : 'text-muted'}>
                                    <i className="bi bi-geo-alt me-1"></i>
                                    {item.location}
                                  </small>
                                )}
                              </div>
                              <div>
                                {isDelegated ? (
                                  <div className="text-center">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <small className="d-block text-success">Delegated</small>
                                  </div>
                                ) : (
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={selectedItems.includes(item._id)}
                                      onChange={() => handleItemToggle(item._id)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
            <div className="modal-footer">
            <div className="me-auto">
              <div className="d-flex flex-column">
                <small className="text-muted">
                  {selectedItems.length} {itemType} selected • {getAvailableItems().length} available
                </small>
                {getDelegatedItems().length > 0 && (
                  <small className="text-success">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    {getDelegatedItems().length} already delegated
                  </small>
                )}
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || selectedItems.length === 0 || getAvailableItems().length === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Delegating...
                </>
              ) : getAvailableItems().length === 0 ? (
                `All ${itemLabel} Delegated`
              ) : (
                `Delegate to ${selectedItems.length} ${itemLabel}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
