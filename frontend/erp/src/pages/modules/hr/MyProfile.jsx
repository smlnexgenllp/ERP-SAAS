import React, { useEffect, useState } from "react";
import {
  fetchMyProfile,
  fetchManagers,
  fetchLeaveHistory,
  fetchPermissionHistory,
  uploadMyDocument,
  fetchMyDocuments,
  deleteDocument,
} from "../../../pages/modules/hr/api/hrApi";
import api from "../../../services/api";
import {
  Upload, Eye, Trash2, FileText, Calendar, Clock, X, ChevronRight,
  Gift, Users, CheckCircle, XCircle, Clock as ClockIcon
} from "lucide-react";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [newDocs, setNewDocs] = useState({
    resume: null, aadhaar: null, pan: null, education: null, offer_letter: null, others: null
  });
  const [managers, setManagers] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [permissionHistory, setPermissionHistory] = useState([]);
  const [leaveBalance] = useState({ sick: 7, casual: 2, earned: 4 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [leave, setLeave] = useState({ type: "", from: "", to: "", reason: "", manager_id: "" });
  const [permission, setPermission] = useState({ date: "", from: "", to: "", reason: "", manager_id: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadProfile(),
      loadManagers(),
      loadLeaveHistory(),
      loadPermissionHistory(),
      loadDocuments(),
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const res = await fetchMyProfile();
      setProfile(res.data);
    } catch (err) { console.log("Profile error:", err); }
  };

  const loadManagers = async () => {
    try {
      const res = await fetchManagers();
      setManagers(res.data || []);
    } catch (err) { console.log(err); }
  };

  const loadLeaveHistory = async () => {
    try {
      const data = await fetchLeaveHistory();
      setLeaveHistory(data || []);
    } catch (err) { console.log(err); }
  };

  const loadPermissionHistory = async () => {
    try {
      const data = await fetchPermissionHistory();
      setPermissionHistory(data || []);
    } catch (err) { console.log(err); }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetchMyDocuments();
      setUploadedDocs(res.data || []);
    } catch (err) { console.log("Documents error:", err); }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      const isAlreadyUploaded = uploadedDocs.some(doc => doc.title === name);
      if (!isAlreadyUploaded) {
        setNewDocs({ ...newDocs, [name]: files[0] });
      } else {
        alert(`${formatTitle(name)} is already submitted!`);
      }
    }
  };

  const saveDocuments = async () => {
    const filesToUpload = Object.entries(newDocs).filter(([_, f]) => f);
    if (filesToUpload.length === 0) return alert("Please select at least one file");

    for (const [type, file] of filesToUpload) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", type);
      formData.append("employee", profile.id);
      try {
        await uploadMyDocument(formData);
      } catch (err) {
        console.error(`Upload failed for ${type}:`, err);
      }
    }

    alert("All selected documents uploaded successfully!");
    setNewDocs({ resume: null, aadhaar: null, pan: null, education: null, offer_letter: null, others: null });
    document.querySelectorAll('input[type="file"]').forEach(i => i.value = "");
    loadDocuments();
  };

  const deleteDoc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
      alert("Document deleted");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post("/hr/leave-requests/", {
        leave_type: leave.type,
        start_date: leave.from,
        end_date: leave.to,
        reason: leave.reason,
        manager_id: leave.manager_id,
      });
      alert("Leave request submitted successfully!");
      setShowLeaveModal(false);
      setLeave({ type: "", from: "", to: "", reason: "", manager_id: "" });
      loadLeaveHistory();
    } catch (err) {
      alert("Failed to submit leave request");
    }
  };

  const submitPermission = async (e) => {
    e.preventDefault();
    try {
      await api.post("/hr/permission/", {
        date: permission.date,
        time_from: permission.from,
        time_to: permission.to,
        reason: permission.reason,
        manager_id: permission.manager_id,
      });
      alert("Permission request submitted successfully!");
      setShowPermissionModal(false);
      setPermission({ date: "", from: "", to: "", reason: "", manager_id: "" });
      loadPermissionHistory();
    } catch (err) {
      alert("Failed to submit permission request");
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Approved</span>;
    if (s === "rejected") return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-4 h-4" /> Rejected</span>;
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1"><ClockIcon className="w-4 h-4" /> Pending</span>;
  };

  const formatTitle = (title) => {
    const map = {
      resume: "Resume", aadhaar: "Aadhaar Card", pan: "PAN Card",
      education: "Educational Certificates", offer_letter: "Offer Letter", others: "Other Documents"
    };
    return map[title] || title.charAt(0).toUpperCase() + title.slice(1).replace("_", " ");
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl font-bold">
        Loading Dashboard...
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-8 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold">Hello, {profile.full_name.split(" ")[0]}!</h1>
            <p className="text-lg opacity-90 mt-2">Hope you are having a great day</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">{today}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-between transition"
              >
                <span className="flex items-center gap-3"><Calendar className="w-5 h-5 text-blue-600" /> Apply Leave</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center justify-between transition"
              >
                <span className="flex items-center gap-3"><Clock className="w-5 h-5 text-purple-600" /> Request Permission</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
              <Users className="w-5 h-5" /> Team Planned Leaves
            </h3>
            <p className="text-3xl font-bold text-gray-800">2 members</p>
            <a href="#" className="text-blue-600 text-sm hover:underline block mt-2">View all</a>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Birthday Widget */}
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gift className="w-12 h-12 text-amber-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Happy Birthday!</h3>
                <p className="text-gray-700">15 people wished you today</p>
              </div>
            </div>
            <button className="text-amber-700 font-medium hover:underline">View Wishes</button>
          </div>

          {/* Leave Balance */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Leave Balance</h3>
              <a href="#" className="text-blue-600 hover:underline">See all</a>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {leaveBalance.sick}
                </div>
                <p className="mt-3 text-gray-700 font-medium">Sick Leave</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {leaveBalance.casual}
                </div>
                <p className="mt-3 text-gray-700 font-medium">Casual Leave</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {leaveBalance.earned}
                </div>
                <p className="mt-3 text-gray-700 font-medium">Earned Leave</p>
              </div>
            </div>
          </div>

          {/* Main Card with Tabs */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Requests & Documents</h3>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 text-sm font-medium">
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-6 py-3 ${activeTab === "documents" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                My Documents
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-3 ${activeTab === "upload" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Upload Documents
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`px-6 py-3 ${activeTab === "status" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Request Status
              </button>
            </div>

            {/* My Documents Tab */}
            {activeTab === "documents" && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Uploaded Documents</h4>
                {uploadedDocs.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-12">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-4">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-5 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center gap-4">
                          <FileText className="w-8 h-8 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-800">{formatTitle(doc.title)}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-6 h-6" />
                          </a>
                          <button onClick={() => deleteDoc(doc.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload Documents Tab - With "Already Submitted" */}
            {activeTab === "upload" && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-6">Upload New Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {["resume", "aadhaar", "pan", "education", "offer_letter", "others"].map((key) => {
                    const isUploaded = uploadedDocs.some(doc => doc.title === key);
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formatTitle(key)}
                        </label>

                        {isUploaded ? (
                          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 flex items-center justify-center gap-3 shadow-sm">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <span className="text-lg font-semibold text-green-700">Already Submitted</span>
                          </div>
                        ) : (
                          <input
                            type="file"
                            name={key}
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={saveDocuments}
                  disabled={
                    Object.values(newDocs).every(f => !f) || 
                    Object.keys(newDocs).every(key => uploadedDocs.some(doc => doc.title === key))
                  }
                  className={`w-full px-8 py-3 font-bold rounded-lg shadow-lg transition flex items-center justify-center gap-2 ${
                    Object.values(newDocs).some(f => f) && 
                    !Object.keys(newDocs).every(key => uploadedDocs.some(doc => doc.title === key))
                      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transform hover:scale-105"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  {Object.keys(newDocs).every(key => uploadedDocs.some(doc => doc.title === key))
                    ? "All Documents Submitted"
                    : "Upload Selected Documents"}
                </button>
              </div>
            )}

            {/* Request Status Tab */}
            {activeTab === "status" && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-6">Leave & Permission Requests</h4>
                <div className="space-y-6">
                  {leaveHistory.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-600 mb-3">Leave Requests</h5>
                      {leaveHistory.map((l) => (
                        <div key={l.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium capitalize">{l.leave_type} Leave</p>
                            <p className="text-sm text-gray-600">{l.start_date} to {l.end_date}</p>
                          </div>
                          {getStatusBadge(l.status)}
                        </div>
                      ))}
                    </div>
                  )}

                  {permissionHistory.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-600 mb-3">Permission Requests</h5>
                      {permissionHistory.map((p) => (
                        <div key={p.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{p.date}</p>
                            <p className="text-sm text-gray-600">{p.time_from} - {p.time_to}</p>
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{p.reason}</p>
                          </div>
                          {getStatusBadge(p.status)}
                        </div>
                      ))}
                    </div>
                  )}

                  {leaveHistory.length === 0 && permissionHistory.length === 0 && (
                    <p className="text-gray-500 italic text-center py-12">No requests submitted yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Calendar</h3>
              <a href="#" className="text-blue-600 text-sm hover:underline">Go to Calendar</a>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">March 2025</p>
              <div className="grid grid-cols-7 gap-2 mt-6 text-sm">
                {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                  <div key={d} className="font-bold text-gray-600 py-2">{d}</div>
                ))}
                {Array(31).fill().map((_, i) => (
                  <div key={i} className={`py-3 rounded-lg ${i + 1 === 12 ? 'bg-red-500 text-white font-bold' : ''}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitLeave} className="space-y-4">
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={leave.type} onChange={(e) => setLeave({ ...leave, type: e.target.value })} required>
                <option value="">Select Leave Type</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="wfh">Work From Home</option>
              </select>
              <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={leave.from} onChange={(e) => setLeave({ ...leave, from: e.target.value })} required />
              <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={leave.to} onChange={(e) => setLeave({ ...leave, to: e.target.value })} required />
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={leave.manager_id} onChange={(e) => setLeave({ ...leave, manager_id: e.target.value })} required>
                <option value="">Select Manager</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 resize-none" placeholder="Reason for leave" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} required />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Submit Leave</button>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Request Permission</h2>
              <button onClick={() => setShowPermissionModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitPermission} className="space-y-4">
              <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={permission.date} onChange={(e) => setPermission({ ...permission, date: e.target.value })} required />
              <input type="time" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={permission.from} onChange={(e) => setPermission({ ...permission, from: e.target.value })} required />
              <input type="time" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={permission.to} onChange={(e) => setPermission({ ...permission, to: e.target.value })} required />
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={permission.manager_id} onChange={(e) => setPermission({ ...permission, manager_id: e.target.value })} required>
                <option value="">Select Manager</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 resize-none" placeholder="Reason for permission" value={permission.reason} onChange={(e) => setPermission({ ...permission, reason: e.target.value })} required />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition">Submit Permission</button>
                <button type="button" onClick={() => setShowPermissionModal(false)} className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}