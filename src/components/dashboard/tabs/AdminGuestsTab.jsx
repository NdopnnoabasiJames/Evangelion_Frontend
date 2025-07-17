import React from 'react';
import GuestsManagement from '../../admin/GuestsManagement';

const AdminGuestsTab = ({ isReadOnly = false }) => {
  return (
    <div className="tab-pane fade show active">
      <GuestsManagement isReadOnly={isReadOnly} />
    </div>
  );
};

export default AdminGuestsTab;
