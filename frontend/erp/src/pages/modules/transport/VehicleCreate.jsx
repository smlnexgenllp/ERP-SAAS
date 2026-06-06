import React, { useState } from "react";
import api from "../../../services/api";

export default function VehicleCreate({
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    vehicle_number: "",
    vehicle_type: "",
    capacity: "",
    insurance_expiry: "",
    pollution_expiry: "",
    status: "available",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/transport/vehicles/",
        form
      );

      alert("Vehicle Created");

      onSuccess();
    } catch (error) {
      console.error(error);

      alert("Vehicle Creation Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-3xl w-full max-w-2xl p-8">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Create Vehicle
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900"
          >
            ✕
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <input
            type="text"
            placeholder="Vehicle Number"
            className="w-full border rounded-2xl px-4 py-3"
            value={form.vehicle_number}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_number: e.target.value,
              })
            }
            required
          />

          <input
            type="text"
            placeholder="Vehicle Type"
            className="w-full border rounded-2xl px-4 py-3"
            value={form.vehicle_type}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_type: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Capacity"
            className="w-full border rounded-2xl px-4 py-3"
            value={form.capacity}
            onChange={(e) =>
              setForm({
                ...form,
                capacity: e.target.value,
              })
            }
          />

          <div>

            <label className="text-sm text-zinc-500">
              Insurance Expiry
            </label>

            <input
              type="date"
              className="w-full border rounded-2xl px-4 py-3 mt-2"
              value={form.insurance_expiry}
              onChange={(e) =>
                setForm({
                  ...form,
                  insurance_expiry:
                    e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="text-sm text-zinc-500">
              Pollution Expiry
            </label>

            <input
              type="date"
              className="w-full border rounded-2xl px-4 py-3 mt-2"
              value={form.pollution_expiry}
              onChange={(e) =>
                setForm({
                  ...form,
                  pollution_expiry:
                    e.target.value,
                })
              }
            />

          </div>

          <select
            className="w-full border rounded-2xl px-4 py-3"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
          >
            <option value="available">
              Available
            </option>

            <option value="maintenance">
              Maintenance
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <div className="flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white"
            >
              Save Vehicle
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}