import React from 'react';
import BranchesManagement from '../../admin/BranchesManagement';

const AdminBranchesTab = ({ isReadOnly = false }) => {
  return <BranchesManagement isReadOnly={isReadOnly} />;
};

export default AdminBranchesTab;
