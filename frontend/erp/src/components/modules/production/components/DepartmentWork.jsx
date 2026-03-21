import React, { useEffect, useState } from "react";
import axios from "axios";
import TransactionForm from "./TransactionForm";

export default function DepartmentWork({ deptId }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const loadData = () => {
    axios
      .get(`/api/production/department/${deptId}/transactions/`)
      .then(res => setTransactions(res.data));
  };

  useEffect(() => {
    loadData();
  }, [deptId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Department Work Queue</h2>

      {transactions.length === 0 && <p>No items to process</p>}

      {transactions.map(txn => (
        <div key={txn.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p><b>Item:</b> {txn.input_item}</p>
          <p><b>Qty:</b> {txn.quantity}</p>

          <button onClick={() => setSelectedTxn(txn)}>
            Process
          </button>
        </div>
      ))}

      {/* Process Form */}
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
  );
}