// src/pages/inventory/DepartmentStockMatrix.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  ArrowLeft, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading stock matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Department Stock Matrix
                </h1>
                <p className="text-zinc-500">Cross-department inventory overview</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Department Filter</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-6 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAllData}
                className="w-full px-6 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
              >
                Refresh Matrix
              </button>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600 sticky left-0 bg-zinc-50">Item</th>
                  {departments.map((dept) => {
                    if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;
                    return (
                      <th key={dept.id} className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">
                        {dept.name}
                      </th>
                    );
                  })}
                  <th className="px-8 py-5 text-center text-sm font-semibold text-amber-600">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="100" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 text-zinc-300 mb-6" />
                        <p className="text-xl font-medium text-zinc-600">No items found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-medium text-zinc-900 sticky left-0 bg-white">
                        {item.name}
                      </td>

                      {departments.map((dept) => {
                        if (selectedDept !== "all" && dept.id !== Number(selectedDept)) return null;

                        const qty = stockMap[item.id]?.[dept.id] || 0;

                        return (
                          <td
                            key={dept.id}
                            className={`px-8 py-6 text-center font-medium border-l border-zinc-100 ${
                              qty === 0 ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {qty}
                          </td>
                        );
                      })}

                      <td className="px-8 py-6 text-center font-bold text-amber-600 border-l border-zinc-100">
                        {getRowTotal(item.id)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Grand Total Row */}
                <tr className="bg-zinc-50 font-semibold">
                  <td className="px-8 py-6 text-amber-600">Grand Total</td>
                  {departments.map((dept) => {
                    const total = getColumnTotal(dept.id);
                    if (total === null) return null;
                    return (
                      <td key={dept.id} className="px-8 py-6 text-center text-amber-600 border-l border-zinc-100">
                        {total}
                      </td>
                    );
                  })}
                  <td className="px-8 py-6 text-center text-emerald-600 border-l border-zinc-100">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 px-4">
            <div className="text-sm text-zinc-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredItems.length)} 
              of {filteredItems.length} items
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} /> Previous
              </button>

              <div className="px-8 py-3 bg-white border border-zinc-200 rounded-2xl font-medium text-zinc-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}