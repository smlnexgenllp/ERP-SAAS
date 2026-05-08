// payrollDashboard.jsx
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

  const StatCard = ({ title, value, icon: Icon, color = 'zinc', subtitle }) => (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <p className="text-zinc-500 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold text-zinc-900 mt-2">
            {loading ? '...' : value}
          </p>
          {subtitle && (
            <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="zinc"
        />

        <StatCard
          title="Salary Configured"
          value={stats.employeesWithSalary}
          icon={DollarSign}
          color="emerald"
          subtitle={`${stats.employeesWithSalary} of ${stats.totalEmployees}`}
        />

        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={Receipt}
          color="zinc"
        />

        <StatCard
          title="Total Payroll"
          value={`₹${stats.totalPayrollAmount.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Salary Updates */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            Recent Salary Updates
          </h3>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(employees) && employees
                .filter(emp => emp && emp.salary)
                .slice(0, 5)
                .map((employee) => (
                  <div
                    key={employee.id || employee._id}
                    className="flex items-center gap-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition"
                  >
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <Users className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-zinc-900 truncate">
                          {employee.full_name || employee.name || 'Unknown Employee'}
                        </p>
                        <span className="text-xs text-zinc-500 whitespace-nowrap ml-3">
                          {employee.salary?.updatedAt
                            ? new Date(employee.salary.updatedAt).toLocaleDateString('en-IN')
                            : 'N/A'}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-sm mt-0.5">
                        ₹{employee.salary?.baseSalary?.toLocaleString('en-IN') || '0'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {employee.designation || 'No designation'}
                      </p>
                    </div>
                  </div>
                ))}

              {(!employees || employees.filter(emp => emp && emp.salary).length === 0) && (
                <div className="text-center py-16 text-zinc-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                  <p>No recent salary updates</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employees Pending Salary Setup */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
          <h3 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            Pending Salary Setup
          </h3>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(employees) && employees
                .filter(emp => emp && !emp.salary)
                .slice(0, 5)
                .map((employee) => (
                  <div
                    key={employee.id || employee._id}
                    className="flex items-center gap-4 bg-amber-50 p-5 rounded-2xl border border-amber-100 hover:border-amber-200 transition"
                  >
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <UserX className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold text-zinc-900">
                          {employee.full_name || employee.name || 'Unknown Employee'}
                        </p>
                        <span className="text-xs text-zinc-500">
                          {employee.employee_code || employee.employeeId || 'No ID'}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-sm mt-0.5">
                        {employee.designation || 'No designation'}
                      </p>
                      <span className="inline-block mt-3 px-4 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        Salary Setup Pending
                      </span>
                    </div>
                  </div>
                ))}

              {(!employees || employees.filter(emp => emp && !emp.salary).length === 0) && (
                <div className="text-center py-16 text-zinc-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p>All employees have salary configured ✓</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;