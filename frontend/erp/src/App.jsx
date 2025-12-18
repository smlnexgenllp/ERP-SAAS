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
import Payroll from "../src/pages/modules/hr/pages/Payroll";
import EmployeeLogin from "./pages/modules/hr/pages/EmployeeLogin";
import MyProfile from "./pages/modules/hr/MyProfile";
import OrgTree from "./pages/modules/hr/pages/OrgTree";
import LeaveManagement from "./pages/modules/hr/pages/LeaveManagement";
import UserDashboard from "./pages/dashboard/UserDashboard";
import SubOrgLogin from "./pages/auth/SubOrgLogin";
import Reimbursement from "./pages/modules/hr/pages/Reimbursement";
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
  const hasHRAccess = user?.modules?.includes('hr') || 
                     user?.role === 'hr_manager' || 
                     user?.role === 'admin' ||
                     user?.role === 'main_org_admin';
  
  return isAuthenticated && hasHRAccess ? children : <Navigate to="/dashboard" />;
};

// Dashboard Router - decides which dashboard to show
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "main_org_admin") {
    return <Dashboard />;
  } else if (user?.role === "sub_org_admin") {
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* HR Module */}
          <Route path="/hr/employees" element={<EmployeeList />} />
          <Route path="/hr/employees/add" element={<AddEmployee />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/employee_login" element={<EmployeeLogin />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/hr/leaves" element={<LeaveManagement/>} />
          <Route path="/users" element={<UserDashboard/>} />
          <Route path="/hr/reimbursements" element={<Reimbursement/>} />

          {/* <Route path="/hr/list" element={<EmployeeList/>} /> */}

          {/* Module Routes - Add your module routes here */}
          <Route path="/hr/org-tree" element={<OrgTree />} />
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path='/suborglogin' element={<SubOrgLogin/>}/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
