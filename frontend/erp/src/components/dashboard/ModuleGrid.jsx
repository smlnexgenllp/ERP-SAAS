import React from 'react';
import { useNavigate } from 'react-router-dom';

const ModuleGrid = ({ modules, onModuleClick }) => {
  const navigate = useNavigate();

  // Temporary fix: Force all modules to active for testing
  const modulesWithForcedActive = modules.map(module => ({
    ...module,
    is_active: true // Force active for all modules
  }));

  const handleModuleClick = (module) => {
    // Remove the is_active check temporarily
    // if (module.is_active) {
      switch (module.code) {
        case 'hr_management':
          navigate('/hr/dashboard');
          break;
        case 'inventory':
          navigate('/inventory/dashboard');
          break;
        case 'accounting':
          navigate('/accounting/dashboard');
          break;
        case 'crm':
          navigate('/crm/dashboard');
          break;
        case 'project_management':
          navigate('/projects/dashboard');
          break;
        case 'sales':
          navigate('/sales/dashboard');
          break;
        case 'transport':
          navigate('/transport/dashboard');
          break;
        default:
          if (onModuleClick) {
            onModuleClick(module);
          }
      }
    // } else {
    //   console.log('❌ Module is inactive, cannot navigate');
    // }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modulesWithForcedActive.map((module) => (
        <div
          key={module.module_id}
          onClick={() => handleModuleClick(module)}
          className="bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg hover:border-blue-500 border-2 border-transparent"
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                {module.name.charAt(0)}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Active
            </span>
            <span className="text-xs text-gray-500">
              {module.available_in_plans?.join(', ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModuleGrid;