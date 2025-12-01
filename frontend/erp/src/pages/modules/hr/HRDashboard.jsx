import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Building,
  UserPlus,
  CalendarDays,
  Network,
  BarChart3
} from 'lucide-react';

const HRDashboard = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeRecruitments: 0,
    pendingLeaves: 0,
    totalPayroll: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching HR data
    const fetchHRData = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API calls
        setTimeout(() => {
          setStats({
            totalEmployees: 47,
            activeRecruitments: 5,
            pendingLeaves: 12,
            totalPayroll: 125000
          });
          setRecentActivities([
            { id: 1, type: 'new_hire', message: 'John Doe joined as Software Engineer', time: '2 hours ago' },
            { id: 2, type: 'leave_request', message: 'Sarah Smith applied for leave', time: '4 hours ago' },
            { id: 3, type: 'payroll', message: 'Payroll processed for March', time: '1 day ago' },
            { id: 4, type: 'recruitment', message: 'New position: Senior Developer', time: '2 days ago' }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching HR data:', error);
        setLoading(false);
      }
    };

    fetchHRData();
  }, []);

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Add Employee',
      description: 'Add new employee to system',
      onClick: () => navigate('/hr/employees/add'),
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      label: 'View Employees',
      description: 'Manage all employees',
      onClick: () => navigate('/hr/employees'),
      color: 'bg-green-500'
    },
    {
      icon: Network,
      label: 'Org Tree',
      description: 'View organization structure',
      onClick: () => navigate('/hr/org-tree'),
      color: 'bg-purple-500'
    },
    {
      icon: CalendarDays,
      label: 'Attendance',
      description: 'Manage employee attendance',
      onClick: () => navigate('/hr/attendance'),
      color: 'bg-orange-500'
    },
    {
      icon: FileText,
      label: 'Payroll',
      description: 'Process employee payroll',
      onClick: () => navigate('/hr/payroll'),
      color: 'bg-indigo-500'
    },
    {
      icon: BarChart3,
      label: 'HR Analytics',
      description: 'View HR metrics and reports',
      onClick: () => navigate('/hr/analytics'),
      color: 'bg-pink-500'
    }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      new_hire: UserPlus,
      leave_request: Calendar,
      payroll: DollarSign,
      recruitment: Users
    };
    return icons[type] || Clock;
  };

  const getActivityColor = (type) => {
    const colors = {
      new_hire: 'text-green-600 bg-green-100',
      leave_request: 'text-orange-600 bg-orange-100',
      payroll: 'text-purple-600 bg-purple-100',
      recruitment: 'text-blue-600 bg-blue-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HR Dashboard...</p>
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
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.first_name || user?.username} • {organization?.name || 'Organization'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-semibold text-gray-900">Human Resources</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                <p className="text-xs text-green-600 mt-1">+2 this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Recruitments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRecruitments}</p>
                <p className="text-xs text-blue-600 mt-1">3 positions open</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg mr-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
                <p className="text-xs text-orange-600 mt-1">Needs approval</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">Processed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600 mt-1">Frequently used HR functions</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md text-center group"
                    >
                      <div className={`${action.color} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600 mt-1">Latest HR updates</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => navigate('/hr/activities')}
                className="w-full mt-4 text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View All Activities
              </button>
            </div>
          </div>
        </div>

        {/* Additional HR Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Department Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
            <div className="space-y-3">
              {[
                { department: 'Engineering', count: 18, color: 'bg-blue-500' },
                { department: 'Sales', count: 12, color: 'bg-green-500' },
                { department: 'Marketing', count: 8, color: 'bg-purple-500' },
                { department: 'HR', count: 5, color: 'bg-orange-500' },
                { department: 'Finance', count: 4, color: 'bg-red-500' }
              ].map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${dept.color} mr-3`}></div>
                    <span className="text-sm text-gray-700">{dept.department}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{dept.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No upcoming events</p>
              <button 
                onClick={() => navigate('/hr/events')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Schedule an event
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;