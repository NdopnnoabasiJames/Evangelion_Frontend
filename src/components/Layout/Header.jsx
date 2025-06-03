import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Navbar bg="dark" variant="dark" className="shadow-sm" fixed="top">
      <Container fluid>
        {/* Sidebar toggle button */}
        <button
          className="btn btn-link text-light d-lg-none"
          onClick={toggleSidebar}
          style={{ border: 'none', padding: '0.25rem 0.5rem' }}
        >
          <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
        </button>

        {/* Brand */}
        <Navbar.Brand href="/dashboard" className="fw-bold">
          <i className="bi bi-star-fill text-warning me-2"></i>
          EVANGELION
        </Navbar.Brand>

        {/* User info and actions */}
        <Nav className="ms-auto">
          <NavDropdown
            title={
              <span>
                <i className="bi bi-person-circle me-2"></i>
                {user?.name || user?.email}
              </span>
            }
            id="user-dropdown"
            align="end"
          >
            <NavDropdown.Item disabled>
              <small className="text-muted">
                Role: {user?.role?.replace('_', ' ') || 'User'}
              </small>
            </NavDropdown.Item>
            <NavDropdown.Item disabled>
              <small className="text-muted">
                Branch: {user?.branch || 'N/A'}
              </small>
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item href="/profile">
              <i className="bi bi-person-gear me-2"></i>
              Profile
            </NavDropdown.Item>
            <NavDropdown.Item href="/settings">
              <i className="bi bi-gear me-2"></i>
              Settings
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout} className="text-danger">
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;
