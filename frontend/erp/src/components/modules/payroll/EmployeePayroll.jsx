// components/payroll/EmployeePayroll.jsx
import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Building, // Changed from Bank to Building
  CheckCircle,
  Clock,
  XCircle,
  UserPlus
} from 'lucide-react';

const EmployeePayroll = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showAddModal, setShowAddModal] = useState(false);

  const employees = [
    {
      id: 1,
      name: 'Alex Johnson',
      email: 'alex.johnson@company.com',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      salary: 95000,
      status: 'active',
      paymentMethod: 'direct_deposit',
      hireDate: '2021-03-15',
      lastPayment: '2023-10-15',
      netPay: 5650,
      deductions: 1850,
      avatarColor: 'bg-blue-500'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'maria.garcia@company.com',
      position: 'Product Manager',
      department: 'Product',
      salary: 110000,
      status: 'active',
      paymentMethod: 'check',
      hireDate: '2020-08-22',
      lastPayment: '2023-10-15',
      netPay: 6850,
      deductions: 2150,
      avatarColor: 'bg-purple-500'
    },
    {
      id: 3,
      name: 'David Chen',
      email: 'david.chen@company.com',
      position: 'UX Designer',
      department: 'Design',
      salary: 85000,
      status: 'pending',
      paymentMethod: 'direct_deposit',
      hireDate: '2022-01-10',
      lastPayment: '2023-09-30',
      netPay: 5250,
      deductions: 1750,
      avatarColor: 'bg-green-500'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.williams@company.com',
      position: 'Marketing Lead',
      department: 'Marketing',
      salary: 78000,
      status: 'active',
      paymentMethod: 'direct_deposit',
      hireDate: '2019-11-05',
      lastPayment: '2023-10-15',
      netPay: 4850,
      deductions: 1550,
      avatarColor: 'bg-pink-500'
    },
    {
      id: 5,
      name: 'Robert Kim',
      email: 'robert.kim@company.com',
      position: 'Sales Executive',
      department: 'Sales',
      salary: 72000,
      status: 'inactive',
      paymentMethod: 'check',
      hireDate: '2022-06-18',
      lastPayment: '2023-08-31',
      netPay: 4450,
      deductions: 1350,
      avatarColor: 'bg-yellow-500'
    },
    {
      id: 6,
      name: 'Lisa Wong',
      email: 'lisa.wong@company.com',
      position: 'DevOps Engineer',
      department: 'Engineering',
      salary: 105000,
      status: 'active',
      paymentMethod: 'direct_deposit',
      hireDate: '2021-09-12',
      lastPayment: '2023-10-15',
      netPay: 6450,
      deductions: 2050,
      avatarColor: 'bg-indigo-500'
    }
  ];

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployeeSelection = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      active: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      inactive: <XCircle className="h-3 w-3" />
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Payroll</h2>
          <p className="text-gray-600">Manage employee payroll information and payments</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-5 w-5" />
          Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-5 w-5" />
              Filter
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5" />
              Export
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                List
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedEmployees.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{selectedEmployees.length}</span>
              </div>
              <span className="text-blue-800 font-medium">
                {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
                Process Payroll
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Send Payslips
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === employees.length}
                      onChange={selectAllEmployees}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Salary</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${employee.avatarColor}`}>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-600">{employee.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {employee.department}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        ${employee.salary.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Annual</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">
                        ${employee.netPay.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Monthly</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${employee.avatarColor}`}>
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>
                {getStatusBadge(employee.status)}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Hired: {employee.hireDate}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {employee.paymentMethod === 'direct_deposit' ? (
                    <Building className="h-4 w-4" /> 
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {employee.paymentMethod === 'direct_deposit' ? 'Direct Deposit' : 'Check'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Annual Salary</div>
                  <div className="font-bold text-gray-900">${employee.salary.toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Monthly Net</div>
                  <div className="font-bold text-green-600">${employee.netPay.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex-1 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Run Payroll
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Employee</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@company.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Software Engineer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Engineering</option>
                      <option>Sales</option>
                      <option>Marketing</option>
                      <option>Product</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Salary
                  </label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="75000"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-6">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayroll;