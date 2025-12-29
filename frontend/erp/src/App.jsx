// App.jsx – FIXED (no redirect loops, production-safe)

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
import UserDashboard from "./pages/dashboard/UserDashboard";
import SubOrgLogin from "./pages/auth/SubOrgLogin";
import EmployeeLogin from "./pages/modules/hr/pages/EmployeeLogin";

import HRDashboard from "./pages/modules/hr/HRDashboard";
import EmployeeList from "./pages/modules/hr/pages/EmployeeList";
import AddEmployee from "./pages/modules/hr/pages/AddEmployee";
import PayrollPage from "./pages/modules/payroll/PayrollPage";
import PayrollDashboard from "./components/dashboard/payroll/payrollDashboard";
import SalarySetupWithESIPF from "./components/modules/payroll/SalarySetup";
import InvoiceGeneration from "./components/modules/payroll/InvoiceGeneration";
import MyProfile from "./pages/modules/hr/MyProfile";
import OrgTree from "./pages/modules/hr/pages/OrgTree";
import LeaveManagement from "./pages/modules/hr/pages/LeaveManagement";
import Reimbursement from "./pages/modules/hr/pages/Reimbursement";
import HRAttendance from "./components/modules/hr/HRAttendance";
import JobReferral from "./pages/modules/hr/pages/JobReferral";
import JobOpeningUpdate from "./pages/modules/hr/pages/JobOpeningUpdate";
import TaskDashboard from "./pages/dashboard/TaskDashboard";
import ChatPage from "./pages/modules/hr/ChatPage";
/* -------------------- ROUTE GUARDS -------------------- */

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const HRProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>;

  const hasHRAccess =
    user?.modules?.includes("hr") ||
    ["hr_manager", "admin", "main_org_admin", "sub_org_admin", "accountant","user"].includes(user?.role);

  return isAuthenticated && hasHRAccess ? children : <Navigate to="/dashboard" replace />;
};

const PayrollProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>;

  const hasPayrollAccess =
    user?.modules?.includes("payroll") ||
    ["payroll_manager", "admin", "main_org_admin", "sub_org_admin", "hr_manager", "accountant"].includes(user?.role);

  return isAuthenticated && hasPayrollAccess ? children : <Navigate to="/dashboard" replace />;
};

/* -------------------- DASHBOARD ROUTER -------------------- */

const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "super_admin") return <Dashboard />;
  if (user?.role === "sub_org_admin" || user?.organization_type === "sub") return <SubOrganizationDashboard />;
  if (user?.role === "employee") return <SubOrganizationDashboard />;

  return <Navigate to="/login" replace />;
};


/* -------------------- APP -------------------- */

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* -------- PUBLIC -------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/employee_login" element={<EmployeeLogin />} />
          <Route path="/suborglogin" element={<SubOrgLogin />} />

          {/* -------- DASHBOARD -------- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
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

          {/* -------- HR MODULE -------- */}
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

          {/* -------- PAYROLL -------- */}
          <Route path="/hr/payroll" element={<HRProtectedRoute><PayrollPage /></HRProtectedRoute>} />
          <Route path="/payroll/dashboard" element={<PayrollProtectedRoute><PayrollDashboard /></PayrollProtectedRoute>} />
          <Route path="/payroll/salary-setup" element={<PayrollProtectedRoute><SalarySetupWithESIPF /></PayrollProtectedRoute>} />
          <Route path="/payroll/invoice-generation" element={<PayrollProtectedRoute><InvoiceGeneration /></PayrollProtectedRoute>} />
          

          <Route path="/hr/tasks" element={<HRProtectedRoute><TaskDashboard /></HRProtectedRoute>} />
          <Route path="/hr/chat" element={<HRProtectedRoute><ChatPage /></HRProtectedRoute>} />


          {/* -------- REDIRECTS -------- */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/payroll" element={<Navigate to="/hr/payroll" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
