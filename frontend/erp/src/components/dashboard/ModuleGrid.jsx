import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const ModuleGrid = ({ modules, onModuleClick }) => {
  const navigate = useNavigate();

  // Force all modules active
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
        navigate("/transport");
        break;

      case "manufacture":
        navigate("/manufacturing/dashboard");
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
          className="bg-white border border-zinc-200 rounded-3xl p-7 cursor-pointer transition-all hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 group"
        >
          <div className="flex items-center mb-5">
            <div className="bg-emerald-100 p-4 rounded-2xl mr-5 group-hover:bg-emerald-200 transition">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {module.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                {module.name}
              </h3>
              <p className="text-sm text-zinc-600 mt-1 line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            <span className="px-4 py-1.5 text-xs font-medium rounded-2xl bg-emerald-100 text-emerald-700">
              Active
            </span>
            <span className="text-xs text-zinc-500">
              {module.available_in_plans?.join(", ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleGrid;