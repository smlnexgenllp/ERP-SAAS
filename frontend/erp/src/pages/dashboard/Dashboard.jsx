import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { organizationService } from "../../services/organizationService";
import { moduleService } from "../../services/moduleService";
import { Building, Plus } from "lucide-react";

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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {organization?.name?.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">
                  {organization?.name}
                </h1>
                <p className="text-zinc-600 mt-1">
                  Welcome back, {user?.first_name} • Main Dashboard
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="bg-zinc-900 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[
    { label: "Sub Organizations", value: stats.totalSubOrgs },
    { label: "Active Modules", value: stats.activeModules },
    { label: "Total Users", value: stats.totalUsers },
  ].map((stat) => (
    <div
      key={stat.label}
      className="bg-white border border-zinc-200 rounded-xl shadow hover:shadow-lg transition p-6 flex items-center gap-4"
    >
      <div className="bg-emerald-100 p-3 rounded-lg">
        <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">
          {stat.label.charAt(0)}
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-sm">{stat.label}</p>
        <p className="text-zinc-900 font-bold text-2xl">{stat.value}</p>
      </div>
    </div>
  ))}
</div>

        {/* MODULES SECTION */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-100">
            <h2 className="text-2xl font-semibold text-zinc-900">Available Modules</h2>
            <p className="text-zinc-600 mt-1">
              Manage and access your organization's modules
            </p>
          </div>

          <div className="p-8">
            <ModuleGrid
              modules={modules}
              onModuleClick={handleModuleClick}
            />
          </div>
        </div>

        {/* SUB ORGANIZATIONS SECTION */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-100">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">Sub Organizations</h2>
              <p className="text-zinc-600 mt-1">
                Manage sub-organizations and their module access
              </p>
            </div>
            <button
              onClick={() => setShowSubOrgModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              Create Sub Organization
            </button>
          </div>

          {subOrganizations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
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
                        className="px-8 py-5 text-left text-sm font-semibold text-zinc-600 uppercase tracking-wider"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {subOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-8 py-6">
                        <div className="font-semibold text-zinc-900">{org.name}</div>
                        <div className="text-sm text-zinc-500">{org.subdomain}</div>
                      </td>

                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 text-xs font-medium rounded-2xl bg-blue-100 text-blue-700">
                          {org.plan_tier}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-zinc-700 font-medium">
                        {org.active_modules_count}
                      </td>
                      <td className="px-8 py-6 text-zinc-700 font-medium">
                        {org.user_count}
                      </td>

                      <td className="px-8 py-6">
                        <span
                          className={`px-4 py-1.5 text-xs font-semibold rounded-2xl ${
                            org.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {org.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <button
                          onClick={() => navigate(`/sub-organizations/${org.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium transition"
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building className="w-12 h-12 text-zinc-400" />
              </div>
              <h3 className="text-2xl font-semibold text-zinc-900">No Sub Organizations Yet</h3>
              <p className="text-zinc-600 mt-3 max-w-md mx-auto">
                Create your first sub-organization to start managing modules.
              </p>
              <button
                onClick={() => setShowSubOrgModal(true)}
                className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-medium hover:bg-emerald-700 transition"
              >
                Create First Sub Organization
              </button>
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