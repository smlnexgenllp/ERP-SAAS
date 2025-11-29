// src/hr/pages/AddEmployee.jsx
import React from 'react';
import { useForm } from 'react-hook-form';


import { inviteEmployee } from '../api/hrApi';

export default function AddEmployee() {
  const { register, handleSubmit } = useForm();
  const [msg, setMsg] = React.useState(null);


const onSubmit = async (data) => {
  try {
    const response = await inviteEmployee(data.email, data.role);
    console.log('Invite sent', response.data);
  } catch (error) {
    console.error(error);
  }
};


  return (
    <div className="p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Invite Employee</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm text-slate-600">Email</label>
          <input {...register('email', { required: true })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm text-slate-600">Role</label>
          <select {...register('role')} className="w-full border p-2 rounded">
            <option value="employee">Employee</option>
            <option value="hr_manager">HR Manager</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded">Send Invite</button>
      </form>

      {msg && (
        <div className={`mt-3 p-3 rounded ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
