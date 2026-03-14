import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

import {
  Factory,
  Settings,
  Package,
  ClipboardList,
  Play,
  CheckCircle,
  LogOut
} from "lucide-react";

import api from "../../../../services/api";

export default function ManufacturingDashboard() {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [manufacturingOrders, setManufacturingOrders] = useState([]);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const fetchDashboard = async () => {
    try {

      const [plansRes, plannedRes, moRes] = await Promise.all([
        api.get("/production/production-plans/"),
        api.get("/production/planned-orders/"),
        api.get("/production/manufacturing-orders/")
      ]);

      setPlans(plansRes.data);
      setPlannedOrders(plannedRes.data);
      setManufacturingOrders(moRes.data);

    } catch (err) {
      console.error("Manufacturing dashboard error:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDashboard();
    }
  }, [authLoading]);

  const runMRP = async (id) => {
    await api.post(`/production/run-mrp/${id}/`);
    fetchDashboard();
  };

  const convertMO = async (id) => {
    await api.post(`/production/convert-mo/${id}/`);
    fetchDashboard();
  };

  const startMO = async (id) => {
    await api.post(`/production/manufacturing-orders/start/${id}/`);
    fetchDashboard();
  };

  const completeMO = async (id) => {
    await api.post(`/production/manufacturing-orders/complete/${id}/`);
    fetchDashboard();
  };

  const running = manufacturingOrders.filter(m => m.status === "in_progress").length;
  const completed = manufacturingOrders.filter(m => m.status === "done").length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">

      {/* HEADER */}

      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between">

        <div className="flex items-center gap-4">

          <Factory className="w-9 h-9 text-cyan-400" />

          <div>
            <h1 className="text-2xl font-bold text-cyan-300">
              Manufacturing Dashboard
            </h1>

            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-IN")} • {user?.username}
            </p>
          </div>

        </div>

      </header>

      <div className="flex flex-1">

        {/* SIDEBAR */}

        <div className="w-72 border-r border-gray-800 bg-gray-900/60 flex flex-col">

          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-cyan-300">
              Manufacturing
            </h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">

            <button
              onClick={() => navigate("/production/plans")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <ClipboardList className="h-5 w-5 text-cyan-400" />
              Production Plans
            </button>

            <button
              onClick={() => navigate("/production/planned-orders")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Package className="h-5 w-5 text-purple-400" />
              Planned Orders
            </button>

            <button
              onClick={() => navigate("/production/manufacturing-orders")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Settings className="h-5 w-5 text-emerald-400" />
              Manufacturing Orders
            </button>

          </nav>

          <div className="p-4 border-t border-gray-800">

            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-700 hover:bg-red-800"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>

          </div>

        </div>

        {/* MAIN CONTENT */}

        <div className="flex-1 p-8 overflow-auto">

          {dashboardLoading ? (
            <div className="text-cyan-400 animate-pulse">
              Loading dashboard...
            </div>
          ) : (

            <>
              {/* SUMMARY CARDS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40">
                  <p className="text-sm text-cyan-400 uppercase">
                    Production Plans
                  </p>
                  <p className="text-3xl font-bold text-cyan-300">
                    {plans.length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40">
                  <p className="text-sm text-purple-400 uppercase">
                    Planned Orders
                  </p>
                  <p className="text-3xl font-bold text-purple-300">
                    {plannedOrders.length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40">
                  <p className="text-sm text-yellow-400 uppercase">
                    Running Production
                  </p>
                  <p className="text-3xl font-bold text-yellow-300">
                    {running}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40">
                  <p className="text-sm text-green-400 uppercase">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-300">
                    {completed}
                  </p>
                </div>

              </div>

              {/* PRODUCTION PLANS TABLE */}

              <div className="bg-gray-900/70 rounded-2xl p-6 mb-8 border border-gray-800">

                <h2 className="text-xl font-bold mb-4 text-cyan-300">
                  Production Plans
                </h2>

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-gray-700">
                      <th>ID</th>
                      <th>Sales Order</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {plans.map(p => (

                      <tr key={p.id} className="border-b border-gray-800">

                        <td>{p.id}</td>
                        <td>{p.sales_order}</td>
                        <td>{p.status}</td>

                        <td>

                          {p.status !== "mrp_done" && (
                            <button
                              onClick={() => runMRP(p.id)}
                              className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded"
                            >
                              <Play size={16}/>
                              Run MRP
                            </button>
                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {/* MANUFACTURING ORDERS */}

              <div className="bg-gray-900/70 rounded-2xl p-6 border border-gray-800">

                <h2 className="text-xl font-bold mb-4 text-cyan-300">
                  Manufacturing Orders
                </h2>

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-gray-700">
                      <th>ID</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {manufacturingOrders.map(m => (

                      <tr key={m.id} className="border-b border-gray-800">

                        <td>{m.id}</td>
                        <td>{m.product}</td>
                        <td>{m.quantity}</td>
                        <td>{m.status}</td>

                        <td>

                          {m.status === "draft" && (
                            <button
                              onClick={() => startMO(m.id)}
                              className="bg-yellow-600 px-3 py-1 rounded"
                            >
                              Start
                            </button>
                          )}

                          {m.status === "in_progress" && (
                            <button
                              onClick={() => completeMO(m.id)}
                              className="flex items-center gap-2 bg-green-600 px-3 py-1 rounded"
                            >
                              <CheckCircle size={16}/>
                              Complete
                            </button>
                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  );
}