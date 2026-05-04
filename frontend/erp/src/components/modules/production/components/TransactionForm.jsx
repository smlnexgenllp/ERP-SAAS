// src/pages/MaterialTransfer.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  AlertTriangle, 
  Printer, 
  Send, 
  X, 
  Loader2, 
  RefreshCw, 
  ArrowLeft,
  AlertCircle
} from "lucide-react";

export default function MaterialTransfer() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  const [form, setForm] = useState({
    from_department: "",
    to_department: "",
    item: "",
    quantity: "",
    sent_by: "",
  });

  const [availableStock, setAvailableStock] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);

  const [slipData, setSlipData] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setDataLoading(true);
    try {
      const [deptRes, itemRes, empRes] = await Promise.all([
        api.get("/hr/departments/"),
        api.get("/inventory/items/"),
        api.get("/hr/employees/"),
      ]);

      setDepartments(deptRes.data?.results || deptRes.data || []);
      setItems(itemRes.data?.results || itemRes.data || []);
      setAllEmployees(empRes.data?.results || empRes.data || []);
    } catch (err) {
      console.error("Master data load failed:", err);
      setError("Failed to load master data. Please refresh the page.");
    } finally {
      setDataLoading(false);
    }
  };

  // Filter employees by selected From Department
  const filteredEmployees = useMemo(() => {
    if (!form.from_department) return [];
    return allEmployees.filter(emp => {
      const empDept = emp.department?.id || emp.department_id || emp.department;
      return String(empDept) === String(form.from_department);
    });
  }, [allEmployees, form.from_department]);

  // Capture selected employee name for printing
  useEffect(() => {
    if (form.sent_by) {
      const employee = allEmployees.find(emp => String(emp.id) === String(form.sent_by));
      const empName = employee 
        ? (employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.name || 'Unknown')
        : '';
      setSelectedEmployeeName(empName);
    } else {
      setSelectedEmployeeName("");
    }
  }, [form.sent_by, allEmployees]);

  // Stock fetching
  useEffect(() => {
    if (form.item && form.from_department) {
      fetchAvailableStock();
    } else {
      setAvailableStock(0);
    }
  }, [form.item, form.from_department]);

  const fetchAvailableStock = async () => {
    setStockLoading(true);
    setAvailableStock(0);
    try {
      const res = await api.get(`/inventory/department-stock/`, {
        params: { item: form.item, department: form.from_department },
      });
      const stock = res.data?.stock ?? res.data?.available_stock ?? res.data?.quantity ?? 0;
      setAvailableStock(stock);
    } catch (err) {
      console.error("Stock fetch error:", err);
      setAvailableStock(0);
    } finally {
      setStockLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");

    if (name === "from_department") {
      setForm(prev => ({ ...prev, sent_by: "" }));
    }
  };

  const validateForm = () => {
    if (!form.from_department) return "Select source department";
    if (!form.to_department) return "Select target department";
    if (form.from_department === form.to_department) return "From and To departments cannot be the same";
    if (!form.item) return "Select item/material";
    if (!form.quantity || Number(form.quantity) <= 0) return "Enter valid quantity";
    if (Number(form.quantity) > availableStock) return `Only ${availableStock} available in selected department`;
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        from_department: form.from_department,
        to_department: form.to_department,
        item: form.item,
        quantity: Number(form.quantity),
        sent_by: form.sent_by || null,
      };

      const response = await api.post("/inventory/material-transfer/", payload);

      const enhancedSlipData = {
        ...response.data,
        sent_by_name: selectedEmployeeName || "Not Specified",
      };

      setSlipData(enhancedSlipData);
      setSuccessMessage("Material transfer completed successfully!");

      setForm({ from_department: "", to_department: "", item: "", quantity: "", sent_by: "" });
      setAvailableStock(0);
      setIsSlipModalOpen(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("slipPrintArea")?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Material Transfer Slip</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #000; line-height: 1.6; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
            .info-row { display: flex; margin-bottom: 12px; font-size: 15px; }
            .label { width: 180px; font-weight: bold; color: #222; }
            .value { flex: 1; }
            hr { border: 0; border-top: 1px solid #999; margin: 25px 0; }
            .signature { margin-top: 60px; text-align: center; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const closeModal = () => {
    setIsSlipModalOpen(false);
    setSlipData(null);
    setSuccessMessage("");
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading departments, items & employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Send className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Material Transfer
                </h1>
                <p className="text-zinc-500">Transfer items between departments</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle size={22} />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-8 bg-emerald-100 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <CheckCircle size={22} />
            {successMessage}
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">From Department *</label>
              <select
                name="from_department"
                value={form.from_department}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                disabled={loading}
              >
                <option value="">Select source department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">To Department *</label>
              <select
                name="to_department"
                value={form.to_department}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                disabled={loading}
              >
                <option value="">Select destination department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Item / Material *</label>
              <select
                name="item"
                value={form.item}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                disabled={loading}
              >
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.code ? `(${i.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="Enter quantity"
                disabled={loading}
              />
              <div className="mt-2 text-sm flex items-center gap-2">
                {stockLoading ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <RefreshCw size={16} className="animate-spin" /> Checking stock...
                  </span>
                ) : (
                  <span className={availableStock > 0 ? "text-emerald-600" : "text-red-600"}>
                    Available: <strong>{availableStock}</strong> units
                  </span>
                )}
              </div>
            </div>

            {/* Sent By - Filtered by From Department */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-600 mb-2">
                Sent By (Issuer) {form.from_department ? "" : "(Select From Department first)"}
              </label>
              <select
                name="sent_by"
                value={form.sent_by}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                disabled={loading || !form.from_department}
              >
                <option value="">
                  {form.from_department ? "Select employee" : "Select From Department first"}
                </option>
                {filteredEmployees.map((emp) => {
                  const empName = emp.full_name || 
                                 `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 
                                 emp.name || `Employee ${emp.id}`;
                  return (
                    <option key={emp.id} value={emp.id}>
                      {empName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-3xl font-medium text-lg flex items-center justify-center gap-3 transition-all ${
                  loading 
                    ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" 
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    Processing Transfer...
                  </>
                ) : (
                  <>
                    <Send size={22} />
                    Complete Material Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Slip Modal */}
        {isSlipModalOpen && slipData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-2xl font-semibold text-zinc-900">Material Transfer Slip</h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-zinc-50">
                <div id="slipPrintArea" className="bg-white text-black p-10 rounded-2xl border border-zinc-200">
                  <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold uppercase tracking-widest">Material Transfer Slip</h1>
                    <p className="text-zinc-600 mt-2">Inter-Department Material Movement</p>
                  </div>

                  <div className="space-y-6 text-lg">
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">Transfer ID</div>
                      <div className="font-mono">#{slipData.id}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">Date & Time</div>
                      <div>{new Date(slipData.created_at).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">From Department</div>
                      <div>{slipData.from_department_name || "—"}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">To Department</div>
                      <div>{slipData.to_department_name || "—"}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">Item</div>
                      <div>{slipData.item_name || "—"}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">Quantity Transferred</div>
                      <div className="text-2xl font-bold text-emerald-600">{slipData.quantity}</div>
                    </div>
                    <div className="flex border-b pb-4">
                      <div className="w-52 font-semibold text-zinc-600">Sent By</div>
                      <div className="font-medium">{slipData.sent_by_name || "Not Specified"}</div>
                    </div>
                  </div>

                  <hr className="my-12 border-zinc-300" />

                  <div className="text-center text-sm text-zinc-500 mt-8">
                    <p>Generated on {new Date().toLocaleDateString("en-IN")}</p>
                    <div className="mt-16">
                      <p className="border-t border-zinc-400 inline-block pt-2 px-16">
                        Authorized Signature
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex gap-4">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-medium text-zinc-700"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium flex items-center justify-center gap-3"
                >
                  <Printer size={20} />
                  Print Slip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}