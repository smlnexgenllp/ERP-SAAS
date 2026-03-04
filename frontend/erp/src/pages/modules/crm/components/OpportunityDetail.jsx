// src/pages/modules/crm/OpportunityDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOpp = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/crm/opportunities/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load opportunity");
        const data = await res.json();
        setOpp(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOpp();
  }, [id]);

  const progressAction = async (action) => {
    try {
      const token = localStorage.getItem("token");
      const csrf = document.querySelector("[name=csrfmiddlewaretoken]")?.value || "";

      let endpoint = "";
      if (action === "quotation") endpoint = "create_quotation";
      else if (action === "salesorder") endpoint = "create_sales_order";
      else if (action === "invoice") endpoint = "create_invoice";

      const res = await fetch(`/api/crm/opportunities/${id}/${endpoint}/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-CSRFToken": csrf,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      const data = await res.json();
      let path = "";
      if (action === "quotation") path = `/crm/quotations/${data.id}`;
      else if (action === "salesorder") path = `/crm/sales-orders/${data.id}`;
      else if (action === "invoice") path = `/crm/invoices/${data.id}`;

      navigate(path);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;
  if (!opp) return <div className="text-center py-10">Opportunity not found</div>;

  const canCreateQuotation = opp.stage === "qualified";
  const canCreateSalesOrder = opp.stage === "negotiation" || opp.stage === "quotation_sent";
  const canCreateInvoice = opp.stage === "sales_order";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{opp.title}</h1>
        <span className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 capitalize">
          {opp.stage.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <p><strong>Contact:</strong> {opp.contact_name}</p>
          <p><strong>Value:</strong> ₹{Number(opp.value || 0).toLocaleString()}</p>
          <p><strong>Probability:</strong> {opp.probability}%</p>
          <p><strong>Expected Close:</strong> {opp.expected_close_date || "—"}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Next Actions</h2>
          <div className="space-y-3">
            {canCreateQuotation && (
              <button
                onClick={() => progressAction("quotation")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
              >
                Create Quotation
              </button>
            )}
            {canCreateSalesOrder && (
              <button
                onClick={() => progressAction("salesorder")}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
              >
                Create Sales Order
              </button>
            )}
            {canCreateInvoice && (
              <button
                onClick={() => progressAction("invoice")}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg"
              >
                Generate Invoice
              </button>
            )}
            {opp.stage === "won" && (
              <p className="text-green-600 font-medium text-center py-4">Deal Closed - Won ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs / Sections for Quotations, Sales Orders, Invoices, Activities, etc. */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Documents & History</h2>
        <p className="text-gray-500">(Quotations, Orders, Invoices, Payments will appear here)</p>
        {/* You can add tabs or accordion here in a full implementation */}
      </div>
    </div>
  );
};

export default OpportunityDetail;