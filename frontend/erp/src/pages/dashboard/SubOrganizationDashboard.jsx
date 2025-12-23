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
  // Only redirect if the user is completely unauthenticated
  if (!user) {
    navigate("/login", { replace: true });
    return;
  }
  const loadData = async () => {
    try {
      setLoading(true);
      const modulesData = await moduleService.getAvailableModules(user?.role);
      setModules(modulesData || []);

      const activeCount = (modulesData || []).filter((m) => m.is_active).length;
      setStats((prev) => ({
        ...prev,
        activeModules: activeCount,
      }));
    } catch (error) {
      console.error("Error loading modules:", error);
      setModules([]); // Prevent stuck loading
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
    if (window.confirm("Are you sure you want to delete this training video?")) {
      try {
        await deleteTrainingVideo(videoId);
        handleVideoUploadSuccess(); // Reuse to refresh list
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
      sales: "/sales/dashboard",
      transport: "/transport/dashboard",
      accounting: "/accounting/dashboard",
      crm: "/crm/dashboard",
      project_management: "/projects/dashboard",
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
      showAlert("Commands: help, modules, users, create user, video, training, logout, hr, inventory, sales, clear");
      return;
    }
    if (["modules", "list modules"].includes(cmd)) {
      showAlert(`You have ${stats.activeModules} active module(s).`);
      return;
    }
    if (["users", "create user", "add user"].includes(cmd)) {
      setOpenCreateUser(true);
      return;
    }
    if (["video", "training", "training video", "upload video"].includes(cmd)) {
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
    showAlert(`Unknown command: "${cmd}". Type "help" for available commands.`);
  };
  const handleCommandBarClick = () => {
    inputRef.current?.focus();
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
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20">
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

                <button
                  onClick={() => setOpenUploadVideo(true)}
                  className="bg-blue-300 hover:bg-cyan-600 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
                >
                  Training Video
                </button>

                <button
                  onClick={() => setOpenCreateUser(true)}
                  className="bg-blue-300 hover:bg-cyan-600 text-gray-950 px-4 py-2 rounded-lg font-medium transition"
                >
                  + Create User
                </button>

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
                <ModuleGrid modules={modules} onModuleClick={handleModuleClick} darkTheme />
              ) : (
                <div className="text-center py-12 text-cyan-300">
                  <p className="text-blue-300 text-lg">No Modules Assigned</p>
                  <p className="mt-2">Contact your administrator.</p>
                </div>
              )}
            </div>
          </div>

          {/* Organization Info */}
          <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">
              Sub-Organization Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><strong>Organization:</strong> {organization?.name}</p>
                <p><strong>Subdomain:</strong> {organization?.subdomain}</p>
                <p><strong>Email:</strong> {organization?.email}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Plan:</strong> {organization?.plan_tier}</p>
                <p><strong>Phone:</strong> {organization?.phone || "—"}</p>
                <p><strong>Admin:</strong> {user?.first_name} {user?.last_name}</p>
              </div>
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
          placeholder="Type command: help, hr, video, users..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
        {/* <span className="w-2 h-5 bg-green-400 inline-block animate-ping ml-1 opacity-75"></span> */}
      </div>

      {/* Feedback Toast */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono">
          {alertMessage}
        </div>
      )}

      {/* Modals */}
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