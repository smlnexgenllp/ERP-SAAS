// PayrollPage.jsx
import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

import PayrollDashboard from '../../../components/dashboard/payroll/payrollDashboard';
import SalarySetupWithESIPF from '../../../components/modules/payroll/SalarySetup';
import InvoiceGeneration from '../../../components/modules/payroll/InvoiceGeneration';
import PayrollHistory from '../../../components/modules/payroll/PayrollHistory';
import PayrollAttendance from '../../modules/payroll/PayrollAttendance';
import PayrollGenerate from '../../modules/payroll/PayrollGenerate';
import PayrollSummaryTable from './PayrollSummaryTable';

import api from '../../../services/api';

const PayrollPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [month, setMonth] = useState('');
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

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to load payroll data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-cyan-300 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-700 p-6 rounded-xl text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchPayrollData}
            className="mt-4 bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono">
      <div className="p-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="border-b border-cyan-800 pb-4 mb-8">
          <h1 className="text-3xl text-pink-400 font-bold">
            ALU-CORE : PAYROLL TERMINAL
          </h1>
          {currentOrg && (
            <p className="text-gray-400 mt-1">
              {currentOrg.name} ({currentOrg.type})
            </p>
          )}
        </header>

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700 p-4 rounded-xl flex gap-3">
            <CheckCircle className="text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* TABS */}
        <div className="bg-gray-900/30 border border-cyan-900 rounded-xl mb-6">
          <div className="flex border-b border-cyan-800">
            {[
              'Dashboard',
              'Salary Setup',
              'Attendance & Payroll',
              'Invoice Generation',
              'Payroll History',
            ].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-3 transition
                  ${activeTab === index
                    ? 'bg-gray-800 text-pink-400 border-b-2 border-pink-400'
                    : 'text-gray-400 hover:text-cyan-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-gray-900/20 border border-cyan-900 rounded-xl p-6">

          {activeTab === 0 && (
            <PayrollDashboard
              employees={employees}
              payrollHistory={payrollHistory}
            />
          )}

          {activeTab === 1 && (
            <SalarySetupWithESIPF
              employees={employees}
              onSalaryUpdated={() => showSuccess('Salary updated successfully')}
            />
          )}

          {activeTab === 2 && (
  <>
    <div className="flex flex-wrap gap-4 mb-8 items-center">
      <div>
        <label className="text-gray-400 mr-3">Select Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-gray-900 border border-cyan-700 px-4 py-2 rounded-lg text-white"
        />
      </div>

      <PayrollGenerate
        month={month}
        onSuccess={() => {
          showSuccess('Payroll generated successfully!');
          // Force refresh summary
          setMonth(prev => prev + ' '); // trick to re-trigger useEffect
          setTimeout(() => setMonth(month), 100);
        }}
      />
    </div>

    <PayrollAttendance month={month} />
    <PayrollSummaryTable month={month} />
  </>
)}

          {activeTab === 3 && (
            <InvoiceGeneration
              employees={employees.filter(emp => emp.has_salary)}
              onInvoiceGenerated={() =>
                showSuccess('Invoice generated successfully')
              }
            />
          )}

          {activeTab === 4 && (
            <PayrollHistory history={payrollHistory} />
          )}

        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
