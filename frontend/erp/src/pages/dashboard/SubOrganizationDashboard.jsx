import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { moduleService } from "../../services/moduleService";
import ModuleGrid from "../../components/dashboard/ModuleGrid";
import CreateSubOrgUserModal from "../dashboard/CreateSubOrgUser";

const SubOrganizationDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateUser, setOpenCreateUser] = useState(false);

  const [stats, setStats] = useState({
    activeModules: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (!user || !organization) {
      navigate("/login");
      return;
    }
    loadDashboardData();
  }, [user, organization, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const modulesData = await moduleService.getAvailableModules(user?.role);
      setModules(modulesData);

      const activeModulesCount = modulesData.filter((m) => m.is_active).length;
      setStats({
        activeModules: activeModulesCount,
        totalUsers: 1,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    if (!module.is_active) return;
    const routes = {
      hr_management: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      sales: "/sales/dashboard",
      transport: "/transport/dashboard",
      accounting: "/accounting/dashboard",
      crm: "/crm/dashboard",
      project_management: "/projects/dashboard",
    };
    navigate(routes[module.code] || "/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono">
      {/* Header */}
      <div className="bg-gray-900/30 backdrop-blur-md border-b border-cyan-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-gray-800/50 p-3 rounded-lg mr-4">
                <div className="w-8 h-8 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold">
                  {organization?.name?.charAt(0) || "S"}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-pink-400">
                  {organization?.name}
                </h1>
                <p className="text-cyan-300 mt-1">
                  Welcome back, {user?.first_name} • Sub-Organization Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-cyan-400">Plan</p>
                <p className="font-semibold text-cyan-300 capitalize">
                  {organization?.plan_tier}
                </p>
              </div>

              {/* NEW: Create User Button */}
              <button
                onClick={() => setOpenCreateUser(true)}
                className="bg-pink-500 hover:bg-pink-600 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
              >
                + Create User
              </button>

              <button
                onClick={logout}
                className="bg-cyan-600 hover:bg-red-700 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              label: "Active Modules",
              value: stats.activeModules,
              color: "cyan",
            },
            { label: "Total Users", value: stats.totalUsers, color: "cyan" },
            {
              label: "Plan Tier",
              value: organization?.plan_tier,
              color: "cyan",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gray-900/40 border border-cyan-800 rounded-xl shadow p-6 flex items-center gap-4 hover:shadow-gray-800/50 transition`}
            >
              <div className={`bg-gray-900/30 p-3 rounded-lg`}>
                <div
                  className={`w-10 h-10 bg-${stat.color}-700 rounded flex items-center justify-center text-gray-950 font-bold`}
                >
                  {stat.label.charAt(0)}
                </div>
              </div>
              <div>
                <p className="text-cyan-400 text-sm">{stat.label}</p>
                <p className="text-pink-400 font-bold text-2xl">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modules Section */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow">
          <div className="px-6 py-4 border-b border-cyan-800">
            <h2 className="text-2xl font-bold text-pink-400">Your Modules</h2>
            <p className="text-cyan-300 mt-1">
              Access and manage your organization's modules
            </p>
          </div>
          <div className="p-6">
            {modules.length > 0 ? (
              <ModuleGrid
                modules={modules}
                onModuleClick={handleModuleClick}
                darkTheme
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-cyan-300 text-2xl font-bold">
                    M
                  </div>
                </div>
                <h3 className="text-lg font-medium text-pink-400 mb-2">
                  No Modules Assigned
                </h3>
                <p className="text-cyan-300 mb-6">
                  Your organization doesn't have access to any modules yet.
                  Please contact your main organization administrator.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-pink-400">
            Sub-Organization Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-cyan-300">
            <div>
              <p>
                <strong>Organization:</strong> {organization?.name}
              </p>
              <p>
                <strong>Subdomain:</strong> {organization?.subdomain}
              </p>
              <p>
                <strong>Email:</strong> {organization?.email}
              </p>
            </div>
            <div>
              <p>
                <strong>Plan:</strong> {organization?.plan_tier}
              </p>
              <p>
                <strong>Phone:</strong> {organization?.phone || "Not provided"}
              </p>
              <p>
                <strong>Admin:</strong> {user?.first_name} {user?.last_name}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* NEW: Create User Modal */}
      <CreateSubOrgUserModal
        isOpen={openCreateUser}
        onClose={() => setOpenCreateUser(false)}
        subOrgId={organization?.id}
        onSuccess={() => console.log("User created")}
      />
    </div>
  );
};

export default SubOrganizationDashboard;
