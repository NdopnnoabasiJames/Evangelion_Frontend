import React from 'react';
import ZonesManagement from '../../admin/ZonesManagement';

const AdminZonesTab = ({ isReadOnly = false }) => {
  return <ZonesManagement isReadOnly={isReadOnly} />;
};

export default AdminZonesTab;
