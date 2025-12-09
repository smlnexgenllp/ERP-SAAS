import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { organizationService } from "../../services/organizationService";
import { moduleService } from "../../services/moduleService";
import { Building } from "lucide-react";

import SubOrganizationModal from "../../components/dashboard/SubOrganizationModal";
import ModuleGrid from "../../components/dashboard/ModuleGrid";

const Dashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [subOrganizations, setSubOrganizations] = useState([]);
  const [stats, setStats] = useState({
    totalSubOrgs: 0,
    activeModules: 0,
    totalUsers: 0,
  });
  const [showSubOrgModal, setShowSubOrgModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !organization) {
      navigate("/login", { replace: true });
    }
  }, [user, organization]);

  useEffect(() => {
    if (!user || !organization) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [modulesData, subOrgsData, statsData] = await Promise.all([
          moduleService.getAvailableModules(),
          organizationService.getSubOrganizations(),
          organizationService.getDashboardStats(),
        ]);

        setModules(modulesData || []);
        setSubOrganizations(subOrgsData || []);
        setStats(
          statsData || { totalSubOrgs: 0, activeModules: 0, totalUsers: 0 }
        );
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, organization]);

  const handleModuleClick = (module) => {
    if (module.is_active && module.base_url) {
      navigate(module.base_url);
    }
  };

  const handleSubOrgCreated = () => {
    setShowSubOrgModal(false);
    organizationService.getSubOrganizations().then(setSubOrganizations);
    organizationService.getDashboardStats().then(setStats);
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
      {/* HEADER */}
      <div className="bg-gray-900/30 backdrop-blur-md border-b border-cyan-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-gray-800/50 p-3 rounded-lg mr-4">
                <div className="w-8 h-8 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold">
                  {organization?.name?.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-pink-400">
                  {organization?.name}
                </h1>
                <p className="text-cyan-300 mt-1">
                  Welcome back, {user?.first_name} • Main Dashboard
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="bg-cyan-600 hover:bg-red-700 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Sub Organizations", value: stats.totalSubOrgs },
            { label: "Active Modules", value: stats.activeModules },
            { label: "Total Users", value: stats.totalUsers },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow hover:shadow-gray-800/50 transition p-6 flex items-center gap-4"
            >
              <div className="bg-gray-900/30 p-3 rounded-lg">
                <div className="w-10 h-10 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold">
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

        {/* MODULES SECTION */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow">
          <div className="px-6 py-4 border-b border-cyan-800">
            <h2 className="text-2xl font-bold text-pink-400">
              Available Modules
            </h2>
            <p className="text-cyan-300 mt-1">
              Manage and access your organization's modules
            </p>
          </div>

          <div className="p-6">
            <ModuleGrid
              modules={modules}
              onModuleClick={handleModuleClick}
              darkTheme
            />
          </div>
        </div>

        {/* SUB ORGANIZATION SE CTION */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow">
          <div className="flex justify-between items-center px-6 py-4 border-b border-cyan-800">
            <div>
              <h2 className="text-2xl font-bold text-pink-400">
                Sub Organizations
              </h2>
              <p className="text-cyan-300 mt-1">
                Manage sub-organizations and their module access
              </p>
            </div>
            <button
              onClick={() => setShowSubOrgModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-gray-950 px-6 py-2 rounded-lg font-medium transition"
            >
              Create Sub Organization
            </button>
          </div>

          {subOrganizations.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full text-cyan-300">
                <thead className="bg-gray-900/60 border-b border-cyan-800">
                  <tr>
                    {[
                      "Organization",
                      "Plan",
                      "Active Modules",
                      "Users",
                      "Status",
                      "Actions",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-cyan-400 uppercase"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800">
                  {subOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-900/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-pink-300">
                          {org.name}
                        </div>
                        <div className="text-cyan-400 text-sm">
                          {org.subdomain}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded bg-gray-800 border border-cyan-700 text-pink-300">
                          {org.plan_tier}
                        </span>
                      </td>

                      <td className="px-6 py-4">{org.active_modules_count}</td>
                      <td className="px-6 py-4">{org.user_count}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            org.is_active
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {org.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            navigate(`/sub-organizations/${org.id}`)
                          }
                          className="text-cyan-400 hover:text-pink-400"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-pink-400">
                No Sub Organizations
              </h3>
              <p className="text-cyan-300 mt-2">
                Create your first sub-organization to start managing modules.
              </p>
            </div>
          )}
        </div>
      </main>

      {showSubOrgModal && (
        <SubOrganizationModal
          onClose={() => setShowSubOrgModal(false)}
          onSuccess={handleSubOrgCreated}
          availableModules={modules}
        />
      )}
    </div>
  );
};

export default Dashboard;
