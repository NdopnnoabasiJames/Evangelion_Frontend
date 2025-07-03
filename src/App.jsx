import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ToastManager } from './components/common/Toast';
import { ToastContainer } from 'react-toastify';

// Import pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DebugAuth from './pages/DebugAuth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Guests from './pages/Guests';
import CheckIn from './pages/CheckIn';
import Workers from './pages/Workers';
import Registrars from './pages/Registrars';
import Analytics from './pages/Analytics';
import RegistrarEventCheckIn from './components/registrars/RegistrarEventCheckIn';

// Import styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/debug-auth" element={<DebugAuth />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/events" 
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/guests" 
              element={
                <ProtectedRoute>
                  <Guests />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/workers" 
              element={
                <ProtectedRoute>
                  <Workers />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/registrars" 
              element={
                <ProtectedRoute>
                  <Registrars />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/checkin" 
              element={
                <ProtectedRoute>
                  <CheckIn />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/events/:eventId/checkin" 
              element={
                <ProtectedRoute>
                  <RegistrarEventCheckIn />
                </ProtectedRoute>
              } 
            />
              {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Toast notifications */}
          <ToastManager />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App
