// src/hr/pages/EmployeeList.jsx
import React from 'react';
import useEmployees from '../hooks/useEmployees';
import EmployeeCard from '../components/EmployeeCard';

export default function EmployeeList() {
  const { employees, loading, error, reload } = useEmployees();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Employees</h2>
        <button onClick={reload} className="px-3 py-1 bg-slate-800 text-white rounded">Refresh</button>
      </div>

      {loading && <div className="p-4 bg-white rounded shadow">Loading...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{String(error)}</div>}

      <div className="grid gap-3">
        {employees.map((u) => <EmployeeCard key={u.id} employee={u} />)}
      </div>
    </div>
  );
}
