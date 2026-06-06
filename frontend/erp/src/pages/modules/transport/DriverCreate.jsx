import React, { useState } from "react";
import api from "../../../services/api";

export default function DriverCreate({
  onClose,
  onSuccess,
}) {
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

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/transport/drivers/", form);

      alert("Driver Registered");

      onSuccess();
    } catch (err) {
      console.error(err.response?.data);
      alert("Failed to create driver");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-3xl w-full max-w-4xl p-8">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Register Driver
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-black"
          >
            ✕
          </button>

        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          <input
            placeholder="Full Name"
            className="border p-3 rounded-xl"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
          />

          <input
            placeholder="Phone Number"
            className="border p-3 rounded-xl"
            value={form.phone_number}
            onChange={(e) =>
              setForm({
                ...form,
                phone_number: e.target.value,
              })
            }
          />

          <input
            placeholder="Alternate Phone"
            className="border p-3 rounded-xl"
            value={form.alternate_phone}
            onChange={(e) =>
              setForm({
                ...form,
                alternate_phone: e.target.value,
              })
            }
          />

          <input
            placeholder="Blood Group"
            className="border p-3 rounded-xl"
            value={form.blood_group}
            onChange={(e) =>
              setForm({
                ...form,
                blood_group: e.target.value,
              })
            }
          />

          <input
            placeholder="License Number"
            className="border p-3 rounded-xl"
            value={form.license_number}
            onChange={(e) =>
              setForm({
                ...form,
                license_number: e.target.value,
              })
            }
          />

          <input
            type="date"
            className="border p-3 rounded-xl"
            value={form.license_expiry}
            onChange={(e) =>
              setForm({
                ...form,
                license_expiry: e.target.value,
              })
            }
          />

          <input
            placeholder="Salary"
            type="number"
            className="border p-3 rounded-xl"
            value={form.salary}
            onChange={(e) =>
              setForm({
                ...form,
                salary: e.target.value,
              })
            }
          />

          <select
            className="border p-3 rounded-xl"
            value={form.salary_type}
            onChange={(e) =>
              setForm({
                ...form,
                salary_type: e.target.value,
              })
            }
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
            <option value="trip">Trip Based</option>
          </select>

          <textarea
            rows={3}
            placeholder="Address"
            className="border p-3 rounded-xl md:col-span-2"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          <select
            className="border p-3 rounded-xl md:col-span-2"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl"
            >
              Save Driver
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}