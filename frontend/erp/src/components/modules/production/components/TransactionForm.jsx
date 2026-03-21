import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { AlertTriangle, Printer, Send, X } from "lucide-react";

export default function MaterialTransfer() {
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);

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
  const [slipData, setSlipData] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [deptRes, itemRes, empRes] = await Promise.all([
        api.get("/hr/departments/"),
        api.get("/inventory/items/"),
        api.get("/hr/employees/"),
      ]);
      setDepartments(deptRes.data || []);
      setItems(itemRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  useEffect(() => {
    if (form.item && form.from_department) {
      fetchAvailableStock();
    } else {
      setAvailableStock(0);
    }
  }, [form.item, form.from_department]);

  const fetchAvailableStock = async () => {
    try {
      const res = await api.get(
        `/inventory/department-stock/?item=${form.item}&department=${form.from_department}`
      );
      setAvailableStock(res.data?.stock ?? 0);
    } catch {
      setAvailableStock(0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!form.from_department) return "Select source department";
    if (!form.to_department) return "Select target department";
    if (form.from_department === form.to_department) return "From and To departments cannot be the same";
    if (!form.item) return "Select item/material";
    if (!form.quantity || Number(form.quantity) <= 0) return "Enter valid quantity";
    if (Number(form.quantity) > availableStock) {
      return `Quantity (${form.quantity}) exceeds available stock (${availableStock})`;
    }
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
    setSuccessMessage("");

    try {
      const payload = {
        from_department: form.from_department,
        to_department: form.to_department,
        item: form.item,
        quantity: Number(form.quantity),
        sent_by: form.sent_by || null,
      };

      const response = await api.post("/inventory/material-transfer/", payload);

      setSlipData(response.data);
      setSuccessMessage("Material transfer completed successfully");

      // Reset form **after** saving slip data
      setForm({
        from_department: "",
        to_department: "",
        item: "",
        quantity: "",
        sent_by: "",
      });
      setAvailableStock(0);

      // Open modal with real data
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
            body { font-family: Arial, Helvetica, sans-serif; margin: 40px; color: #000; line-height: 1.5; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            .company { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 8px; }
            .slip-container { max-width: 700px; margin: 0 auto; }
            .info-row { display: flex; margin-bottom: 12px; font-size: 15px; }
            .label { width: 180px; font-weight: bold; color: #222; }
            .value { flex: 1; }
            hr { border: 0; border-top: 1px solid #999; margin: 25px 0; }
            .footer { text-align: center; margin-top: 50px; font-size: 14px; color: #444; }
            .signature { margin-top: 60px; text-align: center; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const closeModal = () => {
    setIsSlipModalOpen(false);
    setSlipData(null);
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Material Transfer</h1>
        <p className="text-slate-400 mt-1">Transfer items between departments</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && !isSlipModalOpen && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-900/30 border border-green-700 px-4 py-3">
          <Send size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium">From Department *</label>
            <select
              name="from_department"
              value={form.from_department}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
              disabled={loading}
            >
              <option value="">Select source department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">To Department *</label>
            <select
              name="to_department"
              value={form.to_department}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
              disabled={loading}
            >
              <option value="">Select destination department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Item / Material *</label>
            <select
              name="item"
              value={form.item}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
              disabled={loading}
            >
              <option value="">Select item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="1"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
              placeholder="Enter quantity"
              disabled={loading}
            />
            <p className={`text-xs mt-1.5 ${availableStock > 0 ? "text-green-400" : "text-red-400"}`}>
              Available stock: {availableStock}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium">Sent By (Issuer)</label>
            <select
              name="sent_by"
              value={form.sent_by}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
              disabled={loading}
            >
              <option value="">Select employee (optional)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={18} />
              {loading ? "Processing..." : "Complete Transfer"}
            </button>
          </div>
        </form>
      </div>

      {/* Slip Modal – uses slipData from API */}
      {isSlipModalOpen && slipData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-cyan-300">Material Transfer Slip</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div id="slipPrintArea" className="bg-white text-black p-8 rounded-lg">
                {/* Company Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold uppercase tracking-wide">Material Transfer Slip</h1>
                  <p className="text-sm text-gray-600 mt-1">[Your Company Name] • Inter-Department Transfer</p>
                </div>

                <div className="space-y-5 text-base">
                  <div className="flex">
                    <div className="w-44 font-bold">Transfer ID:</div>
                    <div>#{slipData.id}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">Date & Time:</div>
                    <div>{new Date(slipData.created_at).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">From Department:</div>
                    <div>{slipData.from_department_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">To Department:</div>
                    <div>{slipData.to_department_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">Item / Material:</div>
                    <div>{slipData.item_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">Quantity:</div>
                    <div className="font-bold text-lg">{slipData.quantity}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-bold">Sent By:</div>
                    <div>{slipData.sent_by_name || "—"}</div>
                  </div>
                </div>

                <hr className="my-10 border-gray-400" />

                <div className="text-center text-sm text-gray-600">
                  <p>Generated on {new Date().toLocaleDateString("en-IN")}</p>
                  <div className="mt-12">
                    <p className="border-t border-gray-500 inline-block pt-2 px-12">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 p-5 border-t border-slate-700">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <Printer size={18} />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}