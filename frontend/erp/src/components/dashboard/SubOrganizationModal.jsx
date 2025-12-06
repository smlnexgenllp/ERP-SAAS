import React, { useState } from "react";
import { X, Building, Eye, EyeOff } from "lucide-react";
import { organizationService } from "../../services/organizationService";

const SubOrganizationModal = ({ onClose, onSuccess, availableModules }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    plan_tier: "basic",
    email: "",
    phone: "",
    address: "",
    admin_email: "",
    admin_password: "",
    admin_first_name: "",
    admin_last_name: "",
    module_access: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const updatedModules = checked
        ? [...formData.module_access, value]
        : formData.module_access.filter((mod) => mod !== value);
      setFormData((prev) => ({ ...prev, module_access: updatedModules }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) { setError("Organization name is required"); return false; }
    if (!formData.subdomain.trim()) { setError("Subdomain is required"); return false; }
    if (!formData.email.trim()) { setError("Email is required"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_email.trim()) { setError("Admin email is required"); return false; }
    if (!formData.admin_password.trim()) { setError("Admin password is required"); return false; }
    if (formData.admin_password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (!formData.admin_first_name.trim()) { setError("Admin first name is required"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim().toLowerCase(),
        plan_tier: formData.plan_tier,
        email: formData.email.trim(),
        phone: formData.phone || null,
        address: formData.address || null,
        admin_first_name: formData.admin_first_name.trim(),
        admin_last_name: (formData.admin_last_name || "").trim(),
        admin_email: formData.admin_email.trim(),
        admin_password: formData.admin_password,
        parent_organization_id: 1,
        module_access: formData.module_access
      };

      const result = await organizationService.createSubOrganization(payload);

      if (result.success) {
        alert("Sub-organization created successfully!");
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Creation failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const getModulesForPlan = (plan) =>
    availableModules.filter(
      (module) => module.available_in_plans && module.available_in_plans.includes(plan)
    );

  return (
    <div className="fixed inset-0 bg-gray-950 bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-cyan-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-800">
          <div>
            <h2 className="text-xl font-bold text-pink-400">Create Sub Organization</h2>
            <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-cyan-400"/>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-cyan-300 font-mono">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-pink-400">Organization Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Organization Name *", name: "name", placeholder: "Enter organization name" },
                  { label: "Subdomain *", name: "subdomain", placeholder: "company-name" },
                  { label: "Plan Tier *", name: "plan_tier", type: "select", options: ["basic","advance","enterprise"] },
                  { label: "Contact Email *", name: "email", placeholder: "contact@organization.com", type: "email" },
                  { label: "Phone", name: "phone", placeholder: "+1 (555) 123-4567" }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-2">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cyan-700 rounded-lg bg-gray-900 focus:ring-2 focus:ring-cyan-400"
                      >
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cyan-700 rounded-lg bg-gray-900 focus:ring-2 focus:ring-cyan-400"
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-cyan-700 rounded-lg bg-gray-900 focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter organization address"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-pink-400">Admin User Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "First Name *", name: "admin_first_name", placeholder: "John" },
                  { label: "Last Name", name: "admin_last_name", placeholder: "Doe" },
                  { label: "Email *", name: "admin_email", placeholder: "admin@organization.com", colSpan: 2 },
                  { label: "Password *", name: "admin_password", placeholder: "Enter password", colSpan: 2, password: true }
                ].map((field) => (
                  <div key={field.name} className={field.colSpan ? `md:col-span-${field.colSpan}` : ""}>
                    <label className="block text-sm font-medium mb-2">{field.label}</label>
                    {field.password ? (
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cyan-700 rounded-lg bg-gray-900 focus:ring-2 focus:ring-cyan-400 pr-10"
                          placeholder={field.placeholder}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-pink-400"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cyan-700 rounded-lg bg-gray-900 focus:ring-2 focus:ring-cyan-400"
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Module Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-pink-400">Module Access</h3>
              <p className="text-gray-400 text-sm mb-3">
                Select which modules this sub-organization can access. Available modules depend on the selected plan ({formData.plan_tier}).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getModulesForPlan(formData.plan_tier).map((module) => (
                  <label key={module.code} className="flex items-start space-x-3 p-4 border border-cyan-800 rounded-xl hover:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      value={module.code}
                      checked={formData.module_access.includes(module.code)}
                      onChange={handleInputChange}
                      className="mt-1 text-cyan-400 focus:ring-cyan-500"
                    />
                    <div className="flex-1 text-cyan-300">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{module.name}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{module.description}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">{module.pages?.length || 0} pages available</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          formData.module_access.includes(module.code)
                            ? 'bg-green-900 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {formData.module_access.includes(module.code) ? 'Selected' : 'Not Selected'}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {getModulesForPlan(formData.plan_tier).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No modules available for the {formData.plan_tier} plan.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-cyan-800">
            <div>{step > 1 && <button onClick={handleBack} className="px-6 py-2 text-cyan-300 border border-cyan-700 rounded-xl hover:bg-gray-800 transition">Back</button>}</div>
            <div className="flex space-x-3">
              <button onClick={onClose} className="px-6 py-2 text-cyan-300 border border-cyan-700 rounded-xl hover:bg-gray-800 transition">Cancel</button>
              {step < 3 ? (
                <button onClick={handleNext} className="px-6 py-2 bg-cyan-400 text-gray-950 rounded-xl hover:bg-cyan-500 transition">Next</button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-green-600 text-gray-950 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
                  {loading ? "Creating..." : "Create Organization"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubOrganizationModal;
