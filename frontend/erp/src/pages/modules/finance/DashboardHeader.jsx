import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHeader({ title }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <Link
        to="/modules/finance/transactions/new"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        + Add Transaction
      </Link>
    </div>
  );
}
