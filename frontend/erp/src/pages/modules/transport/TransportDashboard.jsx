// src/pages/modules/transport/TransportDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Truck,
  Route,
  Fuel,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Users,
  PlusCircle,
  LogOut,
  BarChart3,
  MapPinned,
} from "lucide-react";

import api from "../../../services/api";

const Sidebar = ({ active = "dashboard" }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: BarChart3,
      label: "Dashboard",
      path: "/transport/dashboard",
      key: "dashboard",
    },
    {
      icon: Truck,
      label: "Vehicles",
      path: "/transport/vehicles",
      key: "vehicles",
    },
    {
      icon: Users,
      label: "Drivers",
      path: "/transport/drivers",
      key: "drivers",
    },
    {
      icon: Route,
      label: "Trips",
      path: "/transport/trips",
      key: "trips",
    },
    {
      icon: Fuel,
      label: "Fuel Entries",
      path: "/transport/fuel",
      key: "fuel",
    },
    {
      icon: Wrench,
      label: "Maintenance",
      path: "/transport/maintenance",
      key: "maintenance",
    },
    {
      icon: FileText,
      label: "Invoices",
      path: "/transport/invoices",
      key: "invoices",
    },
  ];

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center">
            <Truck className="h-6 w-6 text-white" />
          </div>

          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Transport
          </h2>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all text-sm font-medium ${
              active === item.key
                ? "bg-zinc-800 text-white border-l-4 border-zinc-400"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 mt-auto">
        <button
          onClick={() => navigate("/logout")}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-950/70 hover:bg-red-900/80 text-red-300 hover:text-red-200 transition text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default function TransportDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  // ===============================
  // Vehicle Form
  // ===============================

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: "",
    vehicle_type: "",
    capacity: "",
    status: "available",
    insurance_expiry: "",
    pollution_expiry: "",
  });

  // ===============================
  // Driver Form
  // ===============================

  const [driverForm, setDriverForm] = useState({
    full_name: "",
    phone_number: "",
    license_number: "",
    license_expiry: "",
    status: "active",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        vehicleRes,
        driverRes,
        tripRes,
        fuelRes,
        expenseRes,
        invoiceRes,
      ] = await Promise.all([
        api.get("/transport/vehicles/"),
        api.get("/transport/drivers/"),
        api.get("/transport/trips/"),
        api.get("/transport/fuel-entries/"),
        api.get("/transport/expenses/"),
        api.get("/transport/invoices/"),
      ]);

      setVehicles(vehicleRes.data || []);
      setDrivers(driverRes.data || []);
      setTrips(tripRes.data || []);
      setFuelEntries(fuelRes.data || []);
      setExpenses(expenseRes.data || []);
      setInvoices(invoiceRes.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Vehicle Create
  // ===============================

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/transport/vehicles/", vehicleForm);

      alert("Vehicle created successfully");

      setVehicleForm({
        vehicle_number: "",
        vehicle_type: "",
        capacity: "",
        status: "available",
        insurance_expiry: "",
        pollution_expiry: "",
      });

      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert("Vehicle creation failed");
    }
  };

  // ===============================
  // Driver Create
  // ===============================

  const handleDriverSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/transport/drivers/", driverForm);

      alert("Driver created successfully");

      setDriverForm({
        full_name: "",
        phone_number: "",
        license_number: "",
        license_expiry: "",
        status: "active",
      });

      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert("Driver creation failed");
    }
  };

  // ===============================
  // Dashboard Stats
  // ===============================

  const totalTrips = trips.length;

  const activeTrips = trips.filter(
    (trip) =>
      trip.status === "loading" ||
      trip.status === "dispatched" ||
      trip.status === "in_transit"
  ).length;

  const completedTrips = trips.filter(
    (trip) => trip.status === "delivered"
  ).length;

  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "maintenance"
  ).length;

  const totalFuelCost = fuelEntries.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalInvoice = invoices.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>

          <p className="text-zinc-600 mt-6 text-lg font-medium">
            Loading Transport Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 flex overflow-hidden">

      {/* Sidebar */}
      <Sidebar active="dashboard" />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center shadow-sm">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Transport Dashboard
              </h1>

              <p className="text-zinc-500 text-sm mt-1">
                ERP Transport Management System
              </p>
            </div>

          </div>

        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Total Trips
                </p>

                <Route className="h-7 w-7 text-blue-600" />
              </div>

              <p className="text-5xl font-bold text-zinc-900">
                {totalTrips}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Active Trips
                </p>

                <Clock className="h-7 w-7 text-amber-600" />
              </div>

              <p className="text-5xl font-bold text-zinc-900">
                {activeTrips}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Delivered Trips
                </p>

                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>

              <p className="text-5xl font-bold text-zinc-900">
                {completedTrips}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Maintenance
                </p>

                <Wrench className="h-7 w-7 text-red-600" />
              </div>

              <p className="text-5xl font-bold text-zinc-900">
                {maintenanceVehicles}
              </p>
            </div>

          </div>

          {/* Finance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Fuel Cost
                </p>

                <Fuel className="h-7 w-7 text-yellow-600" />
              </div>

              <p className="text-4xl font-bold text-zinc-900">
                ₹ {totalFuelCost.toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Expenses
                </p>

                <AlertTriangle className="h-7 w-7 text-purple-600" />
              </div>

              <p className="text-4xl font-bold text-zinc-900">
                ₹ {totalExpense.toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">
                  Invoice Value
                </p>

                <FileText className="h-7 w-7 text-indigo-600" />
              </div>

              <p className="text-4xl font-bold text-zinc-900">
                ₹ {totalInvoice.toLocaleString()}
              </p>
            </div>

          </div>

          {/* Forms */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">

            {/* Vehicle Form */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">

              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="text-blue-600" />

                <h2 className="text-2xl font-semibold">
                  Create Vehicle
                </h2>
              </div>

              <form
                onSubmit={handleVehicleSubmit}
                className="space-y-5"
              >

                <input
                  type="text"
                  placeholder="Vehicle Number"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={vehicleForm.vehicle_number}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vehicle_number: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Vehicle Type"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={vehicleForm.vehicle_type}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vehicle_type: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Capacity"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={vehicleForm.capacity}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      capacity: e.target.value,
                    })
                  }
                />

                <select
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={vehicleForm.status}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div>
                  <label className="text-sm text-zinc-500">
                    Insurance Expiry
                  </label>

                  <input
                    type="date"
                    className="w-full border border-zinc-300 rounded-2xl px-5 py-3 mt-2"
                    value={vehicleForm.insurance_expiry}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        insurance_expiry: e.target.value,
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
                    className="w-full border border-zinc-300 rounded-2xl px-5 py-3 mt-2"
                    value={vehicleForm.pollution_expiry}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        pollution_expiry: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-2xl font-semibold transition"
                >
                  Create Vehicle
                </button>

              </form>

            </div>

            {/* Driver Form */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">

              <div className="flex items-center gap-3 mb-6">
                <Users className="text-emerald-600" />

                <h2 className="text-2xl font-semibold">
                  Register Driver
                </h2>
              </div>

              <form
                onSubmit={handleDriverSubmit}
                className="space-y-5"
              >

                <input
                  type="text"
                  placeholder="Driver Name"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={driverForm.full_name}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      full_name: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={driverForm.phone_number}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      phone_number: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  placeholder="License Number"
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={driverForm.license_number}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      license_number: e.target.value,
                    })
                  }
                />

                <div>
                  <label className="text-sm text-zinc-500">
                    License Expiry
                  </label>

                  <input
                    type="date"
                    className="w-full border border-zinc-300 rounded-2xl px-5 py-3 mt-2"
                    value={driverForm.license_expiry}
                    onChange={(e) =>
                      setDriverForm({
                        ...driverForm,
                        license_expiry: e.target.value,
                      })
                    }
                  />
                </div>

                <select
                  className="w-full border border-zinc-300 rounded-2xl px-5 py-3"
                  value={driverForm.status}
                  onChange={(e) =>
                    setDriverForm({
                      ...driverForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-2xl font-semibold transition"
                >
                  Register Driver
                </button>

              </form>

            </div>

          </div>

          {/* Vehicles Table */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-10">

            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-blue-700" />

              <h2 className="text-2xl font-semibold">
                Vehicle Master
              </h2>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="bg-zinc-100 text-left">

                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Status</th>

                  </tr>

                </thead>

                <tbody>

                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b hover:bg-zinc-50"
                    >

                      <td className="p-4 font-medium">
                        {vehicle.vehicle_number}
                      </td>

                      <td className="p-4">
                        {vehicle.vehicle_type}
                      </td>

                      <td className="p-4">
                        {vehicle.capacity}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            vehicle.status === "available"
                              ? "bg-green-100 text-green-700"
                              : vehicle.status === "maintenance"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {vehicle.status}
                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* Recent Trips */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">

            <div className="flex items-center gap-3 mb-6">
              <MapPinned className="text-indigo-700" />

              <h2 className="text-2xl font-semibold">
                Recent Trips
              </h2>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="bg-zinc-100 text-left">

                    <th className="p-4">Trip ID</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Driver</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Status</th>

                  </tr>

                </thead>

                <tbody>

                  {trips.slice(0, 10).map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b hover:bg-zinc-50"
                    >

                      <td className="p-4 font-medium">
                        {trip.trip_id}
                      </td>

                      <td className="p-4">
                        {trip.vehicle_name}
                      </td>

                      <td className="p-4">
                        {trip.driver_name}
                      </td>

                      <td className="p-4">
                        {trip.route_name}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            trip.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : trip.status === "in_transit"
                              ? "bg-blue-100 text-blue-700"
                              : trip.status === "loading"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {trip.status}
                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}