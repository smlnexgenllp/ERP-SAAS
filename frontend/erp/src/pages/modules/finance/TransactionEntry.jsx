import React, { useState, useEffect } from "react";
import axios from "axios";

// Correct base URL for finance module
const API_BASE = "http://localhost:8000/api/finance";

const TRANSACTION_TYPES = ["SALE", "PURCHASE", "EXPENSE", "PAYROLL", "JOURNAL", "PAYMENT", "RECEIPT"];

const TransactionEntry = () => {
  const [companies, setCompanies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [activeTab, setActiveTab] = useState("SALE");
  const [lines, setLines] = useState([{ description: "", quantity: 1, rate: 0, tax_rate: "", amount: 0, tax_amount: 0 }]);
  const [formData, setFormData] = useState({
    type: "SALE",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    customer: "",
    vendor: "",
    bank_account: "",
    debit_account: "",
    credit_account: "",
  });
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
    } catch (err) {
      setMessage("Failed to load companies");
    }
  };

  const fetchData = async (companyId) => {
    if (!companyId) return;
    try {
      const [
        fyRes,
        custRes,
        vendRes,
        accRes,
        taxRes,
        bankRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/financial-years/?company=${companyId}`),
        axios.get(`${API_BASE}/customers/?company=${companyId}`),
        axios.get(`${API_BASE}/vendors/?company=${companyId}`),
        axios.get(`${API_BASE}/accounts/?company=${companyId}`),
        axios.get(`${API_BASE}/tax-rates/?company=${companyId}`),
        axios.get(`${API_BASE}/bank-accounts/?company=${companyId}`),
      ]);

      setFinancialYears(fyRes.data);
      setCustomers(custRes.data);
      setVendors(vendRes.data);
      setAccounts(accRes.data);
      setTaxRates(taxRes.data);
      setBankAccounts(bankRes.data);
    } catch (err) {
      setMessage("Failed to load required data");
    }
  };

  const handleCompanyChange = (e) => {
    const id = e.target.value;
    setSelectedCompany(id);
    setSelectedYear("");
    fetchData(id);
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const tax = lines.reduce((sum, line) => sum + line.tax_amount, 0);
    setTotals({ subtotal, tax, total: subtotal + tax });
  };

  useEffect(() => {
    calculateTotals();
  }, [lines]);

  const addLine = () => {
    setLines([...lines, { description: "", quantity: 1, rate: 0, tax_rate: "", amount: 0, tax_amount: 0 }]);
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;

    if (field === "quantity" || field === "rate" || field === "tax_rate") {
      const qty = parseFloat(newLines[index].quantity) || 0;
      const rate = parseFloat(newLines[index].rate) || 0;
      newLines[index].amount = qty * rate;

      const taxRate = taxRates.find((t) => t.id == newLines[index].tax_rate);
      newLines[index].tax_amount = taxRate ? newLines[index].amount * (taxRate.rate / 100) : 0;
    }

    setLines(newLines);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !selectedYear) {
      setMessage("Please select company and financial year");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const transPayload = {
        company: parseInt(selectedCompany),
        financial_year: parseInt(selectedYear),
        type: formData.type,
        date: formData.date,
        reference: formData.reference,
        description: formData.description,
        customer: formData.customer ? parseInt(formData.customer) : null,
        vendor: formData.vendor ? parseInt(formData.vendor) : null,
        bank_account: formData.bank_account ? parseInt(formData.bank_account) : null,
        debit_account: formData.debit_account ? parseInt(formData.debit_account) : null,
        credit_account: formData.credit_account ? parseInt(formData.credit_account) : null,
      };

      const transRes = await axios.post(`${API_BASE}/transactions/`, transPayload);
      const transactionId = transRes.data.id;

      for (const line of lines) {
        if (line.amount > 0) {
          await axios.post(`${API_BASE}/transaction-lines/`, {
            transaction: transactionId,
            description: line.description || "Item",
            quantity: parseFloat(line.quantity),
            rate: parseFloat(line.rate),
            tax_rate: line.tax_rate ? parseInt(line.tax_rate) : null,
          });
        }
      }

      setMessage("Transaction created successfully!");
      setLines([{ description: "", quantity: 1, rate: 0, tax_rate: "", amount: 0, tax_amount: 0 }]);
      setFormData((prev) => ({
        ...prev,
        reference: "",
        description: "",
        customer: "",
        vendor: "",
        bank_account: "",
      }));
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.detail || "Failed to save transaction"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-cyan-400 uppercase">
            Transaction Entry
          </h1>
          <p className="text-xl text-slate-400">
            Record financial transactions with precision and compliance
          </p>
        </div>

        {/* Company & Year Selection */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Company <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Financial Year <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedCompany}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all disabled:opacity-60"
              >
                <option value="">-- Select Year --</option>
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.start_date} to {fy.end_date}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedCompany && selectedYear && (
          <>
            {/* Transaction Type Tabs */}
            <div className="flex flex-wrap justify-center gap-4">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActiveTab(t);
                    setFormData((prev) => ({ ...prev, type: t }));
                  }}
                  className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                    activeTab === t
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 border border-slate-700"
                  }`}
                >
                  {t === "SALE"
                    ? "Sales Invoice"
                    : t === "PURCHASE"
                    ? "Purchase Bill"
                    : t.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-10 space-y-10">

              {/* Transaction Header */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Reference / Invoice No.</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    placeholder="INV-2025-001"
                  />
                </div>

                {(activeTab === "SALE" || activeTab === "RECEIPT") && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Customer</label>
                    <select
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(activeTab === "PURCHASE" || activeTab === "PAYMENT") && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Vendor</label>
                    <select
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Line Items - Only for invoice types */}
              {["SALE", "PURCHASE", "EXPENSE"].includes(activeTab) && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-cyan-400 border-b border-slate-700 pb-3">
                    Line Items
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full">
                      <thead className="bg-slate-900/80">
                        <tr>
                          <th className="px-6 py-5 text-left text-sm font-medium text-slate-300">Description</th>
                          <th className="px-6 py-5 text-right text-sm font-medium text-slate-300">Qty</th>
                          <th className="px-6 py-5 text-right text-sm font-medium text-slate-300">Rate</th>
                          <th className="px-6 py-5 text-right text-sm font-medium text-slate-300">Amount</th>
                          <th className="px-6 py-5 text-left text-sm font-medium text-slate-300">Tax Rate</th>
                          <th className="px-6 py-5 text-right text-sm font-medium text-slate-300">Tax Amt</th>
                          <th className="px-6 py-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {lines.map((line, i) => (
                          <tr key={i} className="hover:bg-slate-900/50 transition">
                            <td className="px-6 py-4">
                              <input
                                value={line.description}
                                onChange={(e) => updateLine(i, "description", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                                placeholder="Item description"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(i, "quantity", e.target.value)}
                                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-right text-slate-100 focus:outline-none focus:border-cyan-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={line.rate}
                                onChange={(e) => updateLine(i, "rate", e.target.value)}
                                className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-right text-slate-100 focus:outline-none focus:border-cyan-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-cyan-300">
                              ₹{line.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={line.tax_rate}
                                onChange={(e) => updateLine(i, "tax_rate", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                              >
                                <option value="">No Tax</option>
                                {taxRates.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                              ₹{line.tax_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeLine(i)}
                                className="text-red-400 hover:text-red-300 transition"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-300"
                  >
                    + Add Line Item
                  </button>
                </div>
              )}

              {/* Journal Entry Fields */}
              {activeTab === "JOURNAL" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-cyan-400 border-b border-slate-700 pb-3">
                    Journal Entry
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-3">Debit Account *</label>
                      <select
                        value={formData.debit_account}
                        onChange={(e) => setFormData({ ...formData, debit_account: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                        required
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-3">Credit Account *</label>
                      <select
                        value={formData.credit_account}
                        onChange={(e) => setFormData({ ...formData, credit_account: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                        required
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 text-right">
                <div className="space-y-3 text-xl">
                  <p className="text-slate-300">
                    Subtotal: <span className="font-bold text-white">₹{totals.subtotal.toFixed(2)}</span>
                  </p>
                  <p className="text-slate-300">
                    Tax: <span className="font-bold text-emerald-400">₹{totals.tax.toFixed(2)}</span>
                  </p>
                  <p className="text-3xl font-bold text-cyan-400 mt-4">
                    Total: ₹{totals.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-2xl ${
                    loading
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-500/30 hover:shadow-emerald-400/50 transform hover:-translate-y-1"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Save Transaction"
                  )}
                </button>
              </div>
            </form>

            {/* Message */}
            {message && (
              <div
                className={`p-6 rounded-2xl text-center text-xl font-medium border ${
                  message.includes("Error") || message.includes("failed")
                    ? "bg-red-950/40 border-red-700/50 text-red-300"
                    : "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                }`}
              >
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionEntry;