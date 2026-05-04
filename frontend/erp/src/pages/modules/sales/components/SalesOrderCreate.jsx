import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/api';
import { Save, ArrowLeft, Plus, Trash2, AlertCircle, Package, Users, Calendar, MapPin, CreditCard } from 'lucide-react';

export default function SalesOrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedCustomerId = searchParams.get('customer');

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer: preSelectedCustomerId || '',
    expected_delivery_date: '',
    billing_address: '',
    shipping_address: '',
    payment_terms_days: 30,
    notes: '',
    items: [{ product: '', description: '', quantity: 1, unit_price: 0 }],
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  // Command bar states
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  // Fetch customers & products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Customers
        const custRes = await api.get('/sale/customers/');
        setCustomers(custRes.data);

        // Products
        const prodRes = await api.get('/inventory/items/');
        setProducts(prodRes.data);

        // Pre-fill if coming from customer creation
        if (preSelectedCustomerId) {
          const selected = custRes.data.find(c => c.id === Number(preSelectedCustomerId));
          if (selected) {
            setFormData(prev => ({
              ...prev,
              customer: preSelectedCustomerId,
              billing_address: selected.billing_address || '',
              shipping_address: selected.shipping_address || '',
              payment_terms_days: Number(selected.payment_terms_days) || 30,
            }));
          }
        }
      } catch (err) {
        setMessage({
          text: 'Failed to load customers or products.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preSelectedCustomerId]);

  const showToast = (msg) => {
    setAlertMessage(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const cmd = command.trim().toLowerCase();
    setCommand("");

    if (!cmd) return;

    if (["help", "commands"].includes(cmd)) {
      showToast("Available commands: clear, reset");
      return;
    } else if (cmd === "clear") {
      showToast("Terminal cleared ✓");
    } else if (cmd === "reset") {
      setFormData({
        customer: preSelectedCustomerId || '',
        expected_delivery_date: '',
        billing_address: '',
        shipping_address: '',
        payment_terms_days: 30,
        notes: '',
        items: [{ product: '', description: '', quantity: 1, unit_price: 0 }],
      });
      showToast("Form reset ✓");
    } else {
      showToast(`Unknown command: ${cmd}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };

    if (field === 'product' && value) {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        items[index].unit_price = Number(prod.price || 0);
        items[index].description = prod.name || '';
      }
    }

    setFormData(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product: '', description: '', quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
    }, 0);
    const gst = subtotal * 0.18;
    const grand_total = subtotal + gst;
    return { subtotal, gst, grand_total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    setFieldErrors({});

    if (!formData.customer) {
      setMessage({ text: 'Please select a customer.', type: 'error' });
      setSubmitting(false);
      return;
    }

    const validItems = formData.items.filter(i => i.product || i.description.trim());
    if (validItems.length === 0) {
      setMessage({ text: 'Add at least one valid item.', type: 'error' });
      setSubmitting(false);
      return;
    }

    // Validate product IDs (optional but helpful)
    const validProductIds = new Set(products.map(p => p.id));
    const invalidItems = validItems.filter(i => i.product && !validProductIds.has(Number(i.product)));
    if (invalidItems.length > 0) {
      setMessage({ text: 'One or more selected products are invalid.', type: 'error' });
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        customer: formData.customer,
        expected_delivery_date: formData.expected_delivery_date || null,
        billing_address: formData.billing_address,
        shipping_address: formData.shipping_address,
        payment_terms_days: Number(formData.payment_terms_days),
        notes: formData.notes,
        items: validItems.map(item => ({
          product: item.product ? Number(item.product) : null,
          description: item.description.trim(),
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
        })),
      };

      const res = await api.post('/sale/sales-orders/create/', payload);

      setMessage({ text: 'Sales Order created successfully!', type: 'success' });

      setTimeout(() => {
        navigate(`/sale/orders/${res.data.id}`);
      }, 1500);
    } catch (err) {
      const errorData = err.response?.data || {};
      setFieldErrors(errorData);

      const errorMsg = errorData.detail ||
        errorData.non_field_errors?.[0] ||
        Object.values(errorData).flat().join(', ') ||
        'Failed to create sales order. Check items/product IDs.';

      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, gst, grand_total } = calculateTotals();

  const selectedCustomer = customers.find(c => c.id === Number(formData.customer));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4 text-lg font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center shadow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Create Sales Order</h1>
              <p className="text-zinc-500 text-sm">Fill in the details to create a new order</p>
            </div>
          </div>

          <div className="px-5 py-2 bg-white border border-zinc-200 rounded-3xl text-sm flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            New Order
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Form Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Customer {preSelectedCustomerId ? '' : '*'}
                </label>
                {preSelectedCustomerId ? (
                  <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      {selectedCustomer?.full_name || 'Loading...'} 
                      {selectedCustomer?.email && ` (${selectedCustomer.email})`}
                    </div>
                  </div>
                ) : (
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.full_name} ({cust.email || cust.phone || 'No contact'})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.customer && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.customer[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expected Delivery Date
                  </div>
                </label>
                <input
                  type="date"
                  name="expected_delivery_date"
                  value={formData.expected_delivery_date}
                  onChange={handleChange}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Terms (days)
                  </div>
                </label>
                <input
                  type="number"
                  name="payment_terms_days"
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Billing Address
                  </div>
                </label>
                <textarea
                  name="billing_address"
                  value={formData.billing_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 resize-y"
                  placeholder="Complete billing address..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </div>
                </label>
                <textarea
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 resize-y"
                  placeholder="Shipping address (if different)..."
                />
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-zinc-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl transition"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>

            {fieldErrors.items && (
              <p className="text-red-500 text-sm mb-3">{fieldErrors.items[0]}</p>
            )}

            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">Description</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-700">Qty</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-700">Unit Price (₹)</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-700">Line Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <select
                          value={item.product}
                          onChange={e => handleItemChange(index, 'product', e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-300"
                        >
                          <option value="">— Select or Custom —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{Number(p.price || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Auto-filled or custom..."
                          className="w-full bg-transparent border-none text-zinc-800 focus:ring-0 placeholder-zinc-400"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-20 mx-auto block bg-white border border-zinc-200 rounded-lg px-3 py-2 text-center text-zinc-800 focus:outline-none focus:border-zinc-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-32 mx-auto block bg-white border border-zinc-200 rounded-lg px-3 py-2 text-right text-zinc-800 focus:outline-none focus:border-zinc-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        ₹{((Number(item.quantity || 0)) * (Number(item.unit_price || 0))).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 transition p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-200">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-semibold text-zinc-700">Subtotal</td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">₹{subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-semibold text-zinc-700">GST (18%)</td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">₹{gst.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-zinc-200">
                    <td colSpan="4" className="px-6 py-4 text-right text-lg font-bold text-zinc-900">Grand Total</td>
                    <td className="px-6 py-4 text-right text-xl font-bold text-emerald-600">₹{grand_total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Notes / Special Instructions</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 resize-y"
              placeholder="Delivery instructions, special terms, or any remarks..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-700 font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl text-white font-medium shadow-sm transition ${
                submitting ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-black'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-8 py-5 flex items-center shadow-2xl z-50"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-zinc-400 font-bold text-2xl mr-4 font-mono">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, reset, clear..."
          className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-400 text-zinc-700"
          spellCheck={false}
        />
      </div>

      {/* Toast Notification */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-lg text-zinc-800 px-7 py-3.5 rounded-2xl text-sm z-50 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          {alertMessage}
        </div>
      )}
    </div>
  );
}