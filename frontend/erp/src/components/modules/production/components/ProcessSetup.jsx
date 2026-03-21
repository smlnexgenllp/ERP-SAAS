import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { PlusCircle, Trash2 } from "lucide-react";

export default function ProcessSetup() {
  const [finalItemId, setFinalItemId] = useState("");
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    api.get("/inventory/items/").then(r => setItems(r.data));
    api.get("/hr/departments/").then(r => setDepartments(r.data));
  }, []);

  const addStep = () => {
    setSteps(prev => [...prev, { sequence: prev.length + 1, department: "" }]);
  };

  const removeStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateDepartment = (index, deptId) => {
    const copy = [...steps];
    copy[index].department = deptId;
    setSteps(copy);
  };

  const handleSave = async () => {
    await api.post("/production/process/create/", {
      item: finalItemId,
      steps: steps.map(s => ({ department: s.department }))
    });
    alert("Saved");
    setSteps([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* Header */}
      <h1 className="text-3xl text-cyan-300 font-bold mb-8">Routing Setup</h1>

      {/* Product Select */}
      <div className="mb-6">
        <select
          value={finalItemId}
          onChange={e => setFinalItemId(e.target.value)}
          className="w-full bg-slate-800 p-3 rounded-lg"
        >
          <option>Select Product</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-slate-900 p-4 rounded-lg flex gap-4 items-center">

            <span className="text-cyan-400">Step {idx + 1}</span>

            <select
              value={step.department}
              onChange={e => updateDepartment(idx, e.target.value)}
              className="bg-slate-800 p-2 rounded-lg flex-1"
            >
              <option>Select Department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <button onClick={() => removeStep(idx)} className="text-red-400">
              <Trash2 size={18} />
            </button>

          </div>
        ))}
      </div>

      {/* Add Step */}
      <button
        onClick={addStep}
        className="mt-6 bg-cyan-600 px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <PlusCircle size={18} /> Add Step
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        className="mt-6 ml-4 bg-green-600 px-6 py-2 rounded-lg"
      >
        Save Routing
      </button>

    </div>
  );
}