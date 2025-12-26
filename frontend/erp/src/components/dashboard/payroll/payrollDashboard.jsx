// payrollDashboard.jsx - Cyberpunk theme
import React from 'react';
import {
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserX,
} from 'lucide-react';

const PayrollDashboard = ({ employees = [], payrollHistory = [], loading = false }) => {
  // Safely calculate statistics
  const stats = {
    totalEmployees: Array.isArray(employees) ? employees.length : 0,
    employeesWithSalary: Array.isArray(employees)
      ? employees.filter(emp => emp && emp.salary).length
      : 0,
    totalInvoices: Array.isArray(payrollHistory) ? payrollHistory.length : 0,
    totalPayrollAmount: Array.isArray(payrollHistory)
      ? payrollHistory.reduce((sum, invoice) => sum + (invoice?.totalAmount || 0), 0)
      : 0,
  };

  const StatCard = ({ title, value, icon: Icon, color = 'cyan', subtitle }) => (
    <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-lg shadow-cyan-950/30 p-6 flex flex-col hover:shadow-cyan-800/50 transition">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gray-800/50 p-3 rounded-lg">
          <Icon className={`w-7 h-7 text-${color}-400`} />
        </div>
        <div>
          <p className="text-gray-400 text-sm uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-cyan-300">
            {loading ? '...' : value}
          </p>
        </div>
      </div>
      {subtitle && (
        <p className="text-gray-500 text-sm mt-auto">{subtitle}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="cyan"
        />

        <StatCard
          title="Salary Configured"
          value={stats.employeesWithSalary}
          icon={DollarSign}
          color="green"
          subtitle={`${stats.employeesWithSalary} of ${stats.totalEmployees}`}
        />

        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={Receipt}
          color="pink"
        />

        <StatCard
          title="Total Payroll"
          value={`$${stats.totalPayrollAmount.toLocaleString()}`}
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Salary Updates */}
        <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-lg shadow-cyan-950/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-pink-400 shadow shadow-pink-500/50"></div>
            <h3 className="text-pink-400 text-xl font-bold">Recent Salary Updates</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(employees) && employees
                .filter(emp => emp && emp.salary)
                .slice(0, 5)
                .map((employee) => (
                  <div
                    key={employee.id || employee._id}
                    className="flex items-start gap-4 bg-gray-800/30 p-4 rounded-lg border border-cyan-900/50 hover:border-cyan-700 transition"
                  >
                    <div className="bg-gray-800 p-3 rounded-full">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-cyan-300 font-semibold">
                          {employee.name || 'Unknown Employee'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {employee.salary?.updatedAt
                            ? new Date(employee.salary.updatedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        Salary: ${employee.salary?.baseSalary?.toLocaleString() || '0'}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-800 border border-cyan-800 rounded text-xs text-cyan-300">
                        {employee.designation || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}

              {(!employees || employees.filter(emp => emp && emp.salary).length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p>No recent salary updates</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employees Pending Salary Setup */}
        <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-lg shadow-cyan-950/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-pink-400 shadow shadow-pink-500/50"></div>
            <h3 className="text-pink-400 text-xl font-bold">Pending Salary Setup</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(employees) && employees
                .filter(emp => emp && !emp.salary)
                .slice(0, 5)
                .map((employee) => (
                  <div
                    key={employee.id || employee._id}
                    className="flex items-start gap-4 bg-gray-800/30 p-4 rounded-lg border border-amber-900/50 hover:border-amber-700 transition"
                  >
                    <div className="bg-gray-800 p-3 rounded-full">
                      <UserX className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-cyan-300 font-semibold">
                          {employee.name || 'Unknown Employee'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {employee.employeeId || 'No ID'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {employee.designation || 'N/A'}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-amber-900/40 border border-amber-700 rounded text-xs text-amber-300">
                        Action Required
                      </span>
                    </div>
                  </div>
                ))}

              {(!employees || employees.filter(emp => emp && !emp.salary).length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                  <p>All employees have salary configured</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Default props for safety
PayrollDashboard.defaultProps = {
  employees: [],
  payrollHistory: [],
  loading: false,
};

export default PayrollDashboard;