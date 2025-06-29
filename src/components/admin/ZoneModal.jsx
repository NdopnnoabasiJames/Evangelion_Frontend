import React from 'react';

const ZoneModal = ({ show, editingZone, formData, setFormData, createError, updateError, handleSubmit, closeModals }) => {
  if (!show) return null;
  return (
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
          <form onSubmit={handleSubmit}>
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
  );
};

export default ZoneModal;
