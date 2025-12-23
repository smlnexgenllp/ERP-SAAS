// SalaryForm.jsx - Cyberpunk / Neon Terminal Theme
import React from 'react';
import {
  Save,
  RefreshCw,
  ChevronDown,
  DollarSign,
  Shield,
  Building,
  Calculator,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';

const SalaryForm = ({
  employees,
  selectedEmployee,
  setSelectedEmployee,
  salaryData,
  setSalaryData,
  calculations,
  submitting,
  loading,
  handleSubmit,
  resetSalaryData,
  getTodayDate,
}) => {
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSalaryData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePercentageChange = (name, value) => {
    const numValue = parseFloat(value) || 0;
    let finalValue = value;
    if (numValue < 0) finalValue = '0';
    if (numValue > 100) finalValue = '100';
    setSalaryData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getEmployeeDesignation = (employee) => {
    if (!employee.designation) return 'No designation';
    if (typeof employee.designation === 'string') return employee.designation;
    if (typeof employee.designation === 'object') {
      return employee.designation.title || employee.designation.name || 'No designation';
    }
    return 'No designation';
  };

  const getEmployeeDepartment = (employee) => {
    if (!employee.department) return '';
    if (typeof employee.department === 'string') return employee.department;
    if (typeof employee.department === 'object') return employee.department.name || '';
    return '';
  };

  return (
    <div className="bg-gray-900/20 border border-cyan-900 rounded-xl p-6 shadow-lg shadow-cyan-950/30">
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Employee Selection */}
          <div className="">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-pink-400 shadow shadow-pink-500/50"></div>
              <h3 className="text-pink-400 text-lg font-bold">EMPLOYEE SELECTION</h3>
            </div>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={loading || submitting}
              className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              required
            >
              <option value="">Select an employee to configure salary</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} • {getEmployeeDesignation(employee)} • {employee.employee_code || 'No ID'}
                </option>
              ))}
            </select>

            <div className="mt-2 text-sm text-gray-500">
              {selectedEmployee && (
                <span className="text-cyan-400">
                  Configuring salary for: {employees.find((e) => e.id === selectedEmployee)?.full_name}
                </span>
              )}
            </div>
          </div>

          {selectedEmployee && (
            <div className="space-y-8">
              {/* Basic Salary & Effective Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-cyan-300 font-semibold">Basic Salary (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">₹</span>
                    <input
                      type="number"
                      name="basic_salary"
                      value={salaryData.basic_salary}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full bg-gray-900 border border-cyan-700 rounded-lg pl-10 pr-4 py-3 text-cyan-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-cyan-300 font-semibold">Effective Date *</label>
                  <input
                    type="date"
                    name="effective_date"
                    value={salaryData.effective_date || ''}
                    onChange={handleInputChange}
                    required
                    max={getTodayDate()}
                    className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition"
                  />
                  <p className="text-xs text-gray-500">
                    Current: {salaryData.effective_date || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Allowances Accordion */}
              <div className="bg-gray-800/40 border border-cyan-800 rounded-lg overflow-hidden">
                <div className="bg-gray-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-cyan-300 font-semibold">ALLOWANCES</h4>
                  </div>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(calculations.total_allowances)}
                  </span>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'hra', label: 'House Rent Allowance (HRA)' },
                      { name: 'medical_allowance', label: 'Medical Allowance' },
                      { name: 'conveyance_allowance', label: 'Conveyance Allowance' },
                      { name: 'special_allowance', label: 'Special Allowance' },
                      { name: 'other_allowances', label: 'Other Allowances' },
                    ].map((field) => (
                      <div key={field.name} className="space-y-1">
                        <label className="block text-gray-400 text-sm">{field.label}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">₹</span>
                          <input
                            type="number"
                            name={field.name}
                            value={salaryData[field.name]}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg pl-10 pr-4 py-2 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ESI Accordion */}
              <div className="bg-gray-800/40 border border-cyan-800 rounded-lg overflow-hidden">
                <div className="bg-gray-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-cyan-300 font-semibold">EMPLOYEE STATE INSURANCE (ESI)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="has_esi"
                      checked={salaryData.has_esi}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500 rounded-full peer peer-checked:bg-pink-600"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                  </label>
                </div>

                {salaryData.has_esi && (
                  <div className="p-5">
                    <p className="text-sm text-gray-500 mb-4">
                      Applicable only if gross salary ≤ ₹21,000/month
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">ESI Number</label>
                        <input
                          type="text"
                          name="esi_number"
                          value={salaryData.esi_number}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">Employee Share %</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="esi_employee_share_percentage"
                            value={salaryData.esi_employee_share_percentage}
                            onChange={(e) => handlePercentageChange('esi_employee_share_percentage', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 pr-10 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">Employer Share %</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="esi_employer_share_percentage"
                            value={salaryData.esi_employer_share_percentage}
                            onChange={(e) => handlePercentageChange('esi_employer_share_percentage', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 pr-10 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PF Accordion */}
              <div className="bg-gray-800/40 border border-cyan-800 rounded-lg overflow-hidden">
                <div className="bg-gray-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-cyan-300 font-semibold">PROVIDENT FUND (PF)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="has_pf"
                      checked={salaryData.has_pf}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500 rounded-full peer peer-checked:bg-pink-600"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                  </label>
                </div>

                {salaryData.has_pf && (
                  <div className="p-5">
                    <p className="text-sm text-gray-500 mb-4">
                      PF calculated on basic salary (max ₹15,000)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">PF Account Number</label>
                        <input
                          type="text"
                          name="pf_number"
                          value={salaryData.pf_number}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">UAN Number</label>
                        <input
                          type="text"
                          name="uan_number"
                          value={salaryData.uan_number}
                          onChange={handleInputChange}
                          className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">Employee PF %</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="pf_employee_share_percentage"
                            value={salaryData.pf_employee_share_percentage}
                            onChange={(e) => handlePercentageChange('pf_employee_share_percentage', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 pr-10 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">Employer PF %</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="pf_employer_share_percentage"
                            value={salaryData.pf_employer_share_percentage}
                            onChange={(e) => handlePercentageChange('pf_employer_share_percentage', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 pr-10 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-gray-400 text-sm">Voluntary PF %</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="pf_voluntary_percentage"
                            value={salaryData.pf_voluntary_percentage}
                            onChange={(e) => handlePercentageChange('pf_voluntary_percentage', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-2 pr-10 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Deductions */}
              <div className="bg-gray-800/40 border border-cyan-800 rounded-lg overflow-hidden">
                <div className="bg-gray-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h4 className="text-cyan-300 font-semibold">OTHER DEDUCTIONS</h4>
                  </div>
                  <span className="text-red-400 font-medium">
                    {formatCurrency(calculations.total_deductions)}
                  </span>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'professional_tax', label: 'Professional Tax' },
                      { name: 'income_tax', label: 'Income Tax (TDS)' },
                      { name: 'other_deductions', label: 'Other Deductions' },
                    ].map((field) => (
                      <div key={field.name} className="space-y-1">
                        <label className="block text-gray-400 text-sm">{field.label}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">₹</span>
                          <input
                            type="number"
                            name={field.name}
                            value={salaryData[field.name]}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full bg-gray-900 border border-cyan-700 rounded-lg pl-10 pr-4 py-2 text-cyan-300 focus:outline-none focus:border-pink-500 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              <div className="bg-gray-800/60 border border-cyan-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Calculator className="w-6 h-6 text-pink-400" />
                  <h4 className="text-pink-400 text-xl font-bold">SALARY SUMMARY</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="bg-gray-900/50 border border-green-900/50 rounded-lg p-5">
                    <h5 className="text-green-400 font-semibold mb-4">EARNINGS</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Basic Salary:</span>
                        <span>{formatCurrency(parseFloat(salaryData.basic_salary) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Total Allowances:</span>
                        <span>{formatCurrency(calculations.total_allowances)}</span>
                      </div>
                      <div className="border-t border-green-900/50 pt-3 flex justify-between text-lg font-bold text-green-400">
                        <span>Gross Salary:</span>
                        <span>{formatCurrency(calculations.gross_salary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-gray-900/50 border border-red-900/50 rounded-lg p-5">
                    <h5 className="text-red-400 font-semibold mb-4">DEDUCTIONS</h5>
                    <div className="space-y-3">
                      {calculations.esi_employee_amount > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>ESI Employee:</span>
                          <span>{formatCurrency(calculations.esi_employee_amount)}</span>
                        </div>
                      )}
                      {calculations.pf_employee_amount > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>PF Employee:</span>
                          <span>{formatCurrency(calculations.pf_employee_amount)}</span>
                        </div>
                      )}
                      {calculations.pf_voluntary_amount > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>Voluntary PF:</span>
                          <span>{formatCurrency(calculations.pf_voluntary_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-300">
                        <span>Professional Tax:</span>
                        <span>{formatCurrency(parseFloat(salaryData.professional_tax) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Income Tax:</span>
                        <span>{formatCurrency(parseFloat(salaryData.income_tax) || 0)}</span>
                      </div>
                      <div className="border-t border-red-900/50 pt-3 flex justify-between text-lg font-bold text-red-400">
                        <span>Total Deductions:</span>
                        <span>{formatCurrency(calculations.total_deductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="mt-6 bg-gray-900/70 border-2 border-pink-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">NET SALARY</p>
                  <p className="text-4xl font-bold text-pink-400">
                    {formatCurrency(calculations.net_salary)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Gross Salary - Total Deductions</p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-cyan-300 font-semibold">Additional Notes</label>
                <textarea
                  name="notes"
                  value={salaryData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter any notes about this salary configuration..."
                  className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition"
                />
                <p className="text-xs text-gray-500">Optional: Reason for salary change, special conditions, etc.</p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-cyan-900">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee('');
                    resetSalaryData();
                  }}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !selectedEmployee}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-gray-900 font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Salary Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SalaryForm;