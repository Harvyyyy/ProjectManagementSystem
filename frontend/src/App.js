import React from 'react';
import './App.css'; // Your custom app styles
import LoginPage from './components/login/LoginPage';
import RegisterPage from './components/register/RegisterPage';
import Dashboard from './components/Dashboard/Dashboard'; // Main dashboard layout
import ProjectTable from './components/Dashboard/ProjectsTable'; // Projects view
import TaskTable from './components/Dashboard/TasksTable';     // Tasks view

// --- Import Bootstrap CSS FIRST ---
import 'bootstrap/dist/css/bootstrap.min.css';
// --- Import Bootstrap Icons CSS ---
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- CORRECTED: Removed Outlet from this import ---
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// --- END CORRECTION ---

import { AuthProvider, useAuth } from './context/AuthContext'; // Your Auth context

// Define API Base URL (adjust if needed)
export const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  return (
    // Wrap the entire application in Router and AuthProvider
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Define application routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                // Use PrivateRoute component to protect dashboard access
                <PrivateRoute>
                  <Dashboard /> {/* Render Dashboard layout for protected routes */}
                </PrivateRoute>
              }
            >
              {/* Nested Routes that render inside Dashboard's <Outlet /> */}
              <Route index element={<Navigate to="projects" replace />} /> {/* Default */}
              <Route path="projects" element={<ProjectTable />} />
              <Route path="tasks" element={<TaskTable />} />
              {/* Add more nested dashboard routes here */}
            </Route>

            {/* Redirect root path to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}


// Component to protect routes based on authentication status
function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth(); // Get auth state from context

  // Show loading indicator while checking auth status
  if (loading) {
    return (
        <div className="vh-100 d-flex justify-content-center align-items-center" style={{ background: '#212529', color: 'white' }}>
            Loading Authentication...
        </div>
    );
  }

  // Render child component or redirect to login
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default App;