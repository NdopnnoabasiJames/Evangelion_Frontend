import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

const ZonesManagement = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  const { execute: fetchZones } = useApi(null, { immediate: false });
  const { execute: createZone, error: createError } = useApi(null, { immediate: false });
  const { execute: updateZone, error: updateError } = useApi(null, { immediate: false });
  const { execute: deleteZone } = useApi(null, { immediate: false });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchZones(API_ENDPOINTS.ZONES.BRANCH_ADMIN_LIST);
      setZones(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      const result = await createZone(API_ENDPOINTS.ZONES.BRANCH_ADMIN_CREATE, {
        method: 'POST',
        body: formData
      });

      if (!result) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (createError) {
          throw new Error(createError);
        } else {
          throw new Error('Failed to create zone');
        }
      }

      setShowCreateModal(false);
      resetForm();
      loadZones();
    } catch (error) {
      console.error('Create zone error:', error);
    }
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();
    try {
      const result = await updateZone(`${API_ENDPOINTS.ZONES.BRANCH_ADMIN_UPDATE}/${editingZone._id}`, {
        method: 'PATCH',
        body: formData
      });

      if (!result) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (updateError) {
          throw new Error(updateError);
        } else {
          throw new Error('Failed to update zone');
        }
      }

      setEditingZone(null);
      resetForm();
      loadZones();
    } catch (error) {
      console.error('Update zone error:', error);
    }
  };

  const handleDeleteZone = async (zone) => {
    if (window.confirm(`Are you sure you want to delete the zone "${zone.name}"?`)) {
      try {
        await deleteZone(`${API_ENDPOINTS.ZONES.BRANCH_ADMIN_DELETE}/${zone._id}`, {
          method: 'DELETE'
        });
        loadZones();
      } catch (error) {
        console.error('Delete zone error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (zone) => {
    setFormData({
      name: zone.name,
      isActive: zone.isActive
    });
    setEditingZone(zone);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingZone(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-outline-danger btn-sm ms-3" 
          onClick={loadZones}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-geo-alt me-2"></i>
          Zones Management
        </h5>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Zone
        </button>
      </div>
      <div className="card-body">
        {zones.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Zones Found</h4>
            <p className="text-muted">Click "Add Zone" to create your first zone.</p>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create First Zone
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Zone Name</th>
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
                          onClick={() => openEditModal(zone)}
                          title="Edit zone"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteZone(zone)}
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
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingZone) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingZone ? 'Edit Zone' : 'Create New Zone'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModals}
                ></button>
              </div>
              <form onSubmit={editingZone ? handleUpdateZone : handleCreateZone}>
                <div className="modal-body">
                  {(createError || updateError) && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {createError || updateError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="zoneName" className="form-label">
                      Zone Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="zoneName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter zone name"
                    />
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
                        Active Zone
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!formData.name.trim()}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesManagement;
