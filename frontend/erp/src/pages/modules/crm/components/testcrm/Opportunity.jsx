// src/pages/modules/crm/OpportunityDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  User,
  FileText,
  Award,
  AlertCircle,
} from "lucide-react";

const OpportunityDetails = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4">Loading opportunity details...</p>
        </div>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 max-w-md text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-900">Opportunity Not Found</h2>
          <p className="text-zinc-600 mt-3">{error || "The requested opportunity could not be loaded."}</p>
          <button
            onClick={() => navigate("/crm-test")}
            className="mt-6 bg-zinc-900 text-white px-8 py-3 rounded-2xl hover:bg-black transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canCreateQuotation = opp.stage === "qualified";
  const canCreateSalesOrder = opp.stage === "negotiation" || opp.stage === "quotation_sent";
  const canCreateInvoice = opp.stage === "sales_order";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate("/crm-test")}
            className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{opp.title}</h1>
              <p className="text-zinc-500">Opportunity Details</p>
            </div>
          </div>

          <div className="px-6 py-2.5 rounded-3xl text-sm font-semibold capitalize bg-violet-100 text-violet-700">
            {opp.stage.replace("_", " ")}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-3xl p-9 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-8 flex items-center gap-3">
              <FileText className="w-6 h-6" />
              Opportunity Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-500">Contact</p>
                  <p className="text-xl font-medium text-zinc-900 mt-1 flex items-center gap-2">
                    <User className="w-5 h-5 text-zinc-400" />
                    {opp.contact_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Company</p>
                  <p className="text-xl font-medium text-zinc-900 mt-1">{opp.company || "—"}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-500">Deal Value</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1 tracking-tighter">
                    ₹{Number(opp.value || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Win Probability</p>
                  <div className="flex items-end gap-3 mt-1">
                    <p className="text-4xl font-bold text-zinc-900">{opp.probability || 0}</p>
                    <p className="text-2xl text-zinc-400 mb-1">%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Expected Close Date</p>
                  <p className="text-xl font-medium text-zinc-900 mt-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-400" />
                    {opp.expected_close_date || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Actions */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-9 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-8 flex items-center gap-3">
              <Award className="w-6 h-6" />
              Next Actions
            </h2>

            <div className="space-y-4">
              {canCreateQuotation && (
                <button
                  onClick={() => progressAction("quotation")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium transition"
                >
                  Create Quotation
                </button>
              )}
              {canCreateSalesOrder && (
                <button
                  onClick={() => progressAction("salesorder")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-medium transition"
                >
                  Create Sales Order
                </button>
              )}
              {canCreateInvoice && (
                <button
                  onClick={() => progressAction("invoice")}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-medium transition"
                >
                  Generate Invoice
                </button>
              )}

              {opp.stage === "won" && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-2xl text-center font-medium">
                  🎉 Deal Closed - Won Successfully!
                </div>
              )}

              {opp.stage === "lost" && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-medium">
                  Deal Closed - Lost
                </div>
              )}

              {!canCreateQuotation && !canCreateSalesOrder && !canCreateInvoice &&
               opp.stage !== "won" && opp.stage !== "lost" && (
                <div className="text-center py-8 text-zinc-500">
                  No immediate actions available at this stage.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents & History */}
        <div className="mt-8 bg-white border border-zinc-200 rounded-3xl p-9 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-6">Documents & History</h2>
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">
              Quotations, Sales Orders, Invoices, and Activity History will appear here.
            </p>
            <p className="text-sm text-zinc-400 mt-2">(Feature coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;