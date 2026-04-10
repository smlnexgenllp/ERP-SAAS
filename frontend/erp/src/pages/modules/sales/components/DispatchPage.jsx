import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import { Plus, Trash2, Save, Truck, CheckCircle, Printer, X } from "lucide-react";

export default function DispatchPage() {
  const [itemList, setItemList] = useState([]);
  const [dispatchList, setDispatchList] = useState([]);
  const [salesOrdersForItem, setSalesOrdersForItem] = useState([]);

  const [form, setForm] = useState({
    sales_order: "",
    customer_name: "",
    customer_address: "",
    customer_gst: "",
    vehicle_number: "",
    transporter_name: "",
  });

  const [items, setItems] = useState([
    { 
      item: "", 
      sales_order: "", 
      so_number: "", 
      ordered_qty: 0, 
      dispatch_qty: 0, 
      available_stock: 0 
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentDC, setCurrentDC] = useState(null);

  // Styles from your original code
  const th = { border: "1px solid #ccc", padding: "8px", textAlign: "center" };
  const td = { border: "1px solid #ccc", padding: "8px", textAlign: "center" };

  useEffect(() => {
    fetchItems();
    fetchDispatches();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/inventory/items/");
      setItemList(res.data);
    } catch (err) { console.error("Error fetching items:", err); }
  };

  const fetchDispatches = async () => {
    try {
      const res = await api.get("/inventory/dispatch/");
      setDispatchList(res.data);
    } catch (err) { console.error("Error fetching dispatches:", err); }
  };

  const handleItemChange = async (index, itemId) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], item: itemId, sales_order: "", so_number: "", ordered_qty: 0, dispatch_qty: 0, available_stock: 0 };
    setItems(updatedItems);

    if (itemId) {
      try {
        const soRes = await api.get(`/inventory/sales-orders/by-item/${itemId}/`);
        setSalesOrdersForItem(soRes.data);
        const stockRes = await api.get(`/inventory/item/${itemId}/department/0/stock/`);
        updatedItems[index].available_stock = parseFloat(stockRes.data.available_stock || 0);
        setItems([...updatedItems]);
      } catch (err) { console.error(err); }
    }
  };

  const handleSalesOrderChange = (index, soId) => {
    const selectedSO = salesOrdersForItem.find(so => so.id === parseInt(soId));
    if (!selectedSO) return;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      sales_order: selectedSO.id,
      so_number: selectedSO.so_number,
      ordered_qty: selectedSO.ordered_qty,
      dispatch_qty: Math.min(selectedSO.pending_qty || 0, updatedItems[index].available_stock || 0),
    };
    setItems(updatedItems);

    if (index === 0) {
      setForm(prev => ({
        ...prev,
        sales_order: selectedSO.id,
        customer_name: selectedSO.customer_name,
        customer_address: selectedSO.customer_address,
        customer_gst: selectedSO.customer_gst || "",
      }));
    }
  };

  const handleDispatchQtyChange = (index, value) => {
    const numValue = parseFloat(value) || 0;
    const maxAllowed = Math.min(items[index].ordered_qty || 0, items[index].available_stock || 0);
    const updatedItems = [...items];
    updatedItems[index].dispatch_qty = Math.min(numValue, maxAllowed);
    setItems(updatedItems);
  };

  const addRow = () => setItems([...items, { item: "", sales_order: "", so_number: "", ordered_qty: 0, dispatch_qty: 0, available_stock: 0 }]);
  const removeRow = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const handleSubmit = async () => {
    if (!form.customer_name || items.some(row => !row.item || row.dispatch_qty <= 0)) {
      alert("Please fill all required fields correctly.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, items: items.map(row => ({ item: parseInt(row.item), ordered_qty: parseFloat(row.ordered_qty), dispatch_qty: parseFloat(row.dispatch_qty) })) };
      await api.post("/inventory/dispatch/", payload);
      alert("Draft Dispatch created successfully!");
      fetchDispatches();
      resetForm();
    } catch (err) { alert(err.response?.data?.error || "Failed to create dispatch"); }
    finally { setLoading(false); }
  };

  const confirmDispatch = async (id) => {
    if (!window.confirm("Confirm this dispatch? Stock will be deducted from inventory.")) return;
    setConfirmingId(id);
    try {
      const res = await api.post(`/inventory/dispatch/${id}/confirm_dispatch/`);
      if (res.data.dc_data) {
        const dc = res.data.dc_data;
        setCurrentDC({
          ...dc,
          dc_date: new Date(dc.dc_date).toLocaleDateString("en-GB"),
          sales_order_number: dc.sales_order_number || "",
        });
        setShowPrintModal(true);
      }
      alert(res.data.message || "Dispatch confirmed successfully!");
      fetchDispatches(); // This refreshes the list status from draft to dispatched
    } catch (err) { alert(err.response?.data?.error || "Failed to confirm dispatch."); }
    finally { setConfirmingId(null); }
  };

  const printExistingDC = async (dispatchId) => {
    try {
      const res = await api.get(`/inventory/dispatch/${dispatchId}/`);
      if (res.data) {
        setCurrentDC({
          dc_number: res.data.dc_number,
          dc_date: new Date(res.data.dispatch_date).toLocaleDateString("en-GB"),
          company_name: res.data.organization?.name || "Company",
          company_address: res.data.organization?.address || "",
          company_gstin: res.data.gst_settings?.gstin || "",
          customer_name: res.data.customer_name,
          customer_address: res.data.customer_address,
          customer_gst: res.data.customer_gst || "",
          vehicle_number: res.data.vehicle_number || "",
          transporter_name: res.data.transporter_name || "",
          sales_order_number: res.data.sales_order_number || "",
          items: res.data.items || [],
          total_taxable: res.data.total_taxable || 0,
          total_gst: res.data.total_gst || 0,
          grand_total: res.data.grand_total || 0,
          place_of_supply: res.data.place_of_supply || "Tamil Nadu",
          reason: res.data.reason || "Sales",
        });
        setShowPrintModal(true);
      }
    } catch (err) { alert("Failed to load DC for printing"); }
  };

  const printDC = () => {
    const printContent = document.getElementById("printable-dc");
    const newWindow = window.open("", "", "width=900,height=700");
    newWindow.document.write(`
      <html>
        <head>
          <title>Delivery Challan</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            table, th, td { border: 1px solid black; }
            th, td { padding: 8px; text-align: center; }
            .header { border-bottom: 3px solid #0B5ED7; padding-bottom: 10px; }
            .blue-text { color: #0B5ED7; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    newWindow.document.close();
    newWindow.focus();
    setTimeout(() => { newWindow.print(); newWindow.close(); }, 500);
  };

  const resetForm = () => {
    setForm({ sales_order: "", customer_name: "", customer_address: "", customer_gst: "", vehicle_number: "", transporter_name: "" });
    setItems([{ item: "", sales_order: "", so_number: "", ordered_qty: 0, dispatch_qty: 0, available_stock: 0 }]);
    setSalesOrdersForItem([]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <Truck className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Dispatch (Delivery Challan)</h2>
      </div>

      {/* New Dispatch Form */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Plus size={20} className="text-blue-500"/> New Dispatch
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Customer Name</label>
            <input value={form.customer_name} readOnly className="border p-3 w-full bg-gray-50 rounded-lg text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">GST</label>
            <input value={form.customer_gst} readOnly className="border p-3 w-full bg-gray-50 rounded-lg text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Vehicle Number</label>
            <input 
              value={form.vehicle_number} 
              onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} 
              className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
              placeholder="Enter Vehicle No."
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-600">Customer Address</label>
          <textarea value={form.customer_address} readOnly rows={2} className="border p-3 w-full bg-gray-50 rounded-lg text-gray-500" />
        </div>

        <h4 className="font-medium mb-3 text-gray-700">Items to Dispatch</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Sales Order</th>
                <th className="p-3 text-center">Ordered Qty</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Dispatch Qty</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((row, index) => (
                <tr key={index}>
                  <td className="p-3">
                    <select 
                      value={row.item} 
                      onChange={(e) => handleItemChange(index, e.target.value)} 
                      className="border p-2 w-full rounded-md"
                    >
                      <option value="">Select Item</option>
                      {itemList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select 
                      value={row.sales_order} 
                      onChange={(e) => handleSalesOrderChange(index, e.target.value)} 
                      disabled={!row.item} 
                      className="border p-2 w-full rounded-md disabled:bg-gray-100"
                    >
                      <option value="">Select SO</option>
                      {salesOrdersForItem.map(so => <option key={so.id} value={so.id}>{so.so_number}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <input type="number" value={row.ordered_qty} readOnly className="border p-2 w-24 bg-gray-50 rounded text-center" />
                  </td>
                  <td className="p-3 text-center font-bold">
                    <span className={row.available_stock > 0 ? 'text-green-600' : 'text-red-600'}>{row.available_stock}</span>
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={row.dispatch_qty}
                      onChange={(e) => handleDispatchQtyChange(index, e.target.value)}
                      className="border p-2 w-24 rounded text-center focus:ring-2 focus:ring-blue-400"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={addRow} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium">
            <Plus size={18} /> Add Row
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-70 font-bold"
          >
            <Save size={18} /> {loading ? "Creating..." : "Create Draft Dispatch"}
          </button>
        </div>
      </div>

      {/* Dispatch History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-700">Dispatch History</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-4 text-left">DC Number</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dispatchList.map(d => (
              <tr key={d.id} className="hover:bg-blue-50/30">
                <td className="p-4 font-bold text-gray-800">{d.dc_number || `DRAFT-${d.id}`}</td>
                <td className="p-4 text-gray-700">{d.customer_name}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${d.status === 'dispatched' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {d.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  {d.status === "draft" ? (
                    <button
                      onClick={() => confirmDispatch(d.id)}
                      disabled={confirmingId === d.id}
                      className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle size={16} /> Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => printExistingDC(d.id)}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                    >
                      <Printer size={16} /> Print DC
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {showPrintModal && currentDC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            
            {/* Modal Actions */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Printer className="text-blue-600" /> Print Preview
              </h3>
              <div className="flex gap-2">
                <button onClick={printDC} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Printer size={18} /> Print Now
                </button>
                <button onClick={() => setShowPrintModal(false)} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300">
                    <X size={20} />
                </button>
              </div>
            </div>

            {/* A4 Content Area */}
            <div className="p-8 overflow-y-auto bg-gray-200 flex-grow">
              <div 
                id="printable-dc"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    margin: "0 auto",
                    padding: "12mm",
                    fontFamily: "Arial",
                    fontSize: "13px",
                    color: "#000",
                    background: "#fff",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                }}
              >
                {/* HEADER - YOUR FORMAT */}
                <div style={{ borderBottom: "3px solid #0B5ED7", paddingBottom: "10px" }}>
                    <h1 style={{ margin: 0, color: "#0B5ED7" }}>{currentDC.company_name}</h1>
                    <p style={{ margin: 0 }}>Manufacturing & Supply of Precision Components</p>
                </div>

                {/* TOP INFO */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 15 }}>
                    <div>
                        <strong>Challan No:</strong> {currentDC.dc_number} <br />
                        <strong>Date:</strong> {currentDC.dc_date} <br />
                        <strong>Sales Order:</strong> {currentDC.sales_order_number || "-"} <br />
                        <strong>Reason:</strong> Sales
                    </div>
                    <div>
                        <strong>Vehicle:</strong> {currentDC.vehicle_number || "-"} <br />
                        <strong>Transporter:</strong> {currentDC.transporter_name || "-"} <br />
                        <strong>Place of Supply:</strong> {currentDC.place_of_supply}
                    </div>
                </div>

                {/* PARTY DETAILS */}
                <div style={{ display: "flex", gap: "10px", marginTop: 20 }}>
                    <div style={{ flex: 1, border: "1px solid #ccc", padding: 10 }}>
                        <strong style={{ color: "#0B5ED7" }}>Consignor</strong>
                        <p style={{ margin: "5px 0" }}>{currentDC.company_name}</p>
                        <p style={{ margin: "5px 0" }}>{currentDC.company_address}</p>
                        <p style={{ margin: "5px 0" }}>GSTIN: {currentDC.company_gstin}</p>
                    </div>
                    <div style={{ flex: 1, border: "1px solid #ccc", padding: 10 }}>
                        <strong style={{ color: "#0B5ED7" }}>Consignee</strong>
                        <p style={{ margin: "5px 0" }}>{currentDC.customer_name}</p>
                        <p style={{ margin: "5px 0" }}>{currentDC.customer_address}</p>
                        <p style={{ margin: "5px 0" }}>GSTIN: {currentDC.customer_gst}</p>
                    </div>
                </div>

                {/* ITEMS TABLE - YOUR FORMAT */}
                <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
                    <thead style={{ background: "#0B5ED7", color: "#fff" }}>
                        <tr>
                            <th style={th}>#</th>
                            <th style={th}>Description</th>
                            <th style={th}>Qty</th>
                            <th style={th}>Rate</th>
                            <th style={th}>Taxable</th>
                            <th style={th}>GST%</th>
                            <th style={th}>GST Amt</th>
                            <th style={th}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentDC.items.map((item, i) => (
                            <tr key={i}>
                                <td style={td}>{i + 1}</td>
                                <td style={td}>{item.name || item.item_name}</td>
                                <td style={td}>{item.dispatch_qty} {item.uom}</td>
                                <td style={td}>{item.rate}</td>
                                <td style={td}>{item.taxable_value}</td>
                                <td style={td}>{item.gst_rate}%</td>
                                <td style={td}>{item.gst_amount}</td>
                                <td style={td}><b>{item.total_value}</b></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS */}
                <div style={{ marginTop: 15, textAlign: "right" }}>
                    <p><strong>Taxable:</strong> ₹ {currentDC.total_taxable}</p>
                    <p><strong>GST:</strong> ₹ {currentDC.total_gst}</p>
                    <h3 style={{ color: "#0B5ED7", marginTop: 5 }}>Grand Total: ₹ {currentDC.grand_total}</h3>
                </div>

                <div style={{ marginTop: 30 }}>
                    <p>1. Subject to jurisdiction.</p>
                    <p>2. Goods once sold will not be taken back.</p>
                </div>

                <div style={{ marginTop: 60, textAlign: "right" }}>
                    <p>For {currentDC.company_name}</p>
                    <br /><br />
                    <p><b>Authorised Signatory</b></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}