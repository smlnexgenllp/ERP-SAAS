// components/payroll/Overview.jsx
import React, { useState } from 'react';
import StatCard from './StatCard';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Building, // Changed from Bank to Building
  PieChart,
  BarChart3
} from 'lucide-react';

const Overview = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const summaryStats = [
    {
      title: 'Gross Payroll',
      value: '$367,000',
      change: '+2.5%',
      icon: DollarSign,
      trend: 'up',
      subtitle: 'Annual total'
    },
    {
      title: 'Net Pay',
      value: '$242,300',
      change: '+1.8%',
      icon: TrendingUp,
      trend: 'up',
      subtitle: 'After deductions'
    },
    {
      title: 'Avg. Salary',
      value: '$68,500',
      change: '+3.2%',
      icon: Users,
      trend: 'up',
      subtitle: 'Per employee'
    },
    {
      title: 'Tax Liability',
      value: '$45,200',
      change: '-1.2%',
      icon: TrendingDown,
      trend: 'down',
      subtitle: 'Current quarter'
    }
  ];

  const departmentData = [
    { name: 'Engineering', value: 125000, color: 'bg-blue-500', employees: 8 },
    { name: 'Sales', value: 95000, color: 'bg-green-500', employees: 6 },
    { name: 'Marketing', value: 75000, color: 'bg-purple-500', employees: 5 },
    { name: 'Product', value: 72000, color: 'bg-yellow-500', employees: 4 }
  ];

  const paymentMethods = [
    { method: 'Direct Deposit', count: 12, amount: 18450, icon: Building }, // Changed from Bank to Building
    { method: 'Checks', count: 3, amount: 4250, icon: CreditCard },
    { method: 'Wire Transfer', count: 0, amount: 0, icon: TrendingUp }
  ];

  const recentTransactions = [
    { id: 1, type: 'Payroll Run', amount: 28750, date: 'Oct 15, 2023', status: 'completed', processedBy: 'System' },
    { id: 2, type: 'Bonus Payment', amount: 5000, date: 'Oct 10, 2023', status: 'completed', processedBy: 'Admin' },
    { id: 3, type: 'Tax Payment', amount: 12500, date: 'Oct 5, 2023', status: 'completed', processedBy: 'System' },
    { id: 4, type: 'Reimbursement', amount: 850, date: 'Oct 1, 2023', status: 'completed', processedBy: 'Manual' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payroll Overview</h2>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Department Breakdown</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {departmentData.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                      <span className="font-medium text-gray-900">{dept.name}</span>
                    </div>
                    <span className="font-semibold">${dept.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{dept.employees} employees</span>
                    <span>{Math.round((dept.value / 367000) * 100)}% of total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${dept.color}`}
                      style={{ width: `${(dept.value / 367000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
            
            <div className="space-y-4">
              {paymentMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{method.method}</h4>
                        <p className="text-sm text-gray-600">{method.count} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900">
                        ${method.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all transactions
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Processed By</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{transaction.type}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{transaction.processedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year-to-Date Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Year-to-Date Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-2">Total Paid YTD</div>
            <div className="text-2xl font-bold text-gray-900">$258,400</div>
            <div className="text-sm text-gray-600 mt-1">Jan - Oct 2023</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium mb-2">Tax Withheld</div>
            <div className="text-2xl font-bold text-gray-900">$56,800</div>
            <div className="text-sm text-gray-600 mt-1">21.9% of payroll</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium mb-2">Benefits Paid</div>
            <div className="text-2xl font-bold text-gray-900">$34,200</div>
            <div className="text-sm text-gray-600 mt-1">Health, retirement, etc.</div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium mb-2">Avg. Processing Time</div>
            <div className="text-2xl font-bold text-gray-900">2.4 hrs</div>
            <div className="text-sm text-gray-600 mt-1">Per payroll run</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;