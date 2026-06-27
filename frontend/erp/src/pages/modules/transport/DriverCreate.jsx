// src/pages/modules/transport/DriverCreate.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/api";

export default function DriverCreate({ driver, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    alternate_phone: "",
    address: "",
    license_number: "",
    license_expiry: "",
    blood_group: "",
    salary: "",
    salary_type: "monthly",
    status: "active",
  });

  const [loading, setLoading] = useState(false);

  // Prefill data when editing
  useEffect(() => {
    if (driver) {
      setForm({
        full_name: driver.full_name || "",
        phone_number: driver.phone_number || "",
        alternate_phone: driver.alternate_phone || "",
        address: driver.address || "",
        license_number: driver.license_number || "",
        license_expiry: driver.license_expiry ? driver.license_expiry.split("T")[0] : "",
        blood_group: driver.blood_group || "",
        salary: driver.salary || "",
        salary_type: driver.salary_type || "monthly",
        status: driver.status || "active",
      });
    } else {
      setForm({
        full_name: "",
        phone_number: "",
        alternate_phone: "",
        address: "",
        license_number: "",
        license_expiry: "",
        blood_group: "",
        salary: "",
        salary_type: "monthly",
        status: "active",
      });
    }
  }, [driver]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (driver) {
        await api.put(`/transport/drivers/${driver.id}/`, form);
        alert("Driver Updated Successfully");
      } else {
        await api.post("/transport/drivers/", form);
        alert("Driver Registered Successfully");
      }
      onSuccess();
    } catch (err) {
      console.error(err.response?.data);
      alert("Failed to save driver. Please check the details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-8 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {driver ? "Edit Driver" : "Register New Driver"}
          </h2>
          <button
            onClick={onClose}
            className="text-3xl text-zinc-400 hover:text-black transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alternate Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
            <input
              name="alternate_phone"
              value={form.alternate_phone}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <input
              name="blood_group"
              value={form.blood_group}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
            <input
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* License Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
            <input
              type="date"
              name="license_expiry"
              value={form.license_expiry}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
            <input
              type="number"
              name="salary"
              value={form.salary}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salary Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
            <select
              name="salary_type"
              value={form.salary_type}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
              <option value="trip">Trip Based</option>
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border rounded-2xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-medium disabled:opacity-70"
            >
              {loading ? "Saving..." : driver ? "Update Driver" : "Save Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}