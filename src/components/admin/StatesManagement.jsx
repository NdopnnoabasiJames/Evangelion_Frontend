import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const StatesManagement = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingState, setEditingState] = useState(null);

  const { execute: fetchStates } = useApi(null, { immediate: false });
  const { execute: createState } = useApi(null, { immediate: false });
  const { execute: updateState } = useApi(null, { immediate: false });

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchStates(API_ENDPOINTS.STATES.LIST);
      setStates(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateState = async (formData) => {
    try {
      await createState(API_ENDPOINTS.STATES.CREATE, {
        method: 'POST',
        body: formData
      });

      if (window.showNotification) {
        window.showNotification('State created successfully!', 'success');
      }

      setShowCreateModal(false);
      loadStates(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleUpdateState = async (formData) => {
    try {
      await updateState(`${API_ENDPOINTS.STATES.UPDATE}/${editingState._id}`, {
        method: 'PATCH',
        body: formData
      });

      if (window.showNotification) {
        window.showNotification('State updated successfully!', 'success');
      }

      setEditingState(null);
      loadStates(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading states...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-map me-2"></i>
              States Management
            </h5>
            <small className="text-muted">Manage all states in the system</small>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New State
          </button>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {states.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-map text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="text-muted mt-3">No States Found</h6>
              <p className="text-muted">No states have been created yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create First State
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>State Name</th>
                    <th>Code</th>
                    <th>Branches</th>
                    <th>Zones</th>
                    <th>Total</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map(state => (
                    <tr key={state._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-geo-alt text-primary me-2"></i>
                          <div>
                            <strong>{state.name}</strong>
                            {state.description && (
                              <div className="text-muted small">{state.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {state.code ? (
                          <span className="badge bg-secondary">{state.code}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-info">{state.branchCount || 0}</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{state.zoneCount || 0}</span>
                      </td>
                      <td>
                        <strong>{state.totalSubdivisions || 0}</strong>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(state.createdAt)}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${state.isActive ? 'bg-success' : 'bg-warning'}`}>
                          {state.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setEditingState(state)}
                            title="Edit state"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-info"
                            title="View details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingState) && (
        <StateFormModal
          state={editingState}
          onHide={() => {
            setShowCreateModal(false);
            setEditingState(null);
          }}
          onSubmit={editingState ? handleUpdateState : handleCreateState}
        />
      )}
    </>
  );
};

// State Form Modal Component
const StateFormModal = ({ state, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: state?.name || '',
    code: state?.code || '',
    description: state?.description || '',
    isActive: state?.isActive ?? true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        isActive: formData.isActive
      };

      // Only include code if it's provided
      if (formData.code.trim()) {
        submitData.code = formData.code.trim().toUpperCase();
      }

      // Only include description if it's provided
      if (formData.description.trim()) {
        submitData.description = formData.description.trim();
      }

      await onSubmit(submitData);
      onHide();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-map me-2"></i>
              {isEditing ? `Edit ${state.name}` : 'Create New State'}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-1"></i>
                    State Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lagos, Abuja, Kano"
                    required
                  />
                  <div className="form-text">Enter the full name of the state</div>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    <i className="bi bi-tag me-1"></i>
                    State Code
                  </label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., LAG, FCT, KAN"
                    maxLength="3"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <div className="form-text">3-character abbreviation (optional)</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-text-paragraph me-1"></i>
                  Description
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Brief description of the state (optional)"
                ></textarea>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    <i className="bi bi-check-circle me-1"></i>
                    Active State
                  </label>
                  <div className="form-text">
                    Inactive states won't be available for admin registration
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-2"></i>
                    {isEditing ? 'Update State' : 'Create State'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatesManagement;
