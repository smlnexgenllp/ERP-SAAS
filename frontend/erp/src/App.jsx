// App.jsx – UPDATED: HR, Manager, TL now have full HR module access

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import api from "./services/api";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import SubOrganizationDashboard from "./pages/dashboard/SubOrganizationDashboard";
import SubOrgUserDashboard from "./pages/dashboard/SubOrgUserDashboard";
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
import DepartmentDesignationManagement from "./pages/modules/hr/pages/DepartmentDesignationManagement";
import MonthlyBudgetDashboard from "./pages/modules/finance/MonthlyBudgetDashboard";
import FinanceDashboard from "./pages/modules/finance/FinanaceDashboard";
import VendorList from './components/modules/finanace/vendor/VendorList';
import ItemCreate from "./pages/modules/inventory/ItemCreate";
import PurchaseOrderCreate from "./pages/modules/finance/PurchaseOrderCreate";
import QualityInspectionCreate from "./pages/modules/purchase/QualityInspectionCreate";
import GateEntryCreate from "./pages/modules/purchase/GateEntryCreate";
import VendorPaymentCreate from "./pages/modules/purchase/VendorPaymentCreate";
import VendorInvoiceCreate from "./pages/modules/purchase/VendorInvoiceCreate";
import GRNCreate from "./pages/modules/purchase/GRNCreate";
import PurchaseOrdersLists from "./pages/modules/finance/PurchaseOrdersLists";
import PurchaseOrderApproval from "./pages/modules/finance/PurchaseOrderApproval";

/* -------------------- ROUTE GUARDS -------------------- */

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// HR Module Access: HR Manager, Manager, Team Lead, Admin, Org Admins
const HRProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  const userRole = user?.org_role || user?.role; // Prefer org_role (HR Manager, Admin, etc.)

  const hasHRAccess = [
    "HR Manager",
    "Manager",
    "Team Lead",
    "Admin", // From OrganizationUser
    "main_org_admin",
    "sub_org_admin",
    "super_admin",
    "MD",
  ].includes(userRole);

  return isAuthenticated && hasHRAccess ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// Payroll Access: Similar roles + Accountant
const PayrollProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  const userRole = user?.org_role || user?.role;

  const hasPayrollAccess = [
    "HR Manager",
    "Manager",
    "Team Lead",
    "Admin",
    "main_org_admin",
    "sub_org_admin",
    "super_admin",
    "MD",
    "accountant", // if you have this role
  ].includes(userRole);

  return isAuthenticated && hasPayrollAccess ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

/* -------------------- DASHBOARD ROUTER -------------------- */


const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const [orgUserRole, setOrgUserRole] = useState(null);

  useEffect(() => {
    api
      .get("/organizations/suborg-user/role/")
      .then(res => setOrgUserRole(res.data?.role))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Super Admin → Main Dashboard
  if (user?.role === "super_admin") return <Dashboard />;

  // Main Org Admin → Main Dashboard
  if (user?.role === "main_org_admin") return <Dashboard />;

  // Sub Org Admin → Sub Organization Dashboard
  if (user?.role === "sub_org_admin") return <SubOrganizationDashboard />;

  // Accounts Manager → Finance Dashboard
  if (orgUserRole === "Accounts Manager") return <FinanceDashboard />;

  // HR Roles → HR Dashboard (even if user role is "user" or "employee")
  const hrRoles = ["HR Manager", "Manager", "Team Lead", "Admin"];
  if (orgUserRole && hrRoles.includes(orgUserRole)) return <HRDashboard />;

  // Regular Employee → Simple SubOrgUser Dashboard
  if (user?.role === "employee" || user?.role === "user") {
    return <SubOrgUserDashboard />;
  }

  // Fallback → Login
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
          {/* -------- HR MODULE (Now accessible by HR, Manager, TL) -------- */}
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
                <HRAttendance />
              </HRProtectedRoute>
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
          <Route
            path="/hr/jobreferrals"
            element={
              <HRProtectedRoute>
                <JobReferral />
              </HRProtectedRoute>
            }
          />
          <Route
            path="/hr/jobopenings"
            element={
              <HRProtectedRoute>
                <JobOpeningUpdate />
              </HRProtectedRoute>
            }
          />
          <Route
            path="/hr/departments"
            element={
              <HRProtectedRoute>
                <DepartmentDesignationManagement />
              </HRProtectedRoute>
            }
          />
          {/* -------- PAYROLL -------- */}
          <Route
            path="/hr/payroll"
            element={
              <HRProtectedRoute>
                <PayrollPage />
              </HRProtectedRoute>
            }
          />
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
          {/* -------- OTHER HR FEATURES -------- */}
          <Route
            path="/hr/tasks"
            element={
              <HRProtectedRoute>
                <TaskDashboard />
              </HRProtectedRoute>
            }
          />
          <Route
            path="/hr/chat"
            element={
              <HRProtectedRoute>
                <ChatPage />
              </HRProtectedRoute>
            }
          />
          <Route path="/finance/vendors" element={<VendorList />} />
          {/* -------- REDIRECTS -------- */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/payroll"
            element={<Navigate to="/hr/payroll" replace />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/finance/budgets" element={<MonthlyBudgetDashboard/>} />
          <Route path="/items/create" element={<ItemCreate />} />
          <Route path="/purchase-orders" element={<PurchaseOrderCreate />} />
          <Route path="/vendor-payments/create" element={<VendorPaymentCreate/>} />
          <Route path="/vendor-invoices/create" element={<VendorInvoiceCreate/>} />
          <Route path="/grns/create" element={<GRNCreate/>} />
          <Route path="/QC" element={<QualityInspectionCreate/>}/>
          <Route path="/gate-entry" element={<GateEntryCreate/>}/>
          <Route path="/purchase-orders-list" element={<PurchaseOrdersLists/>}/>
          <Route path="/pending-PO" element={<PurchaseOrderApproval/>}/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
