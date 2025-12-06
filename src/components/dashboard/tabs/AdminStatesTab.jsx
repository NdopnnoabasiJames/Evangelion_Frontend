import React from 'react';
import StatesManagement from '../../admin/StatesManagement';

const AdminStatesTab = ({ isReadOnly = false }) => {
  return <StatesManagement isReadOnly={isReadOnly} />;
};

export default AdminStatesTab;
