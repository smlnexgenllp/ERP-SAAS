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
        navigate("/transport/dashboard");
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
          className="group bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-zinc-300"
        >
          {/* HEADER */}
          <div className="flex items-start mb-5">
            
            <div className="bg-zinc-100 group-hover:bg-zinc-900 transition-all duration-300 p-3 rounded-2xl mr-4 border border-zinc-200">
              <div className="w-8 h-8 bg-zinc-900 group-hover:bg-white rounded-xl flex items-center justify-center text-white group-hover:text-zinc-900 font-bold transition-all duration-300">
                {module.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-zinc-900">
                {module.name}
              </h3>

              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
            
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active
            </span>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 max-w-[120px] truncate">
                {module.available_in_plans?.join(", ")}
              </span>

              <div className="w-9 h-9 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleGrid;