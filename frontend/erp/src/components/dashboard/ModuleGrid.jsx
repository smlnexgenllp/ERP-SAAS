import React from 'react';
import { Users, Package, ShoppingCart, Truck, Lock } from 'lucide-react';

const ModuleGrid = ({ modules, onModuleClick }) => {
  const getModuleIcon = (code) => {
    const icons = {
      hr_management: Users,
      inventory: Package,
      sales: ShoppingCart,
      transport: Truck,
    };
    return icons[code] || Package;
  };

  const getModuleColor = (code) => {
    const colors = {
      hr_management: 'bg-blue-500',
      inventory: 'bg-green-500',
      sales: 'bg-purple-500',
      transport: 'bg-orange-500',
    };
    return colors[code] || 'bg-gray-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {modules.map((module) => {
        const IconComponent = getModuleIcon(module.code);
        const isActive = module.is_active;
        
        return (
          <div
            key={module.module_id}
            onClick={() => onModuleClick(module)}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
              isActive 
                ? 'border-blue-200 hover:border-blue-300' 
                : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${getModuleColor(module.code)}`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              {!isActive && (
                <Lock size={16} className="text-gray-400 mt-1" />
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {module.name}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {module.description}
            </p>

            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
              
              {module.pages && (
                <span className="text-xs text-gray-500">
                  {module.pages.length} pages
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModuleGrid;