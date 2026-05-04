// src/pages/production/ProcessSetup.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  PlusCircle, 
  Trash2, 
  ArrowLeft, 
  Settings, 
  Save 
} from "lucide-react";

export default function ProcessSetup() {
  const navigate = useNavigate();

  const [finalItemId, setFinalItemId] = useState("");
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, deptsRes] = await Promise.all([
          api.get("/inventory/items/"),
          api.get("/hr/departments/")
        ]);
        setItems(itemsRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
  }, []);

  const addStep = () => {
    setSteps(prev => [...prev, { 
      sequence: prev.length + 1, 
      department: "" 
    }]);
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
    if (!finalItemId) {
      alert("Please select a product");
      return;
    }
    if (steps.length === 0) {
      alert("Please add at least one process step");
      return;
    }
    if (steps.some(step => !step.department)) {
      alert("Please select department for all steps");
      return;
    }

    setLoading(true);
    try {
      await api.post("/production/process/create/", {
        item: finalItemId,
        steps: steps.map(s => ({ department: s.department }))
      });

      alert("✅ Process routing saved successfully!");
      setSteps([]);        
      setFinalItemId("");  
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save routing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Process Routing Setup
                </h1>
                <p className="text-zinc-500">Define manufacturing process steps for products</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10">
          
          {/* Product Selection */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-zinc-600 mb-3">
              Select Final Product
            </label>
            <select
              value={finalItemId}
              onChange={(e) => setFinalItemId(e.target.value)}
              className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 text-lg"
            >
              <option value="">— Select Product —</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} {i.code ? `(${i.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Process Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-zinc-900">Manufacturing Process Steps</h2>
              <button
                onClick={addStep}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
              >
                <PlusCircle size={20} />
                Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-16 text-center">
                <Settings className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 text-lg">No process steps added yet</p>
                <p className="text-zinc-400 mt-1">Click "Add Step" to define the routing sequence</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-center gap-6 hover:shadow-sm transition"
                  >
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-semibold text-zinc-600 text-xl flex-shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex-1">
                      <select
                        value={step.department}
                        onChange={(e) => updateDepartment(idx, e.target.value)}
                        className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={() => removeStep(idx)} 
                      className="text-red-500 hover:text-red-600 p-3 hover:bg-red-50 rounded-2xl transition"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-zinc-100">
            <button
              onClick={handleSave}
              disabled={loading || !finalItemId || steps.length === 0}
              className={`flex-1 flex items-center justify-center gap-3 px-10 py-4 rounded-3xl font-medium text-lg transition-all ${
                loading || !finalItemId || steps.length === 0
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
              }`}
            >
              {loading ? (
                <>Saving Process Routing...</>
              ) : (
                <>
                  <Save size={24} />
                  Save Process Routing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}