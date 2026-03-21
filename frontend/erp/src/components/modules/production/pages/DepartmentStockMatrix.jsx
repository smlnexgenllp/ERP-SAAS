import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { useNavigate } from "react-router-dom";

export default function DepartmentStockMatrix() {
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [deptRes, itemRes, stockRes] = await Promise.all([
        api.get("/hr/departments/").catch(() => ({ data: [] })),
        api.get("/inventory/items/").catch(() => ({ data: [] })),
        api.get("/inventory/all-department-stock/").catch(() => ({ data: [] }))
      ]);

      setDepartments(deptRes.data || []);
      setItems(itemRes.data || []);

      const map = {};
      (stockRes.data || []).forEach((row) => {
        if (!map[row.item]) map[row.item] = {};
        map[row.item][row.department] = row.stock;
      });

      setStockMap(map);
    } catch (err) {
      console.error("Error loading stock matrix", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtered items
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Totals
  const getRowTotal = (itemId) => {
    return departments.reduce((sum, dept) => {
      if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return sum;
      return sum + (stockMap[itemId]?.[dept.id] || 0);
    }, 0);
  };

  const getColumnTotal = (deptId) => {
    if (selectedDept !== "all" && deptId !== Number(selectedDept)) return null;

    return filteredItems.reduce((sum, item) => {
      return sum + (stockMap[item.id]?.[deptId] || 0);
    }, 0);
  };

  const getGrandTotal = () => {
    return filteredItems.reduce((sum, item) => sum + getRowTotal(item.id), 0);
  };

  // ✅ Loader (Fix blank page)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading stock data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-cyan-300">
          Department Stock Matrix
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
        >
          ← Back
        </button>
      </div>

      {/* ✅ Filters */}
      <div className="flex gap-4 mb-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-700"
        />

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-700"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

      </div>

      {/* Table */}
      <div className="overflow-auto border border-slate-800 rounded-xl">

        <table className="w-full text-sm text-left border-collapse">

          <thead className="bg-slate-900">
            <tr>
              <th className="p-3 border border-slate-800">Item</th>

              {departments.map((dept) => {
                if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;

                return (
                  <th key={dept.id} className="p-3 border text-center border-slate-800">
                    {dept.name}
                  </th>
                );
              })}

              <th className="p-3 border text-center border-slate-800 text-yellow-400">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900">

                <td className="p-3 border border-slate-800 text-cyan-200">
                  {item.name}
                </td>

                {departments.map((dept) => {
                  if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;

                  const qty = stockMap[item.id]?.[dept.id] || 0;

                  return (
                    <td
                      key={dept.id}
                      className={`p-3 border text-center border-slate-800
                        ${qty === 0 ? "text-red-400" : "text-green-400"}
                      `}
                    >
                      {qty}
                    </td>
                  );
                })}

                <td className="p-3 border text-center border-slate-800 text-yellow-300 font-bold">
                  {getRowTotal(item.id)}
                </td>

              </tr>
            ))}

            {/* Totals Row */}
            <tr className="bg-slate-900 font-bold">
              <td className="p-3 border border-slate-800 text-yellow-400">
                Total
              </td>

              {departments.map((dept) => {
                const total = getColumnTotal(dept.id);
                if (total === null) return null;

                return (
                  <td key={dept.id} className="p-3 border text-center border-slate-800 text-yellow-300">
                    {total}
                  </td>
                );
              })}

              <td className="p-3 border text-center border-slate-800 text-green-400">
                {getGrandTotal()}
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}