import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  Mail,
  Phone,
  Calendar,
  Cake,
  Upload,
  Users,
  MapPin,
  Lock,
} from "lucide-react";

export default function MyProfile() {
  const [employee, setEmployee] = useState({
    full_name: "Loading...",
    employee_code: "---",
    department: { name: "—" },
    designation: { title: "—" },
    email: "—",
    phone: "—",
    date_of_joining: null,
    date_of_birth: null,
    location: "—",
    reporting_to: { id: null, name: "—" },
    employment_type: "—",
    status: "Active",
    photo: null,
    ctc: null,
  });

  const [managers, setManagers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const fileInputRef = useRef(null);
  const DOC_STORAGE_KEY = "alu_core_employee_docs_v1";

  // Leave request state
  const [leave, setLeave] = useState({
    type: "",
    from: "",
    to: "",
    reason: "",
    manager: "",
  });

  // Permission request state
  const [permission, setPermission] = useState({
    date: "",
    from: "",
    to: "",
    reason: "",
    manager: "",
  });

  useEffect(() => {
    fetchMyProfile();
    fetchMyDocuments();
    fetchManagers();
  }, []);

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/hr/employees/me/");
      setEmployee(res.data);
    } catch {
      console.warn("fallback employee data...");
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get("/hr/managers/");
      setManagers(res.data);
    } catch {
      setManagers([]);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      const res = await api.get("/hr/employee-documents/");
      setDocuments(res.data);
    } catch {
      loadLocalDocuments();
    }
  };

  const loadLocalDocuments = () => {
    const saved = JSON.parse(localStorage.getItem(DOC_STORAGE_KEY) || "[]");
    setDocuments(saved);
  };

  const saveLocalDocuments = (docs) => {
    localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(docs));
    setDocuments(docs);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Select a file first");

    const reader = new FileReader();
    reader.onload = () => {
      const id = "DOC-" + Date.now().toString(36).toUpperCase();
      const newDoc = {
        id,
        title: selectedFile.name,
        fileName: selectedFile.name,
        uploaded_at: new Date().toISOString(),
        size: selectedFile.size,
        preview: reader.result,
      };

      const updated = [newDoc, ...documents];
      saveLocalDocuments(updated);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsDataURL(selectedFile);

    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("title", selectedFile.name);
      await api.post("/hr/employee-documents/", form);
    } catch {}
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this document?")) return;
    saveLocalDocuments(documents.filter((d) => d.id !== id));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  // Leave submit
  const submitLeaveRequest = async () => {
    try {
      await api.post("/hr/leave-requests/", leave);
      alert("Leave Request Submitted");
      setLeave({ type: "", from: "", to: "", reason: "", manager: "" });
    } catch {
      alert("Failed to submit leave");
    }
  };

  // Permission submit
  const submitPermissionRequest = async () => {
    try {
      await api.post("/hr/permission/", permission);
      alert("Permission Request Submitted");
      setPermission({ date: "", from: "", to: "", reason: "", manager: "" });
    } catch {
      alert("Failed to submit permission");
    }
  };

  // Password update
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password)
      return alert("Passwords don't match");

    try {
      await api.post("/auth/change-password/", {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      alert("Password updated");
      setIsChangingPassword(false);
    } catch {
      alert("Password update failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-cyan-300 text-xl">
        Loading Profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      {/* HEADER */}
      <header className="border-b border-cyan-800 pb-3 mb-6 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow"></div>
        <h1 className="text-pink-400 text-lg font-bold">EMPLOYEE PROFILE</h1>
        <span className="ml-auto text-gray-400 text-sm">
          [ ID: {employee.employee_code} ] • [ STATUS: {employee.status} ]
        </span>
      </header>

      {/* PROFILE SECTION */}
      <section className="flex gap-6 bg-gray-900/40 border border-cyan-900 p-6 rounded-xl">
        <div>
          {employee.photo ? (
            <img
              src={employee.photo}
              className="w-40 h-40 rounded-xl object-cover border border-cyan-800"
            />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-5xl bg-gray-800 border border-cyan-900 rounded-xl">
              {employee.full_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-cyan-300">
            {employee.full_name}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Info icon={<Mail />} label="Email" value={employee.email} />
            <Info icon={<Phone />} label="Phone" value={employee.phone} />
            <Info
              icon={<Calendar />}
              label="Joining Date"
              value={formatDate(employee.date_of_joining)}
            />
            <Info
              icon={<Cake />}
              label="DOB"
              value={formatDate(employee.date_of_birth)}
            />
            <Info
              icon={<MapPin />}
              label="Location"
              value={employee.location}
            />
            <Info
              icon={<Users />}
              label="Manager"
              value={employee.reporting_to?.name}
            />
          </div>
        </div>
      </section>

      {/* DOCUMENTS + CORE DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* CORE CARD */}
        <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
          <h3 className="text-pink-400 text-xl font-bold mb-4">Core Data</h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee ID" value={employee.employee_code} />
            <Field label="Department" value={employee.department?.name} />
            <Field label="Designation" value={employee.designation?.title} />
            <Field
              label="CTC"
              value={employee.ctc ? `₹${employee.ctc.toLocaleString()}` : "—"}
            />
            <Field label="Employment Type" value={employee.employment_type} />
            <Field
              label="Reporting Manager"
              value={employee.reporting_to?.name}
            />
          </div>

          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="mt-4 px-4 py-2 border border-cyan-700 rounded-lg text-cyan-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <Lock size={18} />
            {isChangingPassword ? "Cancel" : "Change Password"}
          </button>

          {isChangingPassword && (
            <form
              onSubmit={handlePasswordChange}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                type="password"
                required
                placeholder="Current Password"
                className="px-3 py-2 bg-gray-800 border border-cyan-800 rounded"
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    current_password: e.target.value,
                  })
                }
              />

              <input
                type="password"
                required
                placeholder="New Password"
                className="px-3 py-2 bg-gray-800 border border-cyan-800 rounded"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
              />

              <input
                type="password"
                required
                placeholder="Confirm Password"
                className="px-3 py-2 bg-gray-800 border border-cyan-800 rounded"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
              />

              <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 font-bold rounded">
                Update Password
              </button>
            </form>
          )}
        </div>

        {/* DOCUMENTS CARD */}
        <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
          <h3 className="text-pink-400 text-xl font-bold mb-4">Documents</h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="text-cyan-300"
          />

          <button
            disabled={!selectedFile}
            onClick={handleUpload}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 font-bold rounded disabled:opacity-40"
          >
            <Upload size={16} className="inline mr-1" /> Upload
          </button>

          <div className="mt-6">
            {documents.length === 0 ? (
              <p className="text-gray-400 text-sm">No documents uploaded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-cyan-300 border-b border-cyan-800">
                    <th className="text-left py-2">Title</th>
                    <th>Uploaded</th>
                    <th>Size</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-b border-gray-800">
                      <td className="py-2 font-bold">{d.title}</td>
                      <td>{formatDate(d.uploaded_at)}</td>
                      <td>
                        {d.size ? `${(d.size / 1024).toFixed(1)} KB` : "—"}
                      </td>

                      <td className="flex gap-3 py-2">
                        <button
                          className="text-cyan-300 underline"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = d.preview;
                            a.download = d.fileName;
                            a.click();
                          }}
                        >
                          View
                        </button>

                        <button
                          className="text-red-400 underline"
                          onClick={() => handleDelete(d.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* LEAVE + PERMISSION REQUEST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* LEAVE REQUEST */}
        <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
          <h3 className="text-pink-400 text-xl font-bold mb-4">
            Leave Request
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitLeaveRequest();
            }}
            className="flex flex-col gap-3"
          >
            <select
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={leave.type}
              onChange={(e) => setLeave({ ...leave, type: e.target.value })}
              required
            >
              <option value="">Select Leave Type</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="wfh">Work From Home</option>
            </select>

            <input
              type="date"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={leave.from}
              onChange={(e) => setLeave({ ...leave, from: e.target.value })}
            />

            <input
              type="date"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={leave.to}
              onChange={(e) => setLeave({ ...leave, to: e.target.value })}
            />

            <select
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={leave.manager}
              onChange={(e) => setLeave({ ...leave, manager: e.target.value })}
            >
              <option value="">Select Manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Reason"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={leave.reason}
              onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
            />

            <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 font-bold rounded">
              Submit Leave Request
            </button>
          </form>
        </div>

        {/* PERMISSION REQUEST */}
        <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
          <h3 className="text-pink-400 text-xl font-bold mb-4">
            Permission Request
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPermissionRequest();
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="date"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={permission.date}
              onChange={(e) =>
                setPermission({ ...permission, date: e.target.value })
              }
            />

            <input
              type="time"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={permission.from}
              onChange={(e) =>
                setPermission({ ...permission, from: e.target.value })
              }
            />

            <input
              type="time"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={permission.to}
              onChange={(e) =>
                setPermission({ ...permission, to: e.target.value })
              }
            />

            <select
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={permission.manager}
              onChange={(e) =>
                setPermission({ ...permission, manager: e.target.value })
              }
            >
              <option value="">Select Manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Reason"
              required
              className="bg-gray-800 border border-cyan-800 rounded px-3 py-2"
              value={permission.reason}
              onChange={(e) =>
                setPermission({ ...permission, reason: e.target.value })
              }
            />

            <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 font-bold rounded">
              Submit Permission Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sub-components
const Info = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-cyan-400">{icon}</div>
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div className="bg-gray-900 p-3 border border-cyan-900 rounded">
    <div className="text-gray-400 text-xs">{label}</div>
    <div className="font-bold text-cyan-200">{value}</div>
  </div>
);
