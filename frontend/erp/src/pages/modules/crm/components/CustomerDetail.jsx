// src/pages/modules/crm/CustomerDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const CustomerDetail = () => {
  const { id } = useParams(); // this is the Customer ID
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    fetch(`/api/customers/${id}/`, {  // ← adjust endpoint to match your backend
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">
        Loading Customer Profile...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-red-400">
        {error || "Customer profile not found."}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 block bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-400">
              {customer.full_name || "Unnamed Customer"}
            </h1>
            <p className="text-gray-400 mt-1">
              Customer since {new Date(customer.customer_since).toLocaleDateString()}
            </p>
          </div>

          <span
            className={`px-5 py-2 rounded-full text-sm font-semibold ${
              customer.status === "active"
                ? "bg-green-700"
                : customer.status === "inactive"
                ? "bg-yellow-700"
                : "bg-red-700"
            }`}
          >
            {customer.status.toUpperCase()}
          </span>
        </div>

        {/* Main Info Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-3">Contact Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-gray-400 text-sm">Email</dt>
                  <dd className="text-lg mt-1">{customer.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Phone</dt>
                  <dd className="text-lg mt-1">{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Company</dt>
                  <dd className="text-lg mt-1">{customer.company || "—"}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-3">Original Contact</h3>
              {customer.contact ? (
                <div className="space-y-2">
                  <p>
                    <a
                      href={`/crm/contacts/${customer.contact.id}`}
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      View original contact → {customer.contact.first_name} {customer.contact.last_name}
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Converted on {new Date(customer.customer_since).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No linked contact available</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="pt-6 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-green-300 mb-3">Notes</h3>
              <p className="bg-gray-800 p-5 rounded-lg whitespace-pre-wrap text-gray-200">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition"
          >
            Back
          </button>

          {/* Future: Edit customer, view orders, support tickets, etc. */}
          <button
            disabled
            className="bg-green-800 opacity-50 px-6 py-3 rounded-lg cursor-not-allowed"
          >
            Edit Customer (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;