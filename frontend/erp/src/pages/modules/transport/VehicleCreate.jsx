import React, { useState } from "react";
import api from "../../../services/api";
import { Loader2 } from "lucide-react";   // Add this import

export default function VehicleCreate({
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    vehicle_number: "",
    vehicle_type: "",
    brand: "",
    model: "",
    capacity_kg: "",
    capacity_cbm: "",
    fuel_type: "",
    insurance_expiry: "",
    permit_expiry: "",
    pollution_expiry: "",
    fitness_expiry: "",
    gps_enabled: false,
    current_odometer: "",
    owner_type: "company",
    status: "available",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Prepare data - convert empty numbers to 0
    const payload = {
      ...form,
      capacity_kg: form.capacity_kg ? parseFloat(form.capacity_kg) : 0,
      capacity_cbm: form.capacity_cbm ? parseFloat(form.capacity_cbm) : 0,
      current_odometer: form.current_odometer ? parseFloat(form.current_odometer) : 0,
    };

    try {
      await api.post("/transport/vehicles/", payload);
      
      alert("Vehicle Created Successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err.response?.data);
      const errorMsg = err.response?.data?.detail || 
                      JSON.stringify(err.response?.data) || 
                      "Vehicle Creation Failed. Please check all fields.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Vehicle</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          {/* Vehicle Number */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Vehicle Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="vehicle_number"
              placeholder="e.g. MH04 AB 1234"
              className="w-full border rounded-2xl px-4 py-3"
              value={form.vehicle_number}
              onChange={handleChange}
              required
            />
          </div>

          {/* Brand & Model */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Brand</label>
            <input type="text" name="brand" className="w-full border rounded-2xl px-4 py-3" value={form.brand} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Model</label>
            <input type="text" name="model" className="w-full border rounded-2xl px-4 py-3" value={form.model} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Vehicle Type</label>
            <input type="text" name="vehicle_type" className="w-full border rounded-2xl px-4 py-3" value={form.vehicle_type} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Fuel Type</label>
            <select name="fuel_type" className="w-full border rounded-2xl px-4 py-3" value={form.fuel_type} onChange={handleChange}>
              <option value="">Select Fuel Type</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Capacity (KG)</label>
            <input type="number" name="capacity_kg" className="w-full border rounded-2xl px-4 py-3" value={form.capacity_kg} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Capacity (CBM)</label>
            <input type="number" name="capacity_cbm" className="w-full border rounded-2xl px-4 py-3" value={form.capacity_cbm} onChange={handleChange} />
          </div>

          {/* Expiry Dates */}
          <div><label className="block text-sm font-medium text-zinc-700 mb-1">Insurance Expiry</label>
            <input type="date" name="insurance_expiry" className="w-full border rounded-2xl px-4 py-3" value={form.insurance_expiry} onChange={handleChange} />
          </div>

          <div><label className="block text-sm font-medium text-zinc-700 mb-1">Permit Expiry</label>
            <input type="date" name="permit_expiry" className="w-full border rounded-2xl px-4 py-3" value={form.permit_expiry} onChange={handleChange} />
          </div>

          <div><label className="block text-sm font-medium text-zinc-700 mb-1">Pollution Expiry</label>
            <input type="date" name="pollution_expiry" className="w-full border rounded-2xl px-4 py-3" value={form.pollution_expiry} onChange={handleChange} />
          </div>

          <div><label className="block text-sm font-medium text-zinc-700 mb-1">Fitness Expiry</label>
            <input type="date" name="fitness_expiry" className="w-full border rounded-2xl px-4 py-3" value={form.fitness_expiry} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Current Odometer</label>
            <input type="number" name="current_odometer" className="w-full border rounded-2xl px-4 py-3" value={form.current_odometer} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Owner Type</label>
            <select name="owner_type" className="w-full border rounded-2xl px-4 py-3" value={form.owner_type} onChange={handleChange}>
              <option value="company">Company Owned</option>
              <option value="vendor">Vendor Vehicle</option>
              <option value="leased">Leased Vehicle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
            <select name="status" className="w-full border rounded-2xl px-4 py-3" value={form.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="gps_enabled" checked={form.gps_enabled} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
            <label className="text-sm font-medium text-zinc-700">GPS Enabled</label>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
            <textarea name="notes" rows="4" className="w-full border rounded-2xl px-4 py-3" value={form.notes} onChange={handleChange} />
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border hover:bg-zinc-50"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? "Creating Vehicle..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}