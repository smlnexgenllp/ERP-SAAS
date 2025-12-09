import React from "react";
import { Building, Users, Package, TrendingUp } from "lucide-react";

const StatsGrid = ({ stats }) => {
  const statCards = [
    {
      label: "Sub Organizations",
      value: stats.totalSubOrgs,
      icon: Building,
      color: "blue",
    },
    {
      label: "Active Modules",
      value: stats.activeModules,
      icon: Package,
      color: "green",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "purple",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      purple: "bg-purple-50 text-purple-600",
    };
    return colors[color] || "bg-gray-50 text-gray-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
