// InvoiceGeneration.jsx - Cyberpunk / Neon Terminal Theme
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Users,
  FileText,
  Download,
  Eye,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import api from '../../../services/api';

const InvoiceGeneration = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/hr/payroll/employees/?with_salary=true');
        if (res.data.success) {
          setEmployees(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError('Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch recent invoices
  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const res = await api.get('/hr/payroll/invoices/recent/');
        if (res.data.success) {
          setRecentInvoices(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch recent invoices:', err);
      }
    };
    fetchRecentInvoices();
  }, []);

  const handleGenerateInvoice = async () => {
    if (!selectedEmployee || !selectedMonth) {
      setError('Please select both employee and month');
      return;
    }

    setGenerating(true);
    setError('');
    setInvoiceData(null);

    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee?.salary) {
        throw new Error('No salary configured for this employee');
      }

      const year = new Date().getFullYear();
      const monthStr = `${year}-${selectedMonth}`;
      const attendanceRes = await api.get(`/hr/attendance/?employee_id=${selectedEmployee}&month=${monthStr}`);
      const attendance = attendanceRes.data.data || { present_days: 0, total_days: 30 };

      const presentDays = attendance.present_days || 0;
      const totalDays = attendance.total_days || 30;

      const baseSalary = parseFloat(employee.salary.basic_salary) || 0;
      const totalAllowances = parseFloat(employee.salary.total_allowances) || 0;
      const grossSalary = baseSalary + totalAllowances;
      const proratedGross = (grossSalary * presentDays) / totalDays;

      const payload = {
        employee_id: selectedEmployee,
        month: selectedMonth,
        year,
        present_days: presentDays,
        total_days: totalDays,
      };

      const generateRes = await api.post('/hr/payroll/invoice/', payload);

      if (generateRes.data.success) {
        const newInvoice = {
          ...generateRes.data.data,
          proratedGross,
          month: `${months.find(m => m.value === selectedMonth)?.label} ${year}`,
        };
        setInvoiceData(newInvoice);
        setPreviewOpen(true);

        setRecentInvoices(prev => [newInvoice, ...prev.slice(0, 4)]);
      } else {
        throw new Error(generateRes.data.error || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error('Invoice generation error:', err);
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadInvoice = () => {
    alert('PDF download would be implemented here (e.g., jsPDF or backend PDF generation)');
    console.log('Invoice data for download:', invoiceData);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'green';
      case 'pending': return 'amber';
      case 'generated': return 'cyan';
      default: return 'gray';
    }
  };

  return (
    <div className="bg-gray-900/20 border border-cyan-900 rounded-xl p-6 shadow-lg shadow-cyan-950/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-pink-400 shadow shadow-pink-500/50"></div>
        <h2 className="text-pink-400 text-2xl font-bold">INVOICE GENERATION TERMINAL</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Generate payroll invoices based on attendance and salary configuration
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div className="flex-1 text-red-300">{error}</div>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Employee Select */}
        <div className="space-y-2">
          <label className="block text-cyan-300 font-semibold">Select Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            disabled={loadingEmployees || generating}
            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition"
          >
            <option value="">Select employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} • {emp.employee_code} • {emp.designation || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        {/* Month Select */}
        <div className="space-y-2">
          <label className="block text-cyan-300 font-semibold">Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={loadingEmployees || generating}
            className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 transition"
          >
            <option value="">Select month</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setSelectedEmployee('');
            setSelectedMonth('');
            setError('');
          }}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          Clear
        </button>

        <button
          onClick={handleGenerateInvoice}
          disabled={generating || !selectedEmployee || !selectedMonth}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-gray-900 font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Generate Invoice
            </>
          )}
        </button>
      </div>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-pink-400" />
            <h3 className="text-pink-400 text-xl font-bold">RECENT INVOICES</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/60 border-b border-cyan-800">
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Invoice ID</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Employee</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Month</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Status</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-cyan-900/50 hover:bg-gray-800/40 transition">
                    <td className="px-6 py-4 text-gray-300">{inv.invoice_number || inv.id}</td>
                    <td className="px-6 py-4 text-gray-300">{inv.employee_name}</td>
                    <td className="px-6 py-4 text-gray-300">{inv.month}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">
                      ₹{inv.total_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(inv.status)}-900/40 text-${getStatusColor(inv.status)}-300 border border-${getStatusColor(inv.status)}-700`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setInvoiceData(inv);
                          setPreviewOpen(true);
                        }}
                        className="text-cyan-400 hover:text-pink-400 transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {previewOpen && invoiceData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-950/50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-800">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-pink-400" />
                <h3 className="text-pink-400 text-xl font-bold">INVOICE PREVIEW</h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-400 hover:text-pink-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-cyan-300">PAYROLL INVOICE</h2>
                <p className="text-gray-400">{invoiceData.month}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-gray-500 text-sm">Employee</p>
                  <p className="text-cyan-300 font-semibold">{invoiceData.employee_name}</p>
                  <p className="text-gray-500 text-sm">ID: {invoiceData.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">Invoice #</p>
                  <p className="text-cyan-300 font-semibold">{invoiceData.invoice_number}</p>
                </div>
              </div>

              <div className="bg-gray-800/60 border border-cyan-800 rounded-lg p-6 mb-6">
                <h4 className="text-pink-400 font-semibold mb-4">Salary Breakdown</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Gross Salary (Prorated)</span>
                    <span className="text-green-400">₹{invoiceData.proratedGross?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Deductions</span>
                    <span className="text-red-400">- ₹{invoiceData.deductions?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-cyan-900 pt-4 flex justify-between text-xl font-bold">
                    <span className="text-cyan-300">Total Payable</span>
                    <span className="text-pink-400">₹{invoiceData.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-gray-900 font-bold rounded-lg hover:opacity-90 transition"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGeneration;