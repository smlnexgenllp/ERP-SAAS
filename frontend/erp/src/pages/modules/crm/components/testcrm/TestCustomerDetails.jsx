// src/pages/modules/crm/CustomerDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  ArrowLeft,
  AlertCircle,
  Edit3,
} from "lucide-react";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    fetch(`/api/customers/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load customer (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setCustomer(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 max-w-md text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-900">Customer Not Found</h2>
          <p className="text-zinc-600 mt-3">{error || "The requested customer profile could not be loaded."}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-zinc-900 text-white px-8 py-3 rounded-2xl hover:bg-black transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center shadow">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                {customer.full_name || "Unnamed Customer"}
              </h1>
              <p className="text-zinc-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Customer since {new Date(customer.customer_since).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div
            className={`px-6 py-2.5 rounded-3xl text-sm font-semibold ${
              customer.status === "active"
                ? "bg-emerald-100 text-emerald-700"
                : customer.status === "inactive"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {customer.status?.toUpperCase() || "ACTIVE"}
          </div>
        </div>

        {/* Main Information Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Details */}
            <div>
              <h3 className="flex items-center gap-3 text-xl font-semibold text-zinc-900 mb-6">
                <Mail className="w-5 h-5 text-zinc-500" />
                Contact Details
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="text-lg font-medium text-zinc-900 mt-1">
                    {customer.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Phone</p>
                  <p className="text-lg font-medium text-zinc-900 mt-1">
                    {customer.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Company</p>
                  <p className="text-lg font-medium text-zinc-900 mt-1">
                    {customer.company || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Original Contact / Conversion Info */}
            <div>
              <h3 className="flex items-center gap-3 text-xl font-semibold text-zinc-900 mb-6">
                <Building2 className="w-5 h-5 text-zinc-500" />
                Original Contact
              </h3>
              {customer.contact ? (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6">
                  <p className="text-zinc-600 text-sm">Converted from</p>
                  <button
                    onClick={() => navigate(`/crm/contacts/${customer.contact.id}-test`)}
                    className="mt-2 text-left hover:underline text-emerald-600 font-medium"
                  >
                    {customer.contact.first_name} {customer.contact.last_name}
                  </button>
                  <p className="text-xs text-zinc-500 mt-4">
                    Converted on {new Date(customer.customer_since).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ) : (
                <div className="text-zinc-500 italic">
                  No linked original contact available
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {customer.notes && (
            <div className="mt-10 pt-8 border-t border-zinc-100">
              <h3 className="text-xl font-semibold text-zinc-900 mb-4">Notes</h3>
              <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl text-zinc-700 whitespace-pre-wrap">
                {customer.notes}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white border border-zinc-300 hover:border-zinc-400 px-8 py-3.5 rounded-3xl font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-8 py-3.5 rounded-3xl font-medium transition"
            disabled
          >
            <Edit3 className="w-5 h-5" />
            Edit Customer (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;