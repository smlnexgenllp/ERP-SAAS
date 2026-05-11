// src/pages/modules/hr/EditEmployeeModal.jsx
import React from "react";
import { X, UserCog } from "lucide-react";
import EditEmployee from "./EditEmployee";

export default function EditEmployeeModal({
  employee,
  onClose,
  onUpdated,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-zinc-100 w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/60">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-zinc-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center">
              <UserCog className="w-7 h-7 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Update Employee
              </h2>

              <p className="text-zinc-500 mt-1">
                {employee.full_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[85vh] overflow-y-auto">
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