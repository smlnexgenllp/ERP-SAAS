// apps/hr/pages/AddEmployee.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import api from '../../../../services/api'; 
import { useAuth } from '../../../../context/AuthContext'; 

const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Admin' },
];

const AddEmployee = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Assuming user holds info like API token
    const [formData, setFormData] = useState({
        full_name: '',
        employee_code: '',
        user_email: '', // This is crucial for the User/Invite flow
        phone: '',
        role: 'employee',
        department_id: '',
        designation_id: '',
        date_of_joining: '',
        is_probation: false,
        ctc: '',
        notes: '',
    });

    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- 1. Fetch Department & Designation Data ---
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                // Ensure your API routes are correct
                const [deptResponse, desigResponse] = await Promise.all([
                    api.get('/hr/departments/'), 
                    api.get('/hr/designations/')
                ]);
                
                setDepartments(deptResponse.data);
                setDesignations(desigResponse.data);
            } catch (err) {
                console.error("Failed to fetch dependencies:", err);
                setError("Failed to load departments or designations. Please check API.");
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, []);

    // --- 2. Handle Form Changes ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear success message on change
        if (successMessage) setSuccessMessage(null);
    };

    // --- 3. Handle Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        // Map empty string IDs to null for the ForeignKey fields
        const payload = {
            ...formData,
            department_id: formData.department_id || null,
            designation_id: formData.designation_id || null,
            // Ensure ctc is a number if provided
            ctc: formData.ctc ? parseFloat(formData.ctc) : null,
        };

        try {
            // POST data to the employees endpoint
            const response = await api.post('/hr/employees/', payload);
            
            setSuccessMessage(`Employee ${response.data.full_name} (${response.data.employee_code}) successfully created. An invitation email with temporary login details has been sent to ${payload.user_email}.`);
            // Optionally clear the form or navigate away
            setFormData({
                full_name: '', employee_code: '', user_email: '', phone: '', 
                role: 'employee', department_id: '', designation_id: '', 
                date_of_joining: '', is_probation: false, ctc: '', notes: '',
            });

        } catch (err) {
            console.error("Employee Creation Error:", err.response ? err.response.data : err.message);
            // Handle validation errors from the EmployeeCreateSerializer
            if (err.response && err.response.data) {
                const data = err.response.data;
                const messages = Object.keys(data).map(key => {
                    // Display error for the specific field, e.g., 'user_email: A user with this email already exists.'
                    return `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`;
                }).join(' | ');
                setError(`Validation Error: ${messages}`);
            } else {
                setError("An unexpected error occurred during employee creation.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Loading State ---
    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading HR Data...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <UserPlus className="w-8 h-8 mr-3 text-blue-600" />
                    Add New Employee
                </h1>
                <button
                    onClick={() => navigate('/hr/')}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </button>
            </div>
            
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline ml-2">{successMessage}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Personal & Contact Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 required">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            id="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 required">Email (Login ID)</label>
                        <input
                            type="email"
                            name="user_email"
                            id="user_email"
                            value={formData.user_email}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                         <p className="mt-1 text-xs text-blue-600">Invitation and temporary password will be sent here.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700 required">Employee Code</label>
                        <input
                            type="text"
                            name="employee_code"
                            id="employee_code"
                            value={formData.employee_code}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>


                <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 pt-4">Organizational Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                            name="department_id"
                            id="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">-- Select Department --</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="designation_id" className="block text-sm font-medium text-gray-700">Designation</label>
                        <select
                            name="designation_id"
                            id="designation_id"
                            value={formData.designation_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">-- Select Designation --</option>
                            {designations.map(desig => (
                                <option key={desig.id} value={desig.id}>{desig.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">System Role</label>
                        <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {roleOptions.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="date_of_joining" className="block text-sm font-medium text-gray-700">Date of Joining</label>
                        <input
                            type="date"
                            name="date_of_joining"
                            id="date_of_joining"
                            value={formData.date_of_joining}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="ctc" className="block text-sm font-medium text-gray-700">CTC (Annual)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="ctc"
                            id="ctc"
                            value={formData.ctc}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 50000.00"
                        />
                    </div>
                    <div className="flex items-end">
                        <label htmlFor="is_probation" className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="is_probation"
                                id="is_probation"
                                checked={formData.is_probation}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Currently on Probation</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Internal HR Only)</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>


                {/* Submit Button */}
                <div className="pt-5 border-t mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || loading}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors 
                            ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                Sending Invite...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-3 h-5 w-5" />
                                Create Employee & Send Invitation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployee;