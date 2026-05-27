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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-600 text-xl">
        Loading Dashboard...
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 pb-24">

      {/* ================= NAV BAR ================= */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {organization?.name}
          </h1>
          <p className="text-zinc-500 text-sm">
            Plan: {organization?.plan_tier?.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="flex items-center gap-2 text-zinc-800 font-semibold">
              <FiUser /> {user?.first_name} {user?.last_name}
            </p>
            <p className="flex items-center gap-2 text-zinc-500 text-sm">
              <FiBriefcase /> Role: {userRole}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-xl text-white font-medium transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* ================= MODULES ================= */}
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-8 text-zinc-900">
          Assigned Modules
        </h2>

        <ModuleGrid
          modules={modules}
          onModuleClick={(m) => {
            const target = `/${m.code}/dashboard`;
            navigate(target);
          }}
        />
      </div>

      {/* ================= MD BUDGET ACCESS ================= */}
      {isMD && (
        <div className="mx-8 mb-8 bg-white border border-zinc-200 rounded-3xl p-6 flex justify-between items-center shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">
              Monthly Budget Management
            </h3>
            <p className="text-zinc-600 text-sm mt-1">
              Create, review & release organizational budgets
            </p>
          </div>

          <button
            onClick={() => navigate("/finance/budgets")}
            className="bg-zinc-900 hover:bg-black px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 transition"
          >
            <FiPlus /> Manage Budgets
          </button>
        </div>
      )}

      {/* ================= TERMINAL ================= */}
      <div className="fixed bottom-0 w-full bg-white border-t border-zinc-200 px-6 py-4 flex items-center shadow-2xl z-50">
        <span className="text-zinc-400 mr-3 font-bold text-xl">&gt;</span>
        <input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          className="flex-1 bg-transparent outline-none text-zinc-700 placeholder-zinc-400"
          placeholder="Type command (help)..."
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 px-6 py-3 rounded-2xl shadow-xl text-zinc-800 z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default SubOrgUserDashboard;