// App.jsx - Cleaned, organized, no duplicates, correct protection
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
import Payroll from "../src/pages/modules/hr/pages/Payroll"; 
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

import HRAttendance from "./components/modules/hr/HRAttendance";
import JobReferral from "./pages/modules/hr/pages/JobReferral";
import JobOpeningUpdate from "./pages/modules/hr/pages/JobOpeningUpdate";

// Protected Routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const HRProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div>Loading...</div>;

  const hasHRAccess =
    user?.modules?.includes("hr") ||
    user?.role === "hr_manager" ||
    user?.role === "admin" ||
    user?.role === "main_org_admin" ||
    user?.role === "sub_org_admin" ||
    user?.role === "accountant" ||
    user?.modules?.includes("payroll") ||
    user?.role === "payroll_manager";

  return isAuthenticated && hasHRAccess ? children : <Navigate to="/dashboard" />;
};

const PayrollProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div>Loading...</div>;

  const hasPayrollAccess =
    user?.modules?.includes("payroll") ||
    user?.role === "payroll_manager" ||
    user?.role === "admin" ||
    user?.role === "main_org_admin" ||
    user?.role === "sub_org_admin" ||
    user?.role === "hr_manager" ||
    user?.role === "accountant" ||
    user?.modules?.includes("hr");

  return isAuthenticated && hasPayrollAccess ? children : <Navigate to="/dashboard" />;
};

// Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "super_admin") return <Dashboard />;
  if (user?.role === "sub_org_admin" || user?.organization_type === "sub") return <SubOrganizationDashboard />;
  if (user?.role === "employee") return <SubOrganizationDashboard />;

  return <Navigate to="/login" replace />;
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

          {/* Protected General Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

          {/* HR Module Routes */}
          <Route path="/hr/dashboard" element={<HRProtectedRoute><HRDashboard /></HRProtectedRoute>} />
          <Route path="/hr/employees" element={<HRProtectedRoute><EmployeeList /></HRProtectedRoute>} />
          <Route path="/hr/employees/add" element={<HRProtectedRoute><AddEmployee /></HRProtectedRoute>} />
          <Route path="/hr/attendance" element={<HRProtectedRoute><HRAttendance /></HRProtectedRoute>} />
          <Route path="/hr/leaves" element={<HRProtectedRoute><LeaveManagement /></HRProtectedRoute>} />
          <Route path="/hr/reimbursements" element={<HRProtectedRoute><Reimbursement /></HRProtectedRoute>} />
          <Route path="/hr/org-tree" element={<HRProtectedRoute><OrgTree /></HRProtectedRoute>} />
          <Route path="/hr/jobreferrals" element={<HRProtectedRoute><JobReferral/></HRProtectedRoute>} />
          <Route path="/hr/jobopenings" element={<HRProtectedRoute><JobOpeningUpdate/></HRProtectedRoute>} />
          
          {/* Payroll Module (New Unified Page with Tabs) */}
          <Route path="/hr/payroll" element={<HRProtectedRoute><PayrollPage /></HRProtectedRoute>} />

          {/* Optional: Separate Payroll Pages */}
          <Route path="/payroll/dashboard" element={<PayrollProtectedRoute><PayrollDashboard /></PayrollProtectedRoute>} />
          <Route path="/payroll/salary-setup" element={<PayrollProtectedRoute><SalarySetupWithESIPF /></PayrollProtectedRoute>} />
          <Route path="/payroll/invoice-generation" element={<PayrollProtectedRoute><InvoiceGeneration /></PayrollProtectedRoute>} />

          {/* Redirects */}
          <Route path="/payroll" element={<Navigate to="/hr/payroll" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;