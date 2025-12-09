import React from "react";
import { Building, LogOut, User, Plus } from "lucide-react";

const DashboardHeader = ({ organization, user, onLogout, onCreateSubOrg }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Organization */}
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {organization?.name}
              </h1>
              <p className="text-sm text-gray-600 capitalize">
                {organization?.plan_tier} Plan • Main Organization
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCreateSubOrg}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Create Sub Org</span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
              <div className="bg-gray-100 p-2 rounded-full">
                <User size={20} className="text-gray-600" />
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
