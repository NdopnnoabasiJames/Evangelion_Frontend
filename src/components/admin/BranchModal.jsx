import React, { useState, useEffect } from 'react';

const BranchModal = ({ branch, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!branch;
  // Reset form data when branch changes (for editing)
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        location: branch.location || '',
        phone: branch.phone || '',
        email: branch.email || '',
        isActive: branch.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        location: '',
        phone: '',
        email: '',
        isActive: true
      });
    }
  }, [branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const submitData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        isActive: formData.isActive
      };
      await onSubmit(submitData);
      onHide();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save branch');
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
              <i className="bi bi-building me-2"></i>
              {isEditing ? `Edit ${branch.name}` : 'Create New Branch'}
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
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-building me-1"></i>
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lagos Central Branch"
                    required
                  />
                  <div className="form-text">Enter a unique name for this branch within your state</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-1"></i>
                    Location/Address *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Victoria Island, Lagos"
                    required
                  />
                  <div className="form-text">Enter the branch location or address</div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-telephone me-1"></i>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +234 xxx xxx xxxx"
                    required
                  />
                  <div className="form-text">Enter the branch contact phone number</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-envelope me-1"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., branch@example.com"
                  />
                  <div className="form-text">Optional: Branch email address</div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
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
                      Active Branch
                    </label>
                  </div>
                  <div className="form-text">Active branches can accept new members and events</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !formData.name.trim() || !formData.location.trim() || !formData.phone.trim()}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-2"></i>
                    {isEditing ? 'Update Branch' : 'Create Branch'}
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

export default BranchModal;
