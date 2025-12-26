import React, { useState, useEffect } from "react";
import axios from "axios";

// Correct base URL for all finance module endpoints
const API_BASE = "http://localhost:8000/api/finance";

const MasterData = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [activeTab, setActiveTab] = useState("customers");

  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Forms
  const [customerForm, setCustomerForm] = useState({
    name: "",
    address: "",
    gst_number: "",
  });
  const [vendorForm, setVendorForm] = useState({
    name: "",
    address: "",
    gst_number: "",
  });
  const [bankForm, setBankForm] = useState({
    name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    ifsc_code: "",
    account_type: "savings",
    pan_number: "",
  });
  const [taxForm, setTaxForm] = useState({
    name: "GST ",
    rate: "",
    tax_type: "IGST",
    effective_from: new Date().toISOString().split("T")[0],
    is_active: true,
  });
  const [expenseForm, setExpenseForm] = useState({ name: "" });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
      console.log("Companies loaded:", res.data);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setMessage("Failed to load companies");
    }
  };

  const loadData = async (companyId) => {
    if (!companyId) return;
    setLoading(true);
    setMessage("");

    try {
      const [cust, vend, bank, tax, exp] = await Promise.all([
        axios.get(`${API_BASE}/customers/?company=${companyId}`),
        axios.get(`${API_BASE}/vendors/?company=${companyId}`),
        axios.get(`${API_BASE}/bank-accounts/?company=${companyId}`),
        axios.get(`${API_BASE}/tax-rates/?company=${companyId}`),
        axios.get(`${API_BASE}/expense-categories/?company=${companyId}`),
      ]);

      setCustomers(cust.data);
      setVendors(vend.data);
      setBankAccounts(bank.data);
      setTaxRates(tax.data);
      setExpenseCategories(exp.data);

      console.log("Master data loaded for company", companyId);
    } catch (err) {
      console.error("Failed to load master data:", err);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    const id = e.target.value;
    setSelectedCompany(id);
    if (id) loadData(id);
  };

  const createItem = async (endpoint, formData, resetFn) => {
    if (!selectedCompany) {
      setMessage("Please select a company first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await axios.post(`${API_BASE}/${endpoint}/`, {
        ...formData,
        company: parseInt(selectedCompany),
      });

      setMessage("✓ Item created successfully");
      resetFn();
      loadData(selectedCompany);
    } catch (err) {
      const errorMsg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Server error";
      setMessage("✗ " + errorMsg);
      console.error(`Failed to create ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "customers", label: "Customers" },
    { key: "vendors", label: "Vendors" },
    { key: "banks", label: "Bank Accounts" },
    { key: "taxes", label: "Tax Rates" },
    { key: "expenses", label: "Expense Categories" },
  ];

  const resetCustomer = () => setCustomerForm({ name: "", address: "", gst_number: "" });
  const resetVendor = () => setVendorForm({ name: "", address: "", gst_number: "" });
  const resetBank = () => setBankForm({
    name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    ifsc_code: "",
    account_type: "savings",
    pan_number: "",
  });
  const resetTax = () => setTaxForm({
    name: "GST ",
    rate: "",
    tax_type: "IGST",
    effective_from: new Date().toISOString().split("T")[0],
    is_active: true,
  });
  const resetExpense = () => setExpenseForm({ name: "" });

  const renderListItem = (item, fields = ["name"]) => (
    <div className="bg-gray-950 border border-cyan-900/70 rounded-lg p-4 hover:border-cyan-700 transition">
      {fields.map((field, i) => (
        <p key={field} className={i === 0 ? "font-semibold text-cyan-300" : "text-sm text-gray-400"}>
          {item[field]}
          {field === "rate" && "%"}
          {field === "gst_number" && item.gst_number && `GST: ${item.gst_number}`}
        </p>
      ))}
      {item.outstanding_balance !== undefined && item.outstanding_balance !== "0.00" && (
        <p className="text-xs mt-1 text-orange-400">
          Balance: ₹{parseFloat(item.outstanding_balance).toLocaleString()}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-cyan-300 mb-8 tracking-wide">MASTER DATA</h1>

      {/* Company Selector */}
      <div className="bg-gray-900 border border-cyan-900 rounded-xl p-6 mb-10">
        <label className="block text-sm text-gray-400 mb-2">Select Company</label>
        <select
          value={selectedCompany}
          onChange={handleCompanyChange}
          className="w-full max-w-md bg-gray-950 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">── Select Company ──</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8 border-b border-cyan-900 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.key
                    ? "bg-cyan-600 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-gray-900 border border-cyan-900 rounded-xl p-6 min-h-[400px]">
            {loading && <p className="text-center text-cyan-400">Loading...</p>}

            {/* CUSTOMERS */}
            {activeTab === "customers" && (
              <>
                <h2 className="text-xl text-cyan-300 font-semibold mb-6">Customers</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createItem("customers", customerForm, resetCustomer);
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10"
                >
                  <input
                    placeholder="Customer Name *"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <input
                    placeholder="Address"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <input
                    placeholder="GST Number"
                    value={customerForm.gst_number}
                    onChange={(e) => setCustomerForm({ ...customerForm, gst_number: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <button
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    + Add Customer
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                      No customers yet
                    </p>
                  ) : (
                    customers.map((c) => renderListItem(c, ["name", "gst_number", "address"]))
                  )}
                </div>
              </>
            )}

            {/* VENDORS */}
            {activeTab === "vendors" && (
              <>
                <h2 className="text-xl text-cyan-300 font-semibold mb-6">Vendors</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createItem("vendors", vendorForm, resetVendor);
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10"
                >
                  <input
                    placeholder="Vendor Name *"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <input
                    placeholder="Address"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <input
                    placeholder="GST Number"
                    value={vendorForm.gst_number}
                    onChange={(e) => setVendorForm({ ...vendorForm, gst_number: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <button
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    + Add Vendor
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">No vendors yet</p>
                  ) : (
                    vendors.map((v) => renderListItem(v, ["name", "gst_number"]))
                  )}
                </div>
              </>
            )}

            {/* BANK ACCOUNTS */}
            {activeTab === "banks" && (
              <>
                <h2 className="text-xl text-cyan-300 font-semibold mb-6">Bank Accounts</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createItem("bank-accounts", bankForm, resetBank);
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
                >
                  <input
                    placeholder="Display Name * (e.g. HDFC Main A/c)"
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <input
                    placeholder="Bank Name * (e.g. HDFC Bank)"
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <input
                    placeholder="Branch Name"
                    value={bankForm.branch_name}
                    onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <input
                    placeholder="Account Number *"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <input
                    placeholder="IFSC Code (11 chars)"
                    value={bankForm.ifsc_code}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                    maxLength={11}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <select
                    value={bankForm.account_type || "savings"}
                    onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                    <option value="cc">Cash Credit</option>
                    <option value="od">Overdraft</option>
                    <option value="fixed_deposit">Fixed Deposit</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    placeholder="PAN Number (optional)"
                    value={bankForm.pan_number}
                    onChange={(e) => setBankForm({ ...bankForm, pan_number: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="w-full bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <button
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-8 rounded-lg transition disabled:opacity-50"
                  >
                    + Add Bank Account
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bankAccounts.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                      No bank accounts added yet
                    </p>
                  ) : (
                    bankAccounts.map((b) => (
                      <div
                        key={b.id}
                        className="bg-gray-950 border border-cyan-900/70 rounded-lg p-5 hover:border-cyan-600 transition"
                      >
                        <p className="font-semibold text-cyan-300 text-lg mb-2">{b.name}</p>
                        <div className="text-sm space-y-1 text-gray-300">
                          <p><span className="text-gray-400">Bank:</span> {b.bank_name || '-'}</p>
                          <p><span className="text-gray-400">Branch:</span> {b.branch_name || '-'}</p>
                          <p><span className="text-gray-400">A/c No:</span> {b.account_number}</p>
                          <p><span className="text-gray-400">IFSC:</span> {b.ifsc_code || '-'}</p>
                          <p><span className="text-gray-400">Type:</span> {b.account_type?.replace('_', ' ').toUpperCase() || 'Savings'}</p>
                          {b.balance !== "0.00" && (
                            <p className="text-orange-400 font-medium mt-2">
                              Balance: ₹{Number(b.balance).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* TAX RATES */}
            {activeTab === "taxes" && (
              <>
                <h2 className="text-xl text-cyan-300 font-semibold mb-6">Tax Rates</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createItem("tax-rates", taxForm, resetTax);
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10"
                >
                  <input
                    placeholder="Tax Name * (e.g. GST 18%)"
                    value={taxForm.name}
                    onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Rate (%) *"
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                    required
                  />
                  <select
                    value={taxForm.tax_type || "IGST"}
                    onChange={(e) => setTaxForm({ ...taxForm, tax_type: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  >
                    <option value="IGST">IGST (Inter-state)</option>
                    <option value="CGST">CGST (Central)</option>
                    <option value="SGST">SGST (State)</option>
                    <option value="UTGST">UTGST (Union Territory)</option>
                    <option value="CESS">CESS</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="date"
                    value={taxForm.effective_from}
                    onChange={(e) => setTaxForm({ ...taxForm, effective_from: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={taxForm.is_active}
                      onChange={(e) => setTaxForm({ ...taxForm, is_active: e.target.checked })}
                      className="h-5 w-5 bg-gray-950 border-cyan-900"
                    />
                    <label className="text-cyan-200 text-sm">Active</label>
                  </div>
                  <button
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-8 rounded-lg transition disabled:opacity-50"
                  >
                    + Add Tax Rate
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taxRates.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                      No tax rates added yet
                    </p>
                  ) : (
                    taxRates.map((t) => (
                      <div
                        key={t.id}
                        className="bg-gray-950 border border-cyan-900/70 rounded-lg p-5 hover:border-cyan-600 transition"
                      >
                        <p className="font-semibold text-cyan-300 text-lg mb-2">{t.name}</p>
                        <div className="text-sm space-y-1 text-gray-300">
                          <p><span className="text-gray-400">Rate:</span> <span className="text-orange-400 font-medium">{t.rate}%</span></p>
                          <p><span className="text-gray-400">Type:</span> {t.tax_type}</p>
                          <p><span className="text-gray-400">Effective:</span> {t.effective_from ? new Date(t.effective_from).toLocaleDateString() : '-'}</p>
                          <p>
                            <span className="text-gray-400">Status:</span>{" "}
                            <span className={t.is_active ? "text-green-400" : "text-red-400"}>
                              {t.is_active ? "Active" : "Inactive"}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* EXPENSE CATEGORIES */}
            {activeTab === "expenses" && (
              <>
                <h2 className="text-xl text-cyan-300 font-semibold mb-6">Expense Categories</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createItem("expense-categories", expenseForm, resetExpense);
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
                >
                  <input
                    placeholder="Category Name *"
                    value={expenseForm.name}
                    onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                    className="bg-gray-950 border border-cyan-900 rounded-lg px-4 py-3 text-cyan-200 md:col-span-2"
                    required
                  />
                  <button
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    + Add Category
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {expenseCategories.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                      No expense categories added yet
                    </p>
                  ) : (
                    expenseCategories.map((ec) => (
                      <div
                        key={ec.id}
                        className="bg-gray-950 border border-cyan-900/70 rounded-lg p-4 text-cyan-200"
                      >
                        {ec.name}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-xl text-center border ${
                message.includes("✗")
                  ? "bg-red-950/40 border-red-600 text-red-300"
                  : "bg-green-950/40 border-green-600 text-green-300"
              }`}
            >
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MasterData;