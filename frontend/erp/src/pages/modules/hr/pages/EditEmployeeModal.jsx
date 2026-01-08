import React from "react";
import EditEmployee from "./EditEmployee";

export default function EditEmployeeModal({ employee, onClose, onUpdated }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 w-full max-w-4xl rounded-xl border border-cyan-700">
        <div className="flex justify-between items-center p-5 border-b border-cyan-800">
          <h2 className="text-xl font-bold text-cyan-300">
            Update Employee – {employee.full_name}
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <EditEmployee
            employeeId={employee.id}
            onSuccess={() => {
              onUpdated();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
