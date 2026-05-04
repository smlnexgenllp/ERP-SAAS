// src/pages/modules/production/DepartmentWork.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import TransactionForm from "./TransactionForm";
import { ArrowLeft, Package, PlayCircle, AlertCircle } from "lucide-react";

export default function DepartmentWork({ deptId }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/production/department/${deptId}/transactions/`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to load department transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deptId) {
      loadData();
    }
  }, [deptId]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Department Work Queue
                </h1>
                <p className="text-zinc-500">Process pending production transactions</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            Refresh Queue
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-6 text-lg font-medium">Loading work queue...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 py-20">
              <AlertCircle className="w-16 h-16 text-zinc-300 mb-6" />
              <p className="text-2xl font-medium text-zinc-600">No items to process</p>
              <p className="text-zinc-500 mt-2">All transactions have been completed for this department.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-8 hover:bg-zinc-50 transition-colors flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-zinc-900">
                          {txn.input_item}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Transaction ID: #{txn.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Quantity</p>
                      <p className="text-3xl font-semibold text-zinc-900">
                        {txn.quantity}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTxn(txn)}
                      className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-2xl font-medium transition shadow-sm"
                    >
                      <PlayCircle size={22} />
                      Process Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Form Modal */}
        {selectedTxn && (
          <TransactionForm
            txn={selectedTxn}
            onClose={() => {
              setSelectedTxn(null);
              loadData();
            }}
          />
        )}
      </div>
    </div>
  );
}