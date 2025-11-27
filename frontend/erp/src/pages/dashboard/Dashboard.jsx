import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import { moduleService } from '../../services/moduleService';
import { Building } from 'lucide-react';

// Components
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ModuleGrid from '../../components/dashboard/ModuleGrid';
import SubOrganizationModal from '../../components/dashboard/SubOrganizationModal';
import StatsGrid from '../../components/dashboard/StatsGrid';

const Dashboard = () => {
  const { u ser, organization, logout } = useAuth();
  const navigate = useNavigate();
  
  const [modules, setModules] = useState([]);
  const [subOrganizations, setSubOrganizations] = useState([]);
  const [stats, setStats] = useState({
    totalSubOrgs: 0,
    activeModules: 0,
    totalUsers: 0
  });
  const [showSubOrgModal, setShowSubOrgModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !organization) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, organization, navigate]);

 // In Dashboard.jsx

const loadDashboardData = async () => {
  try {
    setLoading(true);
    
    // Load available modules
    const modulesData = await moduleService.getAvailableModules();
    setModules(modulesData);
    
    // Load sub-organizations
    const subOrgsData = await organizationService.getSubOrganizations();
    setSubOrganizations(subOrgsData);

    // Load stats
    const statsData = await organizationService.getDashboardStats();
    setStats(statsData);

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    // ⚠️ Handle the critical error here!
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Assuming 'logout' redirects to the login page
      logout(); 
    }
    // Optionally show a user-facing error message
    // setErrorMessage("Could not load data. Please refresh."); 
  } finally {
    setLoading(false); // <--- CRITICAL: Make sure loading is set to false even on error
  }
};

  const handleModuleClick = (module) => {
    if (module.is_active) {
      // Navigate to module if active
      navigate(module.base_url);
    }
    // If not active, maybe show a tooltip or message
  };

  const handleSubOrgCreated = () => {
    setShowSubOrgModal(false);
    loadDashboardData(); // Refresh data
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
      <DashboardHeader 
        organization={organization} 
        user={user}
        onLogout={logout}
        onCreateSubOrg={() => setShowSubOrgModal(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Modules Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Available Modules</h2>
              <p className="text-gray-600 mt-1">
                Manage and access your organization's modules
              </p>
            </div>
          </div>

          <ModuleGrid 
            modules={modules}
            onModuleClick={handleModuleClick}
          />
        </div>

        {/* Sub Organizations Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sub Organizations</h2>
              <p className="text-gray-600 mt-1">
                Manage your sub-organizations and their module access
              </p>
            </div>
            <button
              onClick={() => setShowSubOrgModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Sub Organization
            </button>
          </div>

          {subOrganizations.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Modules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {org.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {org.subdomain}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.plan_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                          org.plan_tier === 'advance' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {org.plan_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.active_modules_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.user_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/sub-organizations/${org.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sub Organizations
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first sub-organization to start managing module access.
                </p>
                <button
                  onClick={() => setShowSubOrgModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Sub Organization
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sub Organization Creation Modal */}
      {showSubOrgModal && (
        <SubOrganizationModal
          onClose={() => setShowSubOrgModal(false)}
          onSuccess={handleSubOrgCreated}
          availableModules={modules}
        />
      )}
    </div>
  );
};

export default Dashboard;