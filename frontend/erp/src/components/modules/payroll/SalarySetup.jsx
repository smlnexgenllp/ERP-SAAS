// SalarySetup.jsx
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
} from 'lucide-react';
import api from '../../../services/api';
import SalaryForm from './SalaryForm';

const SalarySetup = ({ employees = [], onSalaryUpdated, loading = false }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [salaryData, setSalaryData] = useState({
    basic_salary: '',
    hra: '',
    medical_allowance: '',
    conveyance_allowance: '',
    special_allowance: '',
    other_allowances: '',
    professional_tax: '',
    income_tax: '',
    other_deductions: '',
    has_esi: false,
    esi_number: '',
    esi_employee_share_percentage: 0.75,
    esi_employer_share_percentage: 3.25,
    has_pf: false,
    pf_number: '',
    uan_number: '',
    pf_employee_share_percentage: 12,
    pf_employer_share_percentage: 13,
    pf_voluntary_percentage: 0,
    effective_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [calculations, setCalculations] = useState({
    total_allowances: 0,
    gross_salary: 0,
    total_deductions: 0,
    net_salary: 0,
    esi_employee_amount: 0,
    esi_employer_amount: 0,
    pf_employee_amount: 0,
    pf_employer_amount: 0,
    pf_voluntary_amount: 0,
  });

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDateToYYYYMMDD = (date) => {
    if (!date) return getTodayDate();
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return getTodayDate();
      return dateObj.toISOString().split('T')[0];
    } catch {
      return getTodayDate();
    }
  };

  const resetSalaryData = () => {
    setSalaryData({
      basic_salary: '',
      hra: '',
      medical_allowance: '',
      conveyance_allowance: '',
      special_allowance: '',
      other_allowances: '',
      professional_tax: '',
      income_tax: '',
      other_deductions: '',
      has_esi: false,
      esi_number: '',
      esi_employee_share_percentage: 0.75,
      esi_employer_share_percentage: 3.25,
      has_pf: false,
      pf_number: '',
      uan_number: '',
      pf_employee_share_percentage: 12,
      pf_employer_share_percentage: 13,
      pf_voluntary_percentage: 0,
      effective_date: getTodayDate(),
      notes: '',
    });
  };

  // Load existing salary
  useEffect(() => {
    if (!selectedEmployee) return;
    const loadExistingSalary = async () => {
      try {
        const response = await api.get(`/hr/payroll/salary/${selectedEmployee}/`);
        if (response.data.success && response.data.data) {
          const existing = response.data.data;
          const formattedDate = formatDateToYYYYMMDD(existing.effective_date);
          setSalaryData({
            basic_salary: existing.basic_salary || '',
            hra: existing.hra || '',
            medical_allowance: existing.medical_allowance || '',
            conveyance_allowance: existing.conveyance_allowance || '',
            special_allowance: existing.special_allowance || '',
            other_allowances: existing.other_allowances || '',
            professional_tax: existing.professional_tax || '',
            income_tax: existing.income_tax || '',
            other_deductions: existing.other_deductions || '',
            has_esi: existing.has_esi || false,
            esi_number: existing.esi_number || '',
            esi_employee_share_percentage: existing.esi_employee_share_percentage || 0.75,
            esi_employer_share_percentage: existing.esi_employer_share_percentage || 3.25,
            has_pf: existing.has_pf || false,
            pf_number: existing.pf_number || '',
            uan_number: existing.uan_number || '',
            pf_employee_share_percentage: existing.pf_employee_share_percentage || 12,
            pf_employer_share_percentage: existing.pf_employer_share_percentage || 13,
            pf_voluntary_percentage: existing.pf_voluntary_percentage || 0,
            effective_date: formattedDate,
            notes: existing.notes || '',
          });
        } else {
          resetSalaryData();
        }
      } catch {
        resetSalaryData();
      }
    };
    loadExistingSalary();
  }, [selectedEmployee]);

  // Calculations
  useEffect(() => {
    const basic = parseFloat(salaryData.basic_salary) || 0;
    const allowances = {
      hra: parseFloat(salaryData.hra) || 0,
      medical: parseFloat(salaryData.medical_allowance) || 0,
      conveyance: parseFloat(salaryData.conveyance_allowance) || 0,
      special: parseFloat(salaryData.special_allowance) || 0,
      other: parseFloat(salaryData.other_allowances) || 0,
    };
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const grossSalary = basic + totalAllowances;

    let esiEmployeeAmount = 0;
    let esiEmployerAmount = 0;
    if (salaryData.has_esi && grossSalary <= 21000) {
      esiEmployeeAmount = (grossSalary * (parseFloat(salaryData.esi_employee_share_percentage) || 0.75)) / 100;
      esiEmployerAmount = (grossSalary * (parseFloat(salaryData.esi_employer_share_percentage) || 3.25)) / 100;
    }

    let pfEmployeeAmount = 0;
    let pfEmployerAmount = 0;
    let pfVoluntaryAmount = 0;
    if (salaryData.has_pf) {
      const pfWageLimit = 15000;
      const pfApplicableSalary = Math.min(basic, pfWageLimit);
      pfEmployeeAmount = (pfApplicableSalary * (parseFloat(salaryData.pf_employee_share_percentage) || 12)) / 100;
      pfEmployerAmount = (pfApplicableSalary * (parseFloat(salaryData.pf_employer_share_percentage) || 13)) / 100;
      const voluntaryPercentage = parseFloat(salaryData.pf_voluntary_percentage) || 0;
      if (voluntaryPercentage > 0) {
        pfVoluntaryAmount = ((basic - pfApplicableSalary) * voluntaryPercentage) / 100;
      }
    }

    const totalDeductions =
      (parseFloat(salaryData.professional_tax) || 0) +
      (parseFloat(salaryData.income_tax) || 0) +
      (parseFloat(salaryData.other_deductions) || 0) +
      esiEmployeeAmount +
      pfEmployeeAmount +
      pfVoluntaryAmount;

    setCalculations({
      total_allowances: totalAllowances,
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: grossSalary - totalDeductions,
      esi_employee_amount: esiEmployeeAmount,
      esi_employer_amount: esiEmployerAmount,
      pf_employee_amount: pfEmployeeAmount,
      pf_employer_amount: pfEmployerAmount,
      pf_voluntary_amount: pfVoluntaryAmount,
    });
  }, [salaryData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return setError('Please select an employee');
    if (!salaryData.basic_salary || parseFloat(salaryData.basic_salary) <= 0) {
      return setError('Basic salary is required and must be greater than 0');
    }

    let effectiveDate = salaryData.effective_date?.trim() || getTodayDate();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      effectiveDate = getTodayDate();
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        employee_id: selectedEmployee,
        basic_salary: parseFloat(salaryData.basic_salary) || 0,
        hra: parseFloat(salaryData.hra) || 0,
        medical_allowance: parseFloat(salaryData.medical_allowance) || 0,
        conveyance_allowance: parseFloat(salaryData.conveyance_allowance) || 0,
        special_allowance: parseFloat(salaryData.special_allowance) || 0,
        other_allowances: parseFloat(salaryData.other_allowances) || 0,
        professional_tax: parseFloat(salaryData.professional_tax) || 0,
        income_tax: parseFloat(salaryData.income_tax) || 0,
        other_deductions: parseFloat(salaryData.other_deductions) || 0,
        has_esi: Boolean(salaryData.has_esi),
        esi_number: salaryData.esi_number || '',
        esi_employee_share_percentage: parseFloat(salaryData.esi_employee_share_percentage) || 0.75,
        esi_employer_share_percentage: parseFloat(salaryData.esi_employer_share_percentage) || 3.25,
        has_pf: Boolean(salaryData.has_pf),
        pf_number: salaryData.pf_number || '',
        uan_number: salaryData.uan_number || '',
        pf_employee_share_percentage: parseFloat(salaryData.pf_employee_share_percentage) || 12,
        pf_employer_share_percentage: parseFloat(salaryData.pf_employer_share_percentage) || 13,
        pf_voluntary_percentage: parseFloat(salaryData.pf_voluntary_percentage) || 0,
        effective_date: effectiveDate,
        notes: salaryData.notes || '',
      };

      const response = await api.post('/hr/payroll/salary/', payload);

      if (response.data.success) {
        setSuccess(true);
        resetSalaryData();
        setSelectedEmployee('');
        onSalaryUpdated?.();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        throw new Error(response.data.error || 'Failed to save');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save salary');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center">
              <Save className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">Salary Setup</h2>
              <p className="text-zinc-500 mt-1">
                Configure salary structure, ESI, PF, allowances & deductions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Success</p>
            <p>Salary configuration saved successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Form Component */}
      <SalaryForm
        employees={employees}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        salaryData={salaryData}
        setSalaryData={setSalaryData}
        calculations={calculations}
        submitting={submitting}
        loading={loading}
        handleSubmit={handleSubmit}
        resetSalaryData={resetSalaryData}
        getTodayDate={getTodayDate}
      />
    </div>
  );
};

export default SalarySetup;