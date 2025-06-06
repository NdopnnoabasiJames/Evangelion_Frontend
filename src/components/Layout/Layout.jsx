import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />

      {/* Main content area */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />        {/* Main content */}
        <main 
          className="flex-grow-1 p-3"
          style={{
            marginTop: '56px', // Account for fixed header
            marginLeft: window.innerWidth >= 992 && !sidebarCollapsed ? '250px' : '0',
            transition: 'margin-left 0.3s ease'
          }}
        >
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
