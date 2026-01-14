import React, { useEffect, useState } from "react";
import {
  FiFileText,
  FiPlus,
  FiTrash2,
  FiShoppingCart,
} from "react-icons/fi";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const PurchaseOrderCreate = () => {
  const { organization } = useAuth(); // get current org
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    department: "",
    vendor: "",
    items: [{ item: "", qty: 1, price: 0 }],
  });

  /* ---------------- LOAD MASTER DATA ---------------- */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vendorRes, itemRes] = await Promise.all([
        api.get("/finance/vendors/"),
        api.get("/inventory/items/"),
      ]);

      const vendorData = Array.isArray(vendorRes.data)
        ? vendorRes.data
        : vendorRes.data.results || [];

      const itemData = Array.isArray(itemRes.data)
        ? itemRes.data
        : itemRes.data.results || [];

      setVendors(vendorData);
      setItems(itemData);

      // fallback budget until API ready
      setBudget(999999);

      console.log("VENDORS:", vendorData);
      console.log("ITEMS:", itemData);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  /* ---------------- CALCULATIONS ---------------- */
  const totalAmount = form.items.reduce(
    (sum, row) => sum + Number(row.qty) * Number(row.price),
    0
  );

  const budgetExceeded = totalAmount > budget;

  /* ---------------- HANDLERS ---------------- */
  const updateItemRow = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;
    setForm({ ...form, items: updated });
  };

  const addRow = () => {
    setForm({
      ...form,
      items: [...form.items, { item: "", qty: 1, price: 0 }],
    });
  };

  const removeRow = (index) => {
    const updated = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: updated });
  };

  const submitPO = async () => {
    if (budgetExceeded) {
      setMessage("PO amount exceeds department budget");
      return;
    }

    if (!organization) {
      setMessage("Organization not set. Cannot submit PO.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
  organization: organization.id,
  department: form.department,
  vendor: form.vendor,
  items: form.items.map((row) => ({
    item: row.item,           // row.item must be the ID, not object
    quantity: Number(row.qty),
    unit_price: Number(row.price),
    total_price: Number(row.qty) * Number(row.price),
  })),
};


      console.log("Submitting PO payload:", payload);

      await api.post("/inventory/purchase-orders/", payload);
      setMessage("Purchase Order created successfully");

      // reset form
      setForm({
        department: "",
        vendor: "",
        items: [{ item: "", qty: 1, price: 0 }],
      });
    } catch (err) {
      console.error(err);
      setMessage("Failed to create PO");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-300 flex items-center gap-3">
          <FiFileText /> Create Purchase Order
        </h1>
        <p className="text-cyan-400 text-sm">
          Inventory • Budget Controlled Purchase
        </p>
      </div>

      {message && (
        <div className="mb-6 border border-cyan-700 p-4 rounded text-cyan-200">
          {message}
        </div>
      )}

      {/* FORM CARD */}
      <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6">
        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Department */}
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            options={DEPARTMENTS}
          />

          {/* Vendor */}
          <Select
            label="Vendor"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          />

          {/* Budget */}
          <div className="border border-cyan-800 rounded p-4 text-center">
            <p className="text-cyan-400 text-sm">Available Budget</p>
            <p className="text-2xl font-bold text-green-400">
              ₹ {budget.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border border-cyan-900/50 rounded">
            <thead className="bg-gray-950 text-cyan-400">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {form.items.map((row, i) => (
                <tr key={i} className="border-t border-cyan-900/40">
                  <td className="p-3">
                    <select
                      className="w-full bg-gray-900 border border-cyan-800 rounded px-2 py-1"
                      onChange={(e) => updateItemRow(i, "item", e.target.value)}
                    >
                      <option value="">Select Item</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={row.qty}
                      onChange={(e) => updateItemRow(i, "qty", e.target.value)}
                      className="w-20 bg-gray-900 border border-cyan-800 rounded px-2 py-1"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => updateItemRow(i, "price", e.target.value)}
                      className="w-28 bg-gray-900 border border-cyan-800 rounded px-2 py-1"
                    />
                  </td>
                  <td className="p-3 text-right">
                    ₹ {(row.qty * row.price).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => removeRow(i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <FiPlus /> Add Item
          </button>

          <div className="text-right">
            <p className="text-cyan-400">PO Total</p>
            <p
              className={`text-2xl font-bold ${
                budgetExceeded ? "text-red-400" : "text-green-400"
              }`}
            >
              ₹ {totalAmount.toLocaleString()}
            </p>

            <button
              onClick={submitPO}
              disabled={loading || budgetExceeded}
              className="mt-4 bg-gradient-to-r from-green-600 to-green-700 px-8 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <FiShoppingCart />
              Create PO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------- SELECT COMPONENT ----------- */
const Select = ({ label, options, value, onChange }) => (
  <div>
    <label className="text-cyan-400 text-sm mb-1 block">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-200"
    >
      <option value="">Select</option>
      {options.map((opt, i) =>
        typeof opt === "string" ? (
          <option key={i} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )
      )}
    </select>
  </div>
);

export default PurchaseOrderCreate;
