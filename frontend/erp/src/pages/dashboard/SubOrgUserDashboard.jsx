import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ModuleGrid from "../../components/dashboard/ModuleGrid";
import api from "../../services/api";
import {
  FiPlus,
  FiLogOut,
  FiUser,
  FiBriefcase
} from "react-icons/fi";

const SubOrgUserDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  /* ================= ROLE ================= */
  const [userRole, setUserRole] = useState(user?.org_role || user?.role);
  const isMD = userRole === "MD";

  const moduleNameMap = {
    hr_management: "HR Management",
    inventory: "Inventory",
    finance: "Finance",
    crm: "CRM",
    project_management: "Project Management",
    sales: "Sales",
    transport: "Transport",
  };

  /* ================= LOAD MODULES ================= */
  useEffect(() => {
    if (!user) return navigate("/login");

    const loadModules = async () => {
      try {
        const res = await api.get("/organizations/suborg-user/modules/");
        const formatted = (res.data?.modules || []).map((code, idx) => ({
          module_id: idx,
          code,
          name: moduleNameMap[code] || code,
          is_active: true,
        }));
        setModules(formatted);
      } catch {
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [user, navigate]);

  /* ================= FETCH ROLE ================= */
  useEffect(() => {
    api
      .get("/organizations/suborg-user/role/")
      .then(res => setUserRole(res.data?.role))
      .catch(() => { });
  }, []);

  /* ================= TERMINAL ================= */
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.toLowerCase().trim();
    setCommand("");

    const notify = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    if (cmd === "logout") return logout();
    if (cmd === "help")
      return notify("Commands: hr, inventory, sales, finance, crm, projects, logout");

    const routes = {
      hr: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      sales: "/sales/dashboard",
      finance: "/accounting/dashboard",
      crm: "/crm/dashboard",
      projects: "/projects/dashboard",
    };

    if (routes[cmd]) return navigate(routes[cmd]);

    notify(`Unknown command: ${cmd}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">
        Loading Dashboard...
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono pb-24">

      {/* ================= NAV BAR ================= */}
      <div className="bg-gray-900 border-b border-cyan-800 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-300">
            {organization?.name}
          </h1>
          <p className="text-cyan-400 text-sm">
            Plan: {organization?.plan_tier?.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="flex items-center gap-2 text-blue-300 font-semibold">
              <FiUser /> {user?.first_name} {user?.last_name}
            </p>
            <p className="flex items-center gap-2 text-cyan-400 text-sm">
              <FiBriefcase /> Role: {userRole}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* ================= MODULES ================= */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-300">
          Assigned Modules
        </h2>

        <ModuleGrid
          modules={modules}
          onModuleClick={(m) => {
            const target = `/${m.code}/dashboard`;
            console.log("Clicked module:", m.code, "→ navigating to:", target);
            navigate(target);
          }}
        />
      </div>

      {/* ================= MD BUDGET ACCESS ================= */}
      {isMD && (
        <div className="mx-8 mb-8 bg-gray-900/40 border border-cyan-800 rounded-xl p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-blue-300">
              Monthly Budget Management
            </h3>
            <p className="text-cyan-400 text-sm mt-1">
              Create, review & release organizational budgets
            </p>
          </div>

          <button
            onClick={() => navigate("/finance/budgets")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <FiPlus /> Manage Budgets
          </button>
        </div>
      )}

      {/* ================= TERMINAL ================= */}
      <div className="fixed bottom-0 w-full bg-gray-900 border-t border-cyan-500 px-6 py-3 flex">
        <span className="text-green-400 mr-2">&gt;</span>
        <input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          className="flex-1 bg-transparent outline-none text-green-400"
          placeholder="Type command (help)..."
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 border border-cyan-500 px-6 py-2 rounded-lg shadow-xl">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default SubOrgUserDashboard;
