import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Import the responsive Sidebar
import TransportSidebar from "./components/TransportSidebar";

import {
  Truck,
  Route,
  Fuel,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  MapPinned,
  AlertCircle,
} from "lucide-react";

import api from "../../../services/api";

export default function TransportDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [vehicleRes, tripRes, fuelRes, expenseRes, invoiceRes] = await Promise.all([
        api.get("/transport/vehicles/"),
        api.get("/transport/trips/"),
        api.get("/transport/fuel-entries/"),
        api.get("/transport/transport-expenses/"),
        api.get("/transport/transport-invoices/"),
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

  // Calculations
  const totalTrips = trips.length;
  const activeTrips = trips.filter(
    (trip) =>
      trip.status === "loading" ||
      trip.status === "dispatched" ||
      trip.status === "in_transit"
  ).length;

  const completedTrips = trips.filter((trip) => trip.status === "delivered").length;
  const remainingTrips = totalTrips - completedTrips;

  const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
  const vehiclesInUse = vehicles.filter((v) => 
    ["in_transit", "dispatched", "loading"].includes(v.status)
  ).length;

  const totalFuelCost = fuelEntries.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalInvoice = invoices.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  const pendingInvoices = invoices.filter(
    (inv) => inv.payment_status !== "paid"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-zinc-600">Loading Transport Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      {/* Responsive Sidebar */}
      <TransportSidebar 
        active="dashboard" 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Header */}
        <header className="bg-white border-b px-4 md:px-6 lg:px-8 py-5 lg:py-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center flex-shrink-0">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Transport Dashboard</h1>
              <p className="text-zinc-500 text-sm">ERP Transport Management System</p>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Total Trips</p>
                <Route className="text-blue-600" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">{totalTrips}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Active Trips</p>
                <Clock className="text-amber-600" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">{activeTrips}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Delivered</p>
                <CheckCircle2 className="text-green-600" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">{completedTrips}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Remaining Trips</p>
                <AlertCircle className="text-orange-600" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-orange-600">
                {remainingTrips}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Pending Delivery</p>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Maintenance</p>
                <Wrench className="text-red-600" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">{maintenanceVehicles}</h2>
            </div>
          </div>

          {/* Finance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Fuel Cost</p>
                <Fuel className="text-yellow-600" />
              </div>
              <h2 className="text-3xl font-bold">₹ {totalFuelCost.toLocaleString()}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Total Expenses</p>
                <AlertTriangle className="text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold">₹ {totalExpense.toLocaleString()}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Invoice Value</p>
                <FileText className="text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold">₹ {totalInvoice.toLocaleString()}</h2>
            </div>

            <div className="bg-white rounded-3xl border p-6 lg:p-8">
              <div className="flex justify-between mb-5">
                <p className="text-zinc-500">Pending Invoices</p>
                <AlertCircle className="text-rose-600" />
              </div>
              <h2 className="text-3xl font-bold text-rose-600">{pendingInvoices}</h2>
              <p className="text-sm text-zinc-500 mt-1">Unpaid</p>
            </div>
          </div>

          {/* Recent Vehicles */}
          {/* <div className="bg-white border rounded-3xl p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Truck className="text-blue-700" />
                <h2 className="text-2xl font-semibold">Recent Vehicles</h2>
              </div>
              <span className="text-sm text-zinc-500">
                Showing {Math.min(5, vehicles.length)} of {vehicles.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
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
                    <tr key={vehicle.id} className="border-b hover:bg-zinc-50">
                      <td className="p-4 font-medium">{vehicle.vehicle_number}</td>
                      <td className="p-4">{vehicle.vehicle_type}</td>
                      <td className="p-4">{vehicle.capacity}</td>
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
          </div> */}

          {/* Recent Trips */}
          {/* <div className="bg-white border rounded-3xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPinned className="text-indigo-700" />
                <h2 className="text-2xl font-semibold">Recent Trips</h2>
              </div>
              <span className="text-sm text-zinc-500">
                Showing {Math.min(10, trips.length)} of {trips.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
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
                    <tr key={trip.id} className="border-b hover:bg-zinc-50">
                      <td className="p-4">{trip.trip_number || trip.trip_id}</td>
                      <td className="p-4">{trip.vehicle_name}</td>
                      <td className="p-4">{trip.driver_name}</td>
                      <td className="p-4">{trip.route_name}</td>
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
          </div> */}
        </main>
      </div>
    </div>
  );
}