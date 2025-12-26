import React from "react";

export default function StatsCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}
