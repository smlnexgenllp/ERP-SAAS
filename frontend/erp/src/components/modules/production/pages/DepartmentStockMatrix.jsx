// src/pages/inventory/DepartmentStockMatrix.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  ArrowLeft, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function DepartmentStockMatrix() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading stock matrix", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered items (search only)
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Totals
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center text-cyan-300">
        Loading stock data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/manufacturing/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-cyan-300">Department Stock Matrix</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 py-3 focus:border-cyan-500 outline-none text-gray-100"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none text-gray-100"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4 text-left border-b border-gray-700">Item</th>
                  {departments.map((dept) => {
                    if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;
                    return (
                      <th key={dept.id} className="p-4 text-center border-b border-gray-700">
                        {dept.name}
                      </th>
                    );
                  })}
                  <th className="p-4 text-center border-b border-gray-700 text-yellow-400 font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50">
                    <td className="p-4 font-medium text-cyan-200">{item.name}</td>

                    {departments.map((dept) => {
                      if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;

                      const qty = stockMap[item.id]?.[dept.id] || 0;

                      return (
                        <td
                          key={dept.id}
                          className={`p-4 text-center border-l border-gray-800 ${
                            qty === 0 ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {qty}
                        </td>
                      );
                    })}

                    <td className="p-4 text-center text-yellow-300 font-bold border-l border-gray-800">
                      {getRowTotal(item.id)}
                    </td>
                  </tr>
                ))}

                {/* Grand Total Row */}
                <tr className="bg-gray-800 font-bold">
                  <td className="p-4 text-yellow-400">Total</td>
                  {departments.map((dept) => {
                    const total = getColumnTotal(dept.id);
                    if (total === null) return null;
                    return (
                      <td key={dept.id} className="p-4 text-center text-yellow-300 border-l border-gray-800">
                        {total}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center text-green-400 border-l border-gray-800">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredItems.length)} 
              of {filteredItems.length} items
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <div className="px-5 py-2 bg-gray-800 rounded-xl text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}