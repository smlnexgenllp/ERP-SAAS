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


// ----- FINANCE MODULE -----
import FinanceDashboard from "./pages/modules/finance/FinanceDashboard";
import SidebarLayout from "./pages/modules/finance/layouts/SidebarLayout";
import CompanySetup from "./pages/modules/finance/CompanySetup";
import FinancialYearSetup from "./pages/modules/finance/FinancialYearSetup";
import ChartOfAccounts from "./pages/modules/finance/ChartOfAccounts";
import OpeningBalances from "./pages/modules/finance/OpeningBalances";
import MasterData from "./pages/modules/finance/MasterData";
import TransactionEntry from "./pages/modules/finance/TransactionEntry";
import ReportsDashboard from "./pages/modules/finance/ReportsDashboard";





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


const FinanceProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div>Loading...</div>;

  const hasFinanceAccess =
    user?.modules?.includes("finance") ||
    ["finance_manager", "admin", "main_org_admin", "sub_org_admin", "accountant"].includes(user?.role);

  return isAuthenticated && hasFinanceAccess ? children : <Navigate to="/dashboard" replace />;
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

  if (user?.role === "main_org_admin") return <Dashboard />;
  if (user?.role === "sub_org_admin" || user?.organization_type === "sub") return <SubOrganizationDashboard />;
  if (user?.role === "employee") return <UserDashboard />;

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
           <Route path="/finance/*" element={<Navigate to="/finance" replace />} />


          
          {/* ======== FINANCE MODULE (with Sidebar Layout) ======== */}
          <Route element={<FinanceProtectedRoute><SidebarLayout /></FinanceProtectedRoute>}>
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/company-setup" element={<CompanySetup />} />
            <Route path="/finance/financial-year-setup" element={<FinancialYearSetup />} />
            <Route path="/finance/chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="/finance/opening-balances" element={<OpeningBalances />} />
            <Route path="/finance/master-data" element={<MasterData />} />
            <Route path="/finance/transaction-entry" element={<TransactionEntry />} />
            <Route path="/finance/reports" element={<ReportsDashboard />} />
          </Route>
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;