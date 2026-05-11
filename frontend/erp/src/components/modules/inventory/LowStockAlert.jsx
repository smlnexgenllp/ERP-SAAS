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
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-5 font-medium">
            Loading low stock alerts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            Low Stock Alerts
          </h1>

          <p className="text-zinc-500 mt-2">
            Items that require immediate attention
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
        >
          ← Back
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-8 py-5 font-semibold text-zinc-600">
                Item
              </th>

              <th className="px-8 py-5 text-center font-semibold text-zinc-600">
                Type
              </th>

              <th className="px-8 py-5 text-center font-semibold text-zinc-600">
                Total Stock
              </th>

              <th className="px-8 py-5 text-center font-semibold text-zinc-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {lowStockItems.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-16 text-emerald-600 font-medium"
                >
                  No low stock items 🎉
                </td>
              </tr>
            )}

            {lowStockItems.map((item) => {
              const total = getTotalStock(item.id);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  {/* Item */}
                  <td className="px-8 py-5 text-zinc-900 font-medium">
                    {item.name}
                  </td>

                  {/* Type */}
                  <td className="px-8 py-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.item_type === "purchase"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.item_type}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-8 py-5 text-center">
                    <span className="text-red-600 font-bold text-lg">
                      {total}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-8 py-5 text-center">
                    {item.item_type === "purchase" && (
                      <button
                        onClick={() =>
                          navigate(`/purchase-orders?item=${item.id}`)
                        }
                        className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-2xl transition font-medium"
                      >
                        Create PO
                      </button>
                    )}

                    {item.item_type === "production" && (
                      <button
                        onClick={() =>
                          alert("Please Contact your Accounts Teams!")
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition font-medium"
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