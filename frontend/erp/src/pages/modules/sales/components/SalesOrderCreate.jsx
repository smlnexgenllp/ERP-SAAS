import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/api';
import { Save, ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';

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
  const [fieldErrors, setFieldErrors] = useState({}); // for backend field errors

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

    console.log('Sending:', payload); // ← debug

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-cyan-300">
            Create Sales Order
          </h1>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-green-900/50 border-green-700 text-green-300'
                : 'bg-red-900/50 border-red-700 text-red-300'
            }`}
          >
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-cyan-400 animate-pulse flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-8 shadow-xl">
            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Customer {preSelectedCustomerId ? '' : '*'}
                </label>
                {preSelectedCustomerId ? (
                  <div className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 text-gray-200">
                    {selectedCustomer?.full_name || 'Loading...'} 
                    {selectedCustomer?.email && ` (${selectedCustomer.email})`}
                  </div>
                ) : (
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  <p className="text-red-400 text-sm mt-1">{fieldErrors.customer[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Expected Delivery Date</label>
                <input
                  type="date"
                  name="expected_delivery_date"
                  value={formData.expected_delivery_date}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Payment Terms (days)</label>
                <input
                  type="number"
                  name="payment_terms_days"
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Billing Address</label>
                <textarea
                  name="billing_address"
                  value={formData.billing_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
                  placeholder="Complete billing address..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shipping Address</label>
                <textarea
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
                  placeholder="Shipping address (if different)..."
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-cyan-300">Order Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
                >
                  <Plus size={18} /> Add Item
                </button>
              </div>

              {fieldErrors.items && (
                <p className="text-red-400 text-sm mb-2">{fieldErrors.items[0]}</p>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Qty</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Unit Price (₹)</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Line Total</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <select
                            value={item.product}
                            onChange={e => handleItemChange(index, 'product', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200"
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
                            className="w-full bg-transparent border-none text-gray-200 focus:ring-0 placeholder-gray-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-20 mx-auto block bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-32 mx-auto block bg-gray-800 border border-gray-700 rounded px-3 py-2 text-right text-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                          ₹{((Number(item.quantity || 0)) * (Number(item.unit_price || 0))).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300 transition p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-800">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right font-semibold text-gray-200">Subtotal</td>
                      <td className="px-6 py-4 text-right text-emerald-400">₹{subtotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right font-semibold text-gray-200">GST (18%)</td>
                      <td className="px-6 py-4 text-right text-emerald-400">₹{gst.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr className="font-bold">
                      <td colSpan="4" className="px-6 py-4 text-right text-lg text-gray-200">Grand Total</td>
                      <td className="px-6 py-4 text-right text-xl text-emerald-400">₹{grand_total.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Notes / Special Instructions</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
                placeholder="Delivery instructions, special terms, or any remarks..."
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition ${
                  submitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                }`}
              >
                {submitting ? 'Creating...' : 'Create Sales Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}