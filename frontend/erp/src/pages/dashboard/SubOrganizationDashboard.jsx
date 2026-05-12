// ONLY THEME UPDATED
// ALIGNMENT, SIZE, STRUCTURE NOT CHANGED

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { moduleService } from "../../services/moduleService";
import ModuleGrid from "../../components/dashboard/ModuleGrid";
import CreateSubOrgUserModal from "../dashboard/CreateSubOrgUser";
import UploadTrainingVideoModal from "../../../src/pages/modules/hr/components/UploadTrainingVideoModal";
import {
  fetchTrainingVideos,
  deleteTrainingVideo,
} from "../modules/hr/api/hrApi";

const SubOrganizationDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openUploadVideo, setOpenUploadVideo] = useState(false);

  const [trainingVideos, setTrainingVideos] = useState([]);

  const [stats, setStats] = useState({
    activeModules: 0,
    totalUsers: 1,
  });

  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const modulesData = await moduleService.getAvailableModules(
          user?.role
        );

        setModules(modulesData || []);

        const activeCount = (modulesData || []).filter(
          (m) => m.is_active
        ).length;

        setStats((prev) => ({
          ...prev,
          activeModules: activeCount,
        }));
      } catch (error) {
        console.error("Error loading modules:", error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    const loadVideos = async () => {
      try {
        const response = await fetchTrainingVideos();
        setTrainingVideos(response.data || []);
      } catch (error) {
        console.error("Error loading training videos:", error);
        setTrainingVideos([]);
      }
    };

    loadData();
    loadVideos();
  }, [user, navigate]);

  const handleVideoUploadSuccess = async () => {
    try {
      const response = await fetchTrainingVideos();
      setTrainingVideos(response.data || []);
    } catch (error) {
      console.error("Error reloading videos:", error);
    }
  };

  const handleVideoDelete = async (videoId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this training video?"
      )
    ) {
      try {
        await deleteTrainingVideo(videoId);
        handleVideoUploadSuccess();
      } catch (error) {
        alert("Failed to delete video.");
      }
    }
  };

  const handleModuleClick = (module) => {
    if (!module.is_active) return;

    const routes = {
      hr_management: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      sale: "/sales/dashboard",
      transport: "/transport/dashboard",
      finance: "/accounting/dashboard",
      crm: "/crm/dashboard",
      project_management: "/projects/dashboard",
      manufacture: "/manufacturing/dashboard",
    };

    navigate(routes[module.code] || "/");
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const cmd = command.trim().toLowerCase();

    setCommand("");

    const showAlert = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);

      setTimeout(() => setShowAlert(false), 3000);
    };

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert(
        "Commands: help, modules, users, create user, video, training, logout, hr, inventory, sales, clear"
      );
      return;
    }

    if (["modules", "list modules"].includes(cmd)) {
      showAlert(
        `You have ${stats.activeModules} active module(s).`
      );
      return;
    }

    if (["users", "create user", "add user"].includes(cmd)) {
      setOpenCreateUser(true);
      return;
    }

    if (
      ["video", "training", "training video", "upload video"].includes(
        cmd
      )
    ) {
      setOpenUploadVideo(true);
      return;
    }

    if (cmd === "logout") {
      logout();
      return;
    }

    if (cmd === "clear") {
      showAlert("Terminal cleared.");
      return;
    }

    const moduleShortcuts = {
      hr: "/hr/dashboard",
      hrmanagement: "/hr/dashboard",
      inventory: "/inventory/dashboard",
      stock: "/stock/dashboard",
      sales: "/sales/dashboard",
      transport: "/transport/dashboard",
      finance: "/accounting/dashboard",
      crm: "/crm/dashboard",
      projects: "/projects/dashboard",
      project: "/projects/dashboard",
      manufacturing: "/manufacturing/dashboard",
    };

    if (moduleShortcuts[cmd]) {
      navigate(moduleShortcuts[cmd]);
      return;
    }

    showAlert(
      `Unknown command: "${cmd}". Type "help" for available commands.`
    );
  };

  const handleCommandBarClick = () => {
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-zinc-500 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20">
        
        {/* HEADER */}
        <div className="bg-white border-b border-zinc-200 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              
              <div className="flex items-center">
                <div className="bg-zinc-100 p-3 rounded-2xl mr-4 border border-zinc-200">
                  <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold">
                    {organization?.name?.charAt(0) || "S"}
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-zinc-900">
                    {organization?.name}
                  </h1>

                  <p className="text-zinc-500 mt-1">
                    Welcome back, {user?.first_name} •
                    Sub-Organization Dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Plan</p>

                  <p className="font-semibold text-zinc-900 capitalize">
                    {organization?.plan_tier}
                  </p>
                </div>

                <button
                  onClick={() => setOpenUploadVideo(true)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-4 py-2 rounded-2xl font-medium transition"
                >
                  Training Video
                </button>

                <button
                  onClick={() => setOpenCreateUser(true)}
                  className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-2xl font-medium transition"
                >
                  + Create User
                </button>

                <button
                  onClick={logout}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-4 py-2 rounded-2xl font-medium transition"
                >
                  Logout
                </button>

                {/* <button
                  onClick={() => navigate("/crm-test")}
                  className="w-auto bg-zinc-900 hover:bg-black text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test CRM
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Active Modules",
                value: stats.activeModules,
              },
              {
                label: "Total Users",
                value: stats.totalUsers,
              },
              {
                label: "Plan Tier",
                value: organization?.plan_tier?.toUpperCase(),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-center gap-4 shadow-sm"
              >
                <div className="bg-zinc-100 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold">
                    {stat.label.charAt(0)}
                  </div>
                </div>

                <div>
                  <p className="text-zinc-500 text-sm">
                    {stat.label}
                  </p>

                  <p className="text-zinc-900 font-bold text-2xl">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* MODULES */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200">
              <h2 className="text-2xl font-bold text-zinc-900">
                Your Modules
              </h2>
            </div>

            <div className="p-6">
              {modules.length > 0 ? (
                <ModuleGrid
                  modules={modules}
                  onModuleClick={handleModuleClick}
                  darkTheme={false}
                />
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <p className="text-zinc-900 text-lg font-semibold">
                    No Modules Assigned
                  </p>

                  <p className="mt-2">
                    Contact your administrator.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ORGANIZATION INFO */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              Sub-Organization Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 text-zinc-700">
                <p>
                  <strong>Organization:</strong>{" "}
                  {organization?.name}
                </p>

                <p>
                  <strong>Subdomain:</strong>{" "}
                  {organization?.subdomain}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {organization?.email}
                </p>
              </div>

              <div className="space-y-2 text-zinc-700">
                <p>
                  <strong>Plan:</strong>{" "}
                  {organization?.plan_tier}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {organization?.phone || "—"}
                </p>

                <p>
                  <strong>Admin:</strong>{" "}
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* COMMAND BAR */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-zinc-200 px-6 py-4 flex items-center cursor-text shadow-2xl"
        onClick={handleCommandBarClick}
      >
        <span className="text-zinc-900 font-bold mr-3">
          &gt;
        </span>

        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, hr, video, users..."
          className="flex-1 bg-transparent text-zinc-700 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {/* TOAST */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 text-zinc-800 px-6 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {alertMessage}
        </div>
      )}

      {/* MODALS */}
      <CreateSubOrgUserModal
        isOpen={openCreateUser}
        onClose={() => setOpenCreateUser(false)}
        subOrgId={organization?.id}
        onSuccess={() => console.log("User created")}
      />

      <UploadTrainingVideoModal
        isOpen={openUploadVideo}
        onClose={() => setOpenUploadVideo(false)}
        videos={trainingVideos}
        onDeleteVideo={handleVideoDelete}
        onVideoUploadSuccess={handleVideoUploadSuccess}
      />
    </div>
  );
};

export default SubOrganizationDashboard;
