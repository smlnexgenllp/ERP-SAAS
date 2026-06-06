// src/pages/modules/transport/FuelEntryList.jsx

import React, { useEffect, useState } from "react";
import {
  Fuel,
  Plus,
  Search,
  RefreshCw,
  Truck,
  IndianRupee,
  Calendar,
  X,
} from "lucide-react";

import api from "../../../services/api";
import TransportSidebar from "./components/TransportSidebar";

export default function FuelEntryList() {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [form, setForm] = useState({
    vehicle: "",
    fuel_date: "",
    liters: "",
    rate_per_liter: "",
    fuel_station: "",
    odometer_reading: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [fuelRes, vehicleRes] = await Promise.all([
        api.get("/transport/fuel-entries/"),
        api.get("/transport/vehicles/"),
      ]);

      setFuelEntries(fuelRes.data || []);
      setVehicles(vehicleRes.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const createFuelEntry = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/transport/fuel-entries/",
        form
      );

      alert("Fuel Entry Added");

      setShowCreateModal(false);

      setForm({
        vehicle: "",
        fuel_date: "",
        liters: "",
        rate_per_liter: "",
        fuel_station: "",
        odometer_reading: "",
        notes: "",
      });

      fetchData();
    } catch (err) {
      console.log(err.response?.data);
      alert("Failed");
    }
  };

  const filteredEntries = fuelEntries.filter((entry) =>
    `${entry.vehicle_name || ""} ${entry.fuel_station || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalFuelCost = fuelEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <TransportSidebar active="fuel" />

      <div className="flex-1 p-8">

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border shadow-sm mb-6">

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-3xl bg-yellow-100 flex items-center justify-center">
                <Fuel className="w-7 h-7 text-yellow-700" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Fuel Entries
                </h1>

                <p className="text-zinc-500">
                  Vehicle Fuel Management
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setShowCreateModal(true)
              }
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
            >
              <Plus size={18} />
              Add Fuel Entry
            </button>

          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          <div className="bg-white p-6 rounded-3xl border">
            <p className="text-zinc-500">
              Total Entries
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {fuelEntries.length}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-3xl border">
            <p className="text-zinc-500">
              Total Fuel Cost
            </p>

            <h2 className="text-4xl font-bold mt-2">
              ₹ {totalFuelCost.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-3xl border">
            <p className="text-zinc-500">
              Vehicles Refueled
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {
                new Set(
                  fuelEntries.map(
                    (f) => f.vehicle
                  )
                ).size
              }
            </h2>
          </div>

        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">

          <div className="p-6 border-b flex justify-between">

            <h2 className="text-2xl font-bold">
              Fuel Entry Master
            </h2>

            <div className="flex gap-3">

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-3.5 text-zinc-400"
                />

                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="pl-10 pr-4 py-3 border rounded-2xl"
                />

              </div>

              <button
                onClick={fetchData}
                className="border px-4 rounded-2xl"
              >
                <RefreshCw size={18} />
              </button>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="bg-zinc-50">

                  <th className="p-4 text-left">
                    Vehicle
                  </th>

                  <th className="p-4 text-left">
                    Date
                  </th>

                  <th className="p-4 text-left">
                    Liters
                  </th>

                  <th className="p-4 text-left">
                    Rate
                  </th>

                  <th className="p-4 text-left">
                    Amount
                  </th>

                  <th className="p-4 text-left">
                    Station
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t hover:bg-zinc-50"
                  >
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Truck size={16} />
                        {entry.vehicle_name}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} />
                        {entry.fuel_date}
                      </div>
                    </td>

                    <td className="p-4">
                      {entry.liters}
                    </td>

                    <td className="p-4">
                      ₹ {entry.rate_per_liter}
                    </td>

                    <td className="p-4 font-semibold text-green-700">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={15} />
                        {entry.amount}
                      </div>
                    </td>

                    <td className="p-4">
                      {entry.fuel_station}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-3xl p-8 w-full max-w-3xl">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold">
                  Add Fuel Entry
                </h2>

                <button
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  <X />
                </button>

              </div>

              <form
                onSubmit={createFuelEntry}
                className="grid grid-cols-2 gap-4"
              >

                <select
                  required
                  className="border p-3 rounded-xl"
                  value={form.vehicle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vehicle: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select Vehicle
                  </option>

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.vehicle_number}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  required
                  className="border p-3 rounded-xl"
                  value={form.fuel_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fuel_date: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Liters"
                  className="border p-3 rounded-xl"
                  value={form.liters}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      liters: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Rate Per Liter"
                  className="border p-3 rounded-xl"
                  value={form.rate_per_liter}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rate_per_liter:
                        e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Fuel Station"
                  className="border p-3 rounded-xl"
                  value={form.fuel_station}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fuel_station:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Odometer"
                  className="border p-3 rounded-xl"
                  value={form.odometer_reading}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      odometer_reading:
                        e.target.value,
                    })
                  }
                />

                <textarea
                  rows="3"
                  placeholder="Notes"
                  className="border p-3 rounded-xl col-span-2"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                />

                <button
                  className="bg-yellow-600 text-white py-3 rounded-xl col-span-2"
                >
                  Save Fuel Entry
                </button>

              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}