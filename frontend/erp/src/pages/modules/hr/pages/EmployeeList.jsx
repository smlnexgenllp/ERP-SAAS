// src/hr/pages/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../../services/api'; // Adjust path if needed
// import EmployeeCard from '../components/EmployeeCard';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/hr/employees/');
      const data = response.data.results || response.data;

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format from server');
      }

      setEmployees(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load employees';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Helper to format date (YYYY-MM-DD → DD MMM YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 shadow-md
              ${loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
              }`}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Loading...
              </>
            ) : (
              'Refresh List'
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && employees.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-6 text-lg text-gray-600">Fetching employees...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center justify-between">
            <div>
              <strong>Error:</strong> {error}
                        </div>
            <button onClick={fetchEmployees} className="ml-4 underline hover:no-underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && employees.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow border">
            <p className="text-xl text-gray-500">No employees found</p>
            <p className="text-sm text-gray-400 mt-2">
              This organization has no registered employees yet.
            </p>
          </div>
        )}

        {/* Employee Cards */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                {/* Photo */}
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt={employee.full_name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-indigo-400 to-purple-500 h-48 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {employee.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-800 truncate">
                    {employee.full_name || 'No Name'}
                  </h3>

                 {/* Role */}
<div className="mt-2 space-y-1 text-sm">
 

  {/* Designation */}
  <p className="text-gray-700">
    <strong>Designation:</strong>{' '}
    <span className="font-medium text-purple-600">
      {employee.designation?.title || 'Not Assigned'}
    </span>
  </p>

  {/* Department */}
  <p className="text-gray-700">
    <strong>Department:</strong>{' '}
    <span className="font-medium">
      {employee.department?.name || 'Not Assigned'}
    </span>
  </p>
</div>

                  {/* Dates */}
                  <div className="mt-3 text-xs text-gray-500 space-y-1 border-t pt-3">
                    <p>
                      <strong>DOJ:</strong> {formatDate(employee.date_of_joining)}
                    </p>
                    <p>
                      <strong>DOB:</strong> {formatDate(employee.date_of_birth)}
                    </p>
                  </div>

                  {/* Salary (CTC) */}
                  {employee.ctc && (
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600">Annual CTC</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{Number(employee.ctc).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}