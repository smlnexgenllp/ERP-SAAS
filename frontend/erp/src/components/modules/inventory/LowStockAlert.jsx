import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function LowStockAlerts() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, itemRes, stockRes] = await Promise.all([
        api.get("/hr/departments/"),
        api.get("/inventory/items/"),
        api.get("/inventory/all-department-stock/")
      ]);

      const departments = deptRes.data || [];
      const items = itemRes.data || [];
      const stockData = stockRes.data || [];

      setDepartments(departments);
      setItems(items);

      // ✅ Build stock map
      const map = {};
      stockData.forEach((row) => {
        if (!map[row.item]) map[row.item] = {};
        map[row.item][row.department] = Number(row.stock || 0);
      });

      setStockMap(map);

      // ✅ Low stock filter (STRICT)
      const lowStock = items.filter((item) => {
        const total = departments.reduce((sum, dept) => {
          return sum + Number(map[item.id]?.[dept.id] || 0);
        }, 0);

        return Number(total) === 0;
      });

      setLowStockItems(lowStock);

    } catch (err) {
      console.error("Error loading low stock data", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (itemId) => {
    return departments.reduce((sum, dept) => {
      return sum + Number(stockMap[itemId]?.[dept.id] || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading low stock alerts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* Header */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-red-400">
          Low Stock Alerts
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
        >
          ← Back
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto border border-slate-800 rounded-xl">

        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-900">
            <tr>
              <th className="p-3 border border-slate-800">Item</th>
              <th className="p-3 border border-slate-800 text-center">Type</th>
              <th className="p-3 border border-slate-800 text-center">Total Stock</th>
              <th className="p-3 border border-slate-800 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {lowStockItems.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-4 text-green-400">
                  No low stock items 🎉
                </td>
              </tr>
            )}

            {lowStockItems.map((item) => {
              const total = getTotalStock(item.id);

              return (
                <tr key={item.id} className="hover:bg-slate-900">

                  {/* Item */}
                  <td className="p-3 border border-slate-800 text-cyan-200">
                    {item.name}
                  </td>

                  {/* Type */}
                  <td className="p-3 border text-center border-slate-800 text-yellow-300">
                    {item.item_type}
                  </td>

                  {/* Total */}
                  <td className="p-3 border text-center border-slate-800 text-red-400 font-bold">
                    {total}
                  </td>

                  {/* Actions */}
                  <td className="p-3 border text-center border-slate-800">

                    {item.item_type === "purchase" && (
                      <button
                        onClick={() => navigate(`/purchase-orders?item=${item.id}`)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        Create POF
                      </button>
                    )}

                    {item.item_type === "production" && (
                      <button
                        onClick={() => alert("Please Contact your Accounts Teams!")}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
                      >
                        Create Production
                      </button>
                    )}

                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}