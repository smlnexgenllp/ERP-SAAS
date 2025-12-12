import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  LayoutGrid,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await api.get("/organizations/suborg-modules/");
      setModules(response.data.modules);
    } catch (error) {
      console.error("Module fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    HR: <Users className="h-5 w-5" />,
    LEAVE: <Calendar className="h-5 w-5" />,
    PAYROLL: <DollarSign className="h-5 w-5" />,
    DOCUMENTS: <FileText className="h-5 w-5" />,
    DEFAULT: <LayoutGrid className="h-5 w-5" />
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center text-lg">
        Loading Modules...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-2xl p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Sub-Org Panel</h2>

        <nav className="space-y-2">
          {modules.length === 0 && (
            <p className="text-sm text-gray-500">No modules assigned</p>
          )}

          {modules.map((module) => (
            <button
              key={module.code}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-200 transition"
              onClick={() => navigate(`/suborg/${module.code.toLowerCase()}`)}
            >
              {icons[module.code] || icons.DEFAULT}
              <span className="font-medium">{module.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={() => navigate("/suborg-login")}
            className="flex items-center gap-3 p-3 w-full rounded-xl bg-red-500 text-white hover:bg-red-600"
          >
            <Settings className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Sub-Organization Dashboard</h1>
        <p className="text-gray-600">Choose a module from the sidebar.</p>
      </div>
    </div>
  );
}
