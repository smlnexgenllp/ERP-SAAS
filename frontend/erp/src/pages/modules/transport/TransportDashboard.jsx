import React, { useEffect, useState } from "react";

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
  MapPinned,Receipt
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
      icon: Route,           // ← Routes Menu Item
      label: "Routes",
      path: "/transport/routes",
      key: "routes",
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
    {
  icon: Receipt,
  label: "Expenses",
  path: "/transport/expenses",
  key: "expenses",
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
  const [trips, setTrips] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        vehicleRes,
        tripRes,
        fuelRes,
        expenseRes,
        invoiceRes,
      ] = await Promise.all([
        api.get("/transport/vehicles/"),
        api.get("/transport/trips/"),
        api.get("/transport/fuel-entries/"),
        api.get("/transport/expenses/"),
        api.get("/transport/invoices/"),
      ]);

      setVehicles(vehicleRes.data || []);
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>

          <p className="mt-4 text-zinc-600">
            Loading Transport Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-100">

      <TransportSidebar active="dashboard" />

      <div className="flex-1 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b px-8 py-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Transport Dashboard
              </h1>

              <p className="text-zinc-500 text-sm">
                ERP Transport Management System
              </p>
            </div>

          </div>

        </header>

        <main className="flex-1 overflow-y-auto p-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Total Trips</p>
                <Route className="text-blue-600" />
              </div>

              <h2 className="text-5xl font-bold">
                {totalTrips}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Active Trips</p>
                <Clock className="text-amber-600" />
              </div>

              <h2 className="text-5xl font-bold">
                {activeTrips}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Delivered Trips</p>
                <CheckCircle2 className="text-green-600" />
              </div>

              <h2 className="text-5xl font-bold">
                {completedTrips}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Maintenance</p>
                <Wrench className="text-red-600" />
              </div>

              <h2 className="text-5xl font-bold">
                {maintenanceVehicles}
              </h2>
            </div>

          </div>

          {/* Finance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Fuel Cost</p>
                <Fuel className="text-yellow-600" />
              </div>

              <h2 className="text-3xl font-bold">
                ₹ {totalFuelCost.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Expenses</p>
                <AlertTriangle className="text-purple-600" />
              </div>

              <h2 className="text-3xl font-bold">
                ₹ {totalExpense.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Invoice Value</p>
                <FileText className="text-indigo-600" />
              </div>

              <h2 className="text-3xl font-bold">
                ₹ {totalInvoice.toLocaleString()}
              </h2>
            </div>

          </div>

          {/* Vehicle Summary */}
          <div className="bg-white border rounded-3xl p-8 mb-8">

            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-blue-700" />
              <h2 className="text-2xl font-semibold">
                Recent Vehicles
              </h2>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-zinc-100">
                    <th className="text-left p-4">Vehicle No</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Capacity</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {vehicles.slice(0, 5).map((vehicle) => (
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
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
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
          <div className="bg-white border rounded-3xl p-8">

            <div className="flex items-center gap-3 mb-6">
              <MapPinned className="text-indigo-700" />
              <h2 className="text-2xl font-semibold">
                Recent Trips
              </h2>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-zinc-100">
                    <th className="p-4 text-left">Trip</th>
                    <th className="p-4 text-left">Vehicle</th>
                    <th className="p-4 text-left">Driver</th>
                    <th className="p-4 text-left">Route</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>

                  {trips.slice(0, 10).map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b hover:bg-zinc-50"
                    >
                      <td className="p-4">
                        {trip.trip_number || trip.trip_id}
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
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
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