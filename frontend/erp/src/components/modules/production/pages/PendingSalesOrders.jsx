import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

import {
  Factory,
  ClipboardList,
  Package,
  Settings,
  Play,
  LogOut
} from "lucide-react";

import api from "../../../../services/api";

export default function PendingSalesOrders() {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch MRP Data
  const fetchItems = async () => {

    try {

      const res = await api.get("/production/item-sales-summary/");

      const processed = res.data.map(item => {

        const stock = item.current_stock || 0;
        const required = item.total_sales_qty - stock;

        return {
          ...item,
          current_stock: stock,
          required_production: required > 0 ? required : 0
        };

      });

      setItems(processed);

    } catch (err) {

      console.error("MRP fetch error:", err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    if (!authLoading) {
      fetchItems();
    }

  }, [authLoading]);



  // Generate Planned Order
  const generateProductionPlan = async (item) => {

    if (item.required_production <= 0) {
      alert("No production required");
      return;
    }

    try {

      await api.post("/production/planned-orders/create/", {
        product: item.product__id,
        quantity: item.required_production
      });

      alert("Planned Order Created");

      fetchItems();

    } catch (err) {

      console.error(err);
      alert("Error generating planned order");

    }

  };


  // RUN MRP (Optional ERP feature)

  const runMRP = async () => {
  try {
    await api.post("/production/run-mrp/");
    alert("MRP completed");
    fetchItems();
  } catch (err) {
    alert("MRP failed");
  }
};



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

      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between items-center">

        <div className="flex items-center gap-4">

          <Factory className="w-9 h-9 text-cyan-400"/>

          <div>

            <h1 className="text-2xl font-bold text-cyan-300">
              MRP Planning Board
            </h1>

            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-IN")} • {user?.username}
            </p>

          </div>

        </div>


        {/* RUN MRP BUTTON */}

        <button
          onClick={runMRP}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
        >
          Run MRP
        </button>

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
              onClick={() => navigate("/manufacturing/dashboard")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <ClipboardList className="h-5 w-5 text-cyan-400"/>
              Dashboard
            </button>

            <button
              onClick={() => navigate("/production/planned-orders")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Package className="h-5 w-5 text-purple-400"/>
              Planned Orders
            </button>

            <button
              onClick={() => navigate("/production/manufacturing-orders")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Settings className="h-5 w-5 text-emerald-400"/>
              Manufacturing Orders
            </button>

          </nav>

          <div className="p-4 border-t border-gray-800">

            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-700 hover:bg-red-800"
            >
              <LogOut className="h-5 w-5"/>
              Logout
            </button>

          </div>

        </div>



        {/* MAIN CONTENT */}

        <div className="flex-1 p-8 overflow-auto">


          {loading ? (

            <div className="text-cyan-400 animate-pulse">
              Loading MRP Data...
            </div>

          ) : (

            <>

              {/* SUMMARY */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40">
                  <p className="text-sm text-cyan-400 uppercase">
                    Items
                  </p>
                  <p className="text-3xl font-bold text-cyan-300">
                    {items.length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40">
                  <p className="text-sm text-purple-400 uppercase">
                    Total Demand
                  </p>
                  <p className="text-3xl font-bold text-purple-300">
                    {items.reduce((sum,i)=>sum+Number(i.total_sales_qty||0),0)}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40">
                  <p className="text-sm text-yellow-400 uppercase">
                    Production Needed
                  </p>
                  <p className="text-3xl font-bold text-yellow-300">
                    {items.reduce((sum,i)=>sum+Number(i.required_production||0),0)}
                  </p>
                </div>

              </div>



              {/* TABLE */}

              <div className="bg-gray-900/70 rounded-2xl p-6 border border-gray-800">

                <h2 className="text-xl font-bold mb-4 text-cyan-300">
                  Material Requirement Planning
                </h2>

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-gray-700 text-left text-gray-300">

                      <th className="py-2">Item</th>
                      <th>Code</th>
                      <th>UOM</th>
                      <th>Sales Qty</th>
                      <th>Stock</th>
                      <th>Required</th>
                      <th>Sales Orders</th>
                      <th className="text-center">Action</th>

                    </tr>

                  </thead>

                  <tbody>

                    {items.map((item,index)=>(

                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/40">

                        <td className="py-2">{item.product__name}</td>

                        <td>{item.product__code}</td>

                        <td>{item.product__uom}</td>

                        <td className="text-cyan-300 font-semibold">
                          {item.total_sales_qty}
                        </td>

                        <td>{item.current_stock}</td>

                        <td className="font-semibold text-yellow-300">
                          {item.required_production}
                        </td>


                        <td>

                          <div className="flex flex-wrap gap-2">

                            {(item.sales_orders || []).map((so,i)=>(
                              <span
                                key={i}
                                className="bg-gray-800 px-2 py-1 rounded text-xs text-cyan-300"
                              >
                                {so}
                              </span>
                            ))}

                          </div>

                        </td>


                        <td className="text-center">

                          <button
                            disabled={item.required_production === 0}
                            onClick={()=>generateProductionPlan(item)}
                            className={`flex items-center gap-2 px-3 py-1 rounded mx-auto ${
                              item.required_production === 0
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >

                            <Play size={16}/>
                            Plan

                          </button>

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