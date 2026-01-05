// src/pages/dashboard/SubOrgUserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ModuleGrid from "../../components/dashboard/ModuleGrid";
import { moduleService } from "../../services/moduleService";
import api from "../../services/api"; // axios instance

const SubOrgUserDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeModules: 0, totalUsers: 1 });
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  // Map module codes to names for display
  const moduleNameMap = {
    hr_management: "HR Management",
    inventory: "Inventory",
    accounting: "Accounting",
    crm: "CRM",
    project_management: "Project Management",
    sales: "Sales",
    transport: "Transport",
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const loadModules = async () => {
      try {
        setLoading(true);
        // Fetch user-specific modules from backend
        const response = await api.get(
          `/organizations/suborg-user/modules/`
        );
        // response.data.modules expected as ["hr_management", "inventory"]
        const userModules = response.data?.modules || [];

        // Transform to ModuleGrid-compatible objects
        const formattedModules = userModules.map((code, idx) => ({
          module_id: idx,
          code,
          name: moduleNameMap[code] || code,
          description: "",
          is_active: true,
          available_in_plans: [],
        }));

        setModules(formattedModules);
        const activeCount = formattedModules.filter((m) => m.is_active).length;
        setStats((prev) => ({ ...prev, activeModules: activeCount }));
      } catch (error) {
        console.error("Error loading modules:", error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [user, organization, navigate]);

  // Handle module click navigation
  const handleModuleClick = (module) => {
    if (!module.is_active) return;
    const routes = {
      hr_management: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      accounting: "/accounting/dashboard",
      crm: "/crm/dashboard",
      project_management: "/projects/dashboard",
      sales: "/sales/dashboard",
      transport: "/transport/dashboard",
    };
    navigate(routes[module.code] || "/");
  };

  // Terminal command handling
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    const showAlertFn = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlertFn(
        "Commands: help, modules, logout, hr, inventory, sales, accounting, crm, projects, transport, clear"
      );
      return;
    }

    if (["modules", "list modules"].includes(cmd)) {
      showAlertFn(`You have ${stats.activeModules} active module(s).`);
      return;
    }

    if (cmd === "logout") {
      logout();
      return;
    }

    if (cmd === "clear") {
      showAlertFn("Terminal cleared.");
      return;
    }

    const moduleShortcuts = {
      hr: "/hr/dashboard",
      hrmanagement: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      stock: "/inventory/dashboard",
      sales: "/sales/dashboard",
      transport: "/transport/dashboard",
      accounting: "/accounting/dashboard",
      finance: "/accounting/dashboard",
      crm: "/crm/dashboard",
      projects: "/projects/dashboard",
      project: "/projects/dashboard",
    };

    if (moduleShortcuts[cmd]) {
      navigate(moduleShortcuts[cmd]);
      return;
    }

    showAlertFn(`Unknown command: "${cmd}". Type "help" for available commands.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

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
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="bg-gray-900/30 backdrop-blur-md border-b border-cyan-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="bg-gray-800/50 p-3 rounded-lg mr-4">
                  <div className="w-8 h-8 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold">
                    {organization?.name?.charAt(0) || "S"}
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-300">
                    {organization?.name}
                  </h1>
                  <p className="text-cyan-300 mt-1">
                    Welcome back, {user?.first_name} • Sub-Organization User Dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={logout}
                  className="bg-blue-300 hover:bg-cyan-600 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Active Modules", value: stats.activeModules },
              { label: "Total Users", value: stats.totalUsers },
              { label: "Plan Tier", value: organization?.plan_tier?.toUpperCase() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6 flex items-center gap-4"
              >
                <div className="bg-cyan-900/50 p-3 rounded-lg">
                  <div className="w-10 h-10 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold">
                    {stat.label.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-cyan-400 text-sm">{stat.label}</p>
                  <p className="text-blue-300 font-bold text-2xl">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modules */}
          <div className="bg-gray-900/40 border border-cyan-800 rounded-xl">
            <div className="px-6 py-4 border-b border-cyan-800">
              <h2 className="text-2xl font-bold text-blue-300">Your Modules</h2>
            </div>
            <div className="p-6">
              {modules.length > 0 ? (
                <ModuleGrid modules={modules} onModuleClick={handleModuleClick} />
              ) : (
                <div className="text-center py-12 text-cyan-300">
                  <p className="text-blue-300 text-lg">No Modules Assigned</p>
                  <p className="mt-2">Contact your administrator.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Terminal Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center cursor-text shadow-2xl"
        onClick={handleCommandBarClick}
      >
        <span className="text-green-400 font-bold mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, hr, modules..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default SubOrgUserDashboard;
