import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '../../services/moduleService';
import ModuleGrid from '../../components/dashboard/ModuleGrid';

const SubOrganizationDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeModules: 0,
    totalUsers: 0
  });

  useEffect(() => {
    if (!user || !organization) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, organization, navigate]);

  const loadDashboardData = async () => {
  try {
    setLoading(true);
    
    // Load accessible modules for this sub-organization
    const modulesData = await moduleService.getAvailableModules(user?.role);
    console.log('📦 Modules loaded:', modulesData);
    setModules(modulesData);

    // Calculate stats
    const activeModulesCount = modulesData.filter(module => module.is_active).length;
    
    setStats({
      activeModules: activeModulesCount,
      totalUsers: 1
    });

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

  const handleModuleClick = (module) => {
    if (module.is_active) {
      // Navigate to module dashboard
      switch (module.code) {
        case 'hr_management':
          navigate('/hr/dashboard');
          break;
        case 'inventory':
          navigate('/inventory/dashboard');
          break;
        case 'sales':
          navigate('/sales/dashboard');
          break;
        case 'transport':
          navigate('/transport/dashboard');
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
        default:
          console.log(`No route defined for module: ${module.code}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">
                  {organization?.name?.charAt(0) || 'S'}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization?.name}</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.first_name} • Sub-Organization Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-semibold text-gray-900 capitalize">{organization?.plan_tier}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                  M
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Modules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeModules}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-sm font-bold">
                  U
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-sm font-bold">
                  P
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Plan Tier</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{organization?.plan_tier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Your Modules</h2>
            <p className="text-gray-600 mt-1">
              Access and manage your organization's modules
            </p>
          </div>
          
          <div className="p-6">
            {modules.length > 0 ? (
              <ModuleGrid 
                modules={modules}
                onModuleClick={handleModuleClick}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-gray-400 rounded flex items-center justify-center text-white text-2xl font-bold">
                    M
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Modules Assigned
                </h3>
                <p className="text-gray-600 mb-6">
                  Your organization doesn't have access to any modules yet. 
                  Please contact your main organization administrator.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Sub-Organization Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><strong>Organization:</strong> {organization?.name}</p>
              <p><strong>Subdomain:</strong> {organization?.subdomain}</p>
              <p><strong>Email:</strong> {organization?.email}</p>
            </div>
            <div>
              <p><strong>Plan:</strong> {organization?.plan_tier}</p>
              <p><strong>Phone:</strong> {organization?.phone || 'Not provided'}</p>
              <p><strong>Admin:</strong> {user?.first_name} {user?.last_name}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubOrganizationDashboard;