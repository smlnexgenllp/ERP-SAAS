import React from "react";
import { useNavigate } from "react-router-dom";

const ModuleGrid = ({ modules, onModuleClick }) => {
  const navigate = useNavigate(); // This is fine

  // Temporary: force all modules active
  const modulesWithForcedActive = modules.map((module) => ({
    ...module,
    is_active: true,
  }));

  const handleModuleClick = (module) => {
    switch (module.code) {
      case "hr_management":
        navigate("/hr/dashboard");
        break;
      case "inventory":
        navigate("/inventory/dashboard");
        break;
      case "finance":
        navigate("/accounting/dashboard");
        break;
      case "crm":
        navigate("/crm/dashboard");
        break;
      case "project_management":
        navigate("/projects/dashboard");
        break;
      case "sales":
        navigate("/sales/dashboard");
        break;
      case "transport":
        navigate("/transport/dashboard");
        break;
      default:
        if (onModuleClick) onModuleClick(module);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modulesWithForcedActive.map((module) => (
        <div
          key={module.module_id}
          onClick={() => handleModuleClick(module)}
          className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow p-6 cursor-pointer transition hover:shadow-gray-800/50"
        >
          <div className="flex items-center mb-4">
            <div className="bg-gray-800/60 p-3 rounded-lg mr-4">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center text-white font-bold">
                {module.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-300">
                {module.name}
              </h3>
              <p className="text-sm text-gray-400">{module.description}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="px-2 py-1 text-xs rounded-full bg-gray-800/50 text-green-400">
              Active
            </span>
            <span className="text-xs text-gray-500">
              {module.available_in_plans?.join(", ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleGrid;
