// PayrollPage.jsx - Cyberpunk theme matching HR Dashboard
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import PayrollDashboard from '../../../components/dashboard/payroll/payrollDashboard';
import SalarySetupWithESIPF from '../../../components/modules/payroll/SalarySetup';
import InvoiceGeneration from '../../../components/modules/payroll/InvoiceGeneration';
import PayrollHistory from '../../../components/modules/payroll/PayrollHistory';
import api from '../../../services/api'; // Your axios instance

const PayrollPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgResponse = await api.get('/hr/payroll/organization/');
      if (orgResponse.data.success) {
        setCurrentOrg(orgResponse.data.organization);
      }

      const empResponse = await api.get('/hr/payroll/employees/');
      if (empResponse.data.success) {
        setEmployees(empResponse.data.data || []);
      }

      // Optional: fetch history
      // const historyResponse = await api.get('/hr/payroll/history/');
      // if (historyResponse.data.success) {
      //   setPayrollHistory(historyResponse.data.data || []);
      // }

    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  const handleSalaryUpdated = () => {
    setSuccess('Salary updated successfully!');
    fetchPayrollData();
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleInvoiceGenerated = () => {
    setSuccess('Invoice generated successfully!');
    fetchPayrollData();
    setTimeout(() => setSuccess(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-xl">Loading Payroll System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl text-red-300 mb-2">ERROR</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={fetchPayrollData}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded font-bold hover:opacity-90 transition"
            >
              RETRY CONNECTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono">
      <div className="p-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="border-b border-cyan-800 pb-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-500/50"></div>
              <h1 className="text-pink-400 text-2xl md:text-3xl font-bold">
                ALU-CORE: PAYROLL TERMINAL
              </h1>
            </div>
            <p className="text-gray-400 mt-1">Manage salary structures • Generate invoices • Track payments</p>
          </div>

          {currentOrg && (
            <div className="bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-2 text-sm">
              <span className="text-cyan-400 font-semibold">{currentOrg.name}</span>
              <span className="text-gray-500 ml-2">({currentOrg.type})</span>
            </div>
          )}
        </header>

        {/* SUCCESS ALERT */}
        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* TABS */}
        <div className="bg-gray-900/30 border border-cyan-900 rounded-xl overflow-hidden mb-8">
          <div className="flex border-b border-cyan-800">
            {['Dashboard', 'Salary Setup', 'Invoice Generation', 'Payroll History'].map((label, index) => (
              <button
                key={label}
                onClick={() => handleTabChange(index)}
                className={`
                  flex-1 py-4 px-6 font-medium transition-all duration-200
                  ${activeTab === index 
                    ? 'bg-gray-800/50 border-b-2 border-pink-400 text-pink-300' 
                    : 'hover:bg-gray-800/30 text-gray-400 hover:text-cyan-300'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="bg-gray-900/20 border border-cyan-900 rounded-xl p-6 shadow-lg shadow-cyan-950/30">
          {activeTab === 0 && (
            <PayrollDashboard 
              employees={employees}
              payrollHistory={payrollHistory}
              loading={loading}
            />
          )}

          {activeTab === 1 && (
            <SalarySetupWithESIPF 
              employees={employees}
              onSalaryUpdated={handleSalaryUpdated}
              loading={loading}
            />
          )}

          {activeTab === 2 && (
            <InvoiceGeneration 
              employees={employees.filter(emp => emp.has_salary)}
              onInvoiceGenerated={handleInvoiceGenerated}
              loading={loading}
            />
          )}

          {activeTab === 3 && (
            <PayrollHistory 
              history={payrollHistory}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;