import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const ZoneModal = ({ show, editingZone, formData, setFormData, createError, updateError, handleSubmit, closeModals }) => {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const { execute } = useApi();

  // Fetch branches on component mount
  useEffect(() => {
    if (show) {
      const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
          const response = await execute(API_ENDPOINTS.BRANCHES.LIST);
          setBranches(response.data || []);
        } catch (error) {
          console.error('Failed to fetch branches:', error);
        } finally {
          setLoadingBranches(false);
        }
      };
      fetchBranches();
    }
  }, [show, execute]);

  if (!show) return null;
  
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-geo-alt me-2"></i>
              {editingZone ? 'Edit Zone' : 'Create New Zone'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={closeModals}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {(createError || updateError) && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {createError || updateError}
                </div>
              )}
              
              {/* Branch Selection - Only for creating new zones */}
              {!editingZone && (
                <div className="mb-3">
                  <label htmlFor="branchId" className="form-label">
                    <i className="bi bi-building me-1"></i>
                    Branch <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="branchId"
                    value={formData.branchId || ''}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    required
                    disabled={loadingBranches}
                  >
                    <option value="">
                      {loadingBranches ? 'Loading branches...' : 'Select a branch'}
                    </option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name} - {branch.location}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Choose the branch this zone belongs to</div>
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="zoneName" className="form-label">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  Zone Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="zoneName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Zone A, North District, etc."
                />
                <div className="form-text">Enter a unique name for this zone within the selected branch</div>
              </div>
              
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    <i className="bi bi-check-circle me-1"></i>
                    Active Zone
                  </label>
                  <div className="form-text">Inactive zones will not be available for event assignments</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!formData.name.trim() || (!editingZone && !formData.branchId)}
              >
                <i className="bi bi-check-circle me-2"></i>
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ZoneModal;
