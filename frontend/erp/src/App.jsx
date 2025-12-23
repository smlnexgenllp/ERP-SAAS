// App.jsx - Complete with Payroll Routes
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import SubOrganizationDashboard from "./pages/dashboard/SubOrganizationDashboard";
import HRDashboard from "./pages/modules/hr/HRDashboard";
import EmployeeList from "../src/pages/modules/hr/pages/EmployeeList";
import AddEmployee from "../src/pages/modules/hr/pages/AddEmployee";
import Attendance from "../src/pages/modules/hr/pages/Attendance";
import Payroll from "../src/pages/modules/hr/pages/Payroll"; // Legacy payroll component
import EmployeeLogin from "./pages/modules/hr/pages/EmployeeLogin";
import MyProfile from "./pages/modules/hr/MyProfile";
import OrgTree from "./pages/modules/hr/pages/OrgTree";
import LeaveManagement from "./pages/modules/hr/pages/LeaveManagement";
import UserDashboard from "./pages/dashboard/UserDashboard";
import SubOrgLogin from "./pages/auth/SubOrgLogin";
import Reimbursement from "./pages/modules/hr/pages/Reimbursement";

// Import New Payroll Components
import PayrollPage from "./pages/modules/payroll/PayrollPage"; // New payroll system
import PayrollDashboard from "./components/dashboard/payroll/payrollDashboard";
import SalarySetupWithESIPF from "./components/modules/payroll/SalarySetup";
import InvoiceGeneration from "./components/modules/payroll/InvoiceGeneration";

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

// HR Module Protected Route - Additional check for HR access
const HRProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
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
  
  // Check if user is authenticated and has HR module access
  // Include payroll access for HR users
  const hasHRAccess = user?.modules?.includes('hr') || 
                     user?.role === 'hr_manager' || 
                     user?.role === 'admin' ||
                     user?.role === 'main_org_admin' ||
                     user?.role === 'sub_org_admin' ||
                     user?.role === 'accountant' ||
                     user?.modules?.includes('payroll') ||
                     user?.role === 'payroll_manager';
  
  return isAuthenticated && hasHRAccess ? children : <Navigate to="/dashboard" />;
};

// Payroll Module Protected Route (if you want separate access control)
const PayrollProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
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
  
  // Specific payroll access check
  const hasPayrollAccess = user?.modules?.includes('payroll') || 
                          user?.role === 'payroll_manager' || 
                          user?.role === 'admin' ||
                          user?.role === 'main_org_admin' ||
                          user?.role === 'sub_org_admin' ||
                          user?.role === 'hr_manager' ||
                          user?.role === 'accountant' ||
                          user?.modules?.includes('hr'); // HR users also get payroll
  
  return isAuthenticated && hasPayrollAccess ? children : <Navigate to="/dashboard" />;
};

// Dashboard Router - decides which dashboard to show
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "main_org_admin") {
    return <Dashboard />;
  } else if (user?.role === "sub_org_admin") {
    return <SubOrganizationDashboard />;
  } else if (user?.role === "employee") {
    return <UserDashboard />;
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
          <Route path="/employee_login" element={<EmployeeLogin />} />
          <Route path="/suborglogin" element={<SubOrgLogin />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* HR Module Routes */}
          <Route 
            path="/hr/dashboard" 
            element={
              <HRProtectedRoute>
                <HRDashboard />
              </HRProtectedRoute>
            } 
          />
          <Route 
            path="/hr/employees" 
            element={
              <HRProtectedRoute>
                <EmployeeList />
              </HRProtectedRoute>
            } 
          />
          <Route 
            path="/hr/employees/add" 
            element={
              <HRProtectedRoute>
                <AddEmployee />
              </HRProtectedRoute>
            } 
          />
          <Route 
            path="/hr/attendance" 
            element={
              <HRProtectedRoute>
                <Attendance />
              </HRProtectedRoute>
            } 
          />
          
          {/* Legacy HR payroll route (keeping for backward compatibility) */}
          <Route 
            path="/hr/payroll-old" 
            element={
              <HRProtectedRoute>
                <Payroll />
              </HRProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/leaves" 
            element={
              <HRProtectedRoute>
                <LeaveManagement />
              </HRProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/reimbursements" 
            element={
              <HRProtectedRoute>
                <Reimbursement />
              </HRProtectedRoute>
            } 
          />
          <Route 
            path="/hr/org-tree" 
            element={
              <HRProtectedRoute>
                <OrgTree />
              </HRProtectedRoute>
            } 
          />

          {/* ================== PAYROLL MODULE ROUTES ================== */}
          
          {/* Main Payroll Page (All-in-one with tabs) */}
          <Route 
            path="/hr/payroll" 
            element={
              <HRProtectedRoute>
                <PayrollPage />
              </HRProtectedRoute>
            } 
          />
          
          {/* Alternative: Individual payroll routes (if you want separate pages) */}
          <Route 
            path="/payroll/dashboard" 
            element={
              <PayrollProtectedRoute>
                <PayrollDashboard />
              </PayrollProtectedRoute>
            } 
          />
          
          <Route 
            path="/payroll/salary-setup" 
            element={
              <PayrollProtectedRoute>
                <SalarySetupWithESIPF />
              </PayrollProtectedRoute>
            } 
          />
          
          <Route 
            path="/payroll/invoice-generation" 
            element={
              <PayrollProtectedRoute>
                <InvoiceGeneration />
              </PayrollProtectedRoute>
            } 
          />
          
          {/* Redirect old payroll routes to new ones */}
          <Route path="/payroll" element={<Navigate to="/hr/payroll" replace />} />
          
          {/* For backward compatibility - redirect legacy /hr/payroll to new system */}
          <Route path="/hr/payroll" element={<Navigate to="/hr/payroll" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;