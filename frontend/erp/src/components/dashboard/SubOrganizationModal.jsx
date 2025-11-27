import React, { useState } from "react";
import { X, Building, Eye, EyeOff } from "lucide-react";
import { organizationService } from "../../services/organizationService";
import { availableModule } from "../modules/index";
const SubOrganizationModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Organization Details
    name: "",
    subdomain: "",
    plan_tier: "basic",
    email: "",
    phone: "",
    address: "",

    // Step 2: Admin User Details
    admin_email: "",
    admin_password: "",
    admin_first_name: "",
    admin_last_name: "",

<<<<<<< HEAD
    // Step 3: Module Selection
    selected_modules: [],
=======
    // Step 3: Module Selection - FIXED: Changed to module_access
    module_access: []  // Changed from selected_modules to module_access
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // MODULE CHECKBOX HANDLING
    if (type === "checkbox") {
      const moduleObj = availableModule.find((m) => m.code === value);

      const updatedModules = checked
<<<<<<< HEAD
        ? [...formData.selected_modules, moduleObj] // Add module object
        : formData.selected_modules.filter((mod) => mod.code !== value); // Remove module
     
      setFormData((prev) => ({
        ...prev,
        selected_modules: updatedModules,
      }));
      
      return;
=======
        ? [...formData.module_access, value]  // Changed from selected_modules to module_access
        : formData.module_access.filter(mod => mod !== value);  // Changed here too
      
      setFormData(prev => ({
        ...prev,
        module_access: updatedModules  // Changed from selected_modules to module_access
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
    }

    // NORMAL INPUTS
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Organization name is required");
      return false;
    }
    if (!formData.subdomain.trim()) {
      setError("Subdomain is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_email.trim()) {
      setError("Admin email is required");
      return false;
    }
    if (!formData.admin_password.trim()) {
      setError("Admin password is required");
      return false;
    }
    if (formData.admin_password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (!formData.admin_first_name.trim()) {
      setError("Admin first name is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const payload = {
      ...formData,
      selected_modules: formData.selected_modules.map(m => m.code) // 🔥 FIX
    };
      const result = await organizationService.createSubOrganization(payload);

<<<<<<< HEAD
=======
      // Debug: Log what we're sending
      console.log('📤 Submitting sub-organization data:', formData);
      console.log('📤 Selected modules:', formData.module_access);

      const result = await organizationService.createSubOrganization(formData);
      
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create sub-organization');
      }
    } catch (err) {
<<<<<<< HEAD
      setError("Failed to create sub-organization");
=======
      console.error('❌ Submission error:', err);
      setError(err.message || 'Failed to create sub-organization');
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
    } finally {
      setLoading(false);
    }
  };

  const getModulesForPlan = (plan) => {
<<<<<<< HEAD
    return availableModule.filter((module) =>
=======
    return availableModules.filter(module => 
      module.available_in_plans && 
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
      module.available_in_plans.includes(plan)
    );
  };

  // Debug function to check available modules
  const debugAvailableModules = () => {
    console.log('🔍 Available modules:', availableModules);
    console.log('🔍 Modules for plan:', formData.plan_tier, getModulesForPlan(formData.plan_tier));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Sub Organization
            </h2>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Organization Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain *
                  </label>
                  <input
                    type="text"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="company-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Tier *
                  </label>
                  <select
                    name="plan_tier"
                    value={formData.plan_tier}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="advance">Advance</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@organization.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter organization address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Admin User */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Admin User Account
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="admin_first_name"
                    value={formData.admin_first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="admin_last_name"
                    value={formData.admin_last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@organization.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="admin_password"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Enter password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Module Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Module Access
              </h3>
              <p className="text-sm text-gray-600">
                Select which modules this sub-organization can access. Available
                modules depend on the selected plan ({formData.plan_tier}).
              </p>

              {/* Debug button - remove in production */}
              <button 
                type="button" 
                onClick={debugAvailableModules}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
              >
                Debug Modules
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getModulesForPlan(formData.plan_tier).map((module) => (
                  <label
                    key={module.code}
                    className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={module.code}
<<<<<<< HEAD
                      checked={formData.selected_modules.some(
                        (m) => m.code === module.code
                      )}
=======
                      checked={formData.module_access.includes(module.code)}  // Changed from selected_modules to module_access
>>>>>>> d01179eb4bb16d3bd37bdda3c250542b438cd396
                      onChange={handleInputChange}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {module.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {module.description}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {module.pages?.length || 0} pages available
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          formData.module_access.includes(module.code)  // Changed here too
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formData.module_access.includes(module.code) ? 'Selected' : 'Not Selected'}  {/* Changed here */}
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

              {/* Show selected modules count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Selected: {formData.module_access.length} modules</strong>  {/* Changed here */}
                  {formData.module_access.length > 0 && (
                    <span className="ml-2">
                      ({formData.module_access.join(', ')})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
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
