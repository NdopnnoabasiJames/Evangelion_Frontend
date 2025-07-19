import React from 'react';
import WorkersManagement from '../../admin/WorkersManagement';

const AdminWorkersTab = ({ isReadOnly = false }) => {
  return (
    <div className="tab-pane fade show active">
      <WorkersManagement isReadOnly={isReadOnly} />
    </div>
  );
};

export default AdminWorkersTab;
