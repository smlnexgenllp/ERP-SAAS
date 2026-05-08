// PayrollPage.jsx
import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

import PayrollDashboard from '../../../components/dashboard/payroll/payrollDashboard';
import SalarySetupWithESIPF from '../../../components/modules/payroll/SalarySetup';
import InvoiceGeneration from '../../../components/modules/payroll/InvoiceGeneration';
import PayrollHistory from '../../../components/modules/payroll/PayrollHistory';
import PayrollAttendance from '../../modules/payroll/PayrollAttendance';
import PayrollGenerate from '../../modules/payroll/PayrollGenerate';
import PayrollSummaryTable from './PayrollSummaryTable';

import api from '../../../services/api';
import { useNavigate } from "react-router-dom";

const PayrollPage = () => {
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 p-8 rounded-3xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchPayrollData}
            className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-black transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* HEADER with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Payroll Management
                </h1>
                {currentOrg && (
                  <p className="text-zinc-500 mt-1">
                    {currentOrg.name} ({currentOrg.type})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex gap-3 items-center">
            <CheckCircle className="text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* TABS */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm mb-6 overflow-hidden">
          <div className="flex">
            {[
              'Dashboard',
              'Salary Setup',
              'Attendance & Payroll',
              // 'Payroll History',
            ].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-4 text-sm font-medium transition-all
                  ${activeTab === index
                    ? 'bg-zinc-900 text-white border-b-4 border-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">

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
              <div className="flex flex-wrap gap-4 mb-8 items-end">
                <div>
                  <label className="block text-zinc-600 text-sm font-medium mb-2">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl focus:border-zinc-400 outline-none"
                  />
                </div>

                <PayrollGenerate
                  month={month}
                  onSuccess={() => {
                    showSuccess('Payroll generated successfully!');
                    setMonth(prev => prev + ' '); 
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