import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const VolunteerSelectionModal = ({ 
  event, 
  onClose, 
  onConfirm, 
  isOpen 
}) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [availableStates, setAvailableStates] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      // Extract unique states from delegated branches (availableBranches)
      const delegatedBranches = event.availableBranches || [];
      const uniqueStates = [];
      const seenStateIds = new Set();
      
      delegatedBranches.forEach(branch => {
        if (branch.stateId && !seenStateIds.has(branch.stateId._id)) {
          seenStateIds.add(branch.stateId._id);
          uniqueStates.push(branch.stateId);
        }
      });
      
      setAvailableStates(uniqueStates);
      setSelectedState('');
      setSelectedBranch('');
      setAvailableBranches([]);
      setError('');
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (selectedState) {
      loadBranchesForState(selectedState);
    } else {
      setAvailableBranches([]);
      setSelectedBranch('');
    }
  }, [selectedState]);

  const loadBranchesForState = async (stateId) => {
    setLoading(true);
    try {
      // Filter delegated branches to only show those in the selected state
      const delegatedBranches = event.availableBranches || [];
      const branchesInState = delegatedBranches.filter(branch => 
        branch.stateId && branch.stateId._id === stateId
      );
      
      setAvailableBranches(branchesInState);
    } catch (err) {
      setError(`Failed to load branches for selected state: ${err.message}`);
      setAvailableBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedState || !selectedBranch) {
      setError('Please select both state and branch');
      return;
    }

    const selectedStateObj = availableStates.find(state => state._id === selectedState);
    const selectedBranchObj = availableBranches.find(branch => branch._id === selectedBranch);

    onConfirm({
      stateId: selectedState,
      stateName: selectedStateObj?.name || '',
      branchId: selectedBranch,
      branchName: selectedBranchObj?.name || ''
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-geo-alt me-2"></i>
              Select Location to Volunteer
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <h6 className="fw-semibold mb-2">{event?.name}</h6>
              <p className="text-muted small mb-3">
                This event has been delegated to specific branches. Select the state and branch where you'd like to volunteer. 
                Your volunteer request will need approval from the selected branch pastor.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger alert-sm" role="alert">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {error}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="stateSelect" className="form-label">
                <strong>Select State</strong>
              </label>
              <select 
                id="stateSelect"
                className="form-select" 
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">
                  {availableStates.length === 0 ? 'No delegated states available' : 'Choose a state...'}
                </option>
                {availableStates.map(state => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
              {availableStates.length === 0 && (
                <small className="text-muted">This event has not been delegated to any states yet.</small>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="branchSelect" className="form-label">
                <strong>Select Branch</strong>
              </label>
              <select 
                id="branchSelect"
                className="form-select" 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!selectedState || loading}
              >
                <option value="">
                  {!selectedState ? 'Select a state first...' : 
                   loading ? 'Loading branches...' : 
                   'Choose a branch...'}
                </option>
                {Array.isArray(availableBranches) && availableBranches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="alert alert-info alert-sm" role="alert">
              <i className="bi bi-info-circle me-1"></i>
              <strong>Note:</strong> Your volunteer request will be sent to the branch pastor of the selected branch for approval.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleConfirm}
              disabled={!selectedState || !selectedBranch || loading}
            >
              <i className="bi bi-send me-1"></i>
              Submit Volunteer Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerSelectionModal;