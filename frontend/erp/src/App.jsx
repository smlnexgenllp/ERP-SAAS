import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import SubOrganizationDashboard from './pages/dashboard/SubOrganizationDashboard';
import HRDashboard from './pages/modules/hr/HRDashboard';
import EmployeeList from "../src/pages/modules/hr/pages/EmployeeList";
import AddEmployee from "../src/pages/modules/hr/pages/AddEmployee";
import Attendance from "../src/pages/modules/hr/pages/Attendance";
import Payroll from "../src/pages/modules/hr/pages/Payroll";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Dashboard Router - decides which dashboard to show
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'main_org_admin') {
    return <Dashboard />;
  } else if (user?.role === 'sub_org_admin') {
    return <SubOrganizationDashboard />;
  } else {
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />
           
        {/* HR Module */}
        <Route path="/hr/employees" element={<EmployeeList />} />
        <Route path="/hr/employees/add" element={<AddEmployee />} />
        <Route path="/hr/attendance" element={<Attendance />} />
        <Route path="/hr/payroll" element={<Payroll />} />
        {/* <Route path="/hr/list" element={<EmployeeList/>} /> */}
     
          
          {/* Module Routes - Add your module routes here */}
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/hr/dashboard" element={<HRDashboard/>}/>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;