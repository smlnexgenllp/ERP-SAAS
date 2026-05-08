import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";
import {
  FileText,
  UserPlus,
  Clock,
  Trash2,
  Send,
  User,
  Mail,
  Phone,
  Download,
  ExternalLink,
  Plus,
  X,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS = ["submitted", "review", "interview", "selected", "rejected", "joined"];

const getStatusBadge = (status) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "submitted": return `${baseClasses} bg-zinc-100 text-zinc-700 border border-zinc-200`;
    case "review": return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
    case "interview": return `${baseClasses} bg-purple-100 text-purple-700 border border-purple-200`;
    case "selected": return `${baseClasses} bg-emerald-100 text-emerald-700 border border-emerald-200`;
    case "rejected": return `${baseClasses} bg-red-100 text-red-700 border border-red-200`;
    case "joined": return `${baseClasses} bg-cyan-100 text-cyan-700 border border-cyan-200`;
    default: return `${baseClasses} bg-zinc-100 text-zinc-700 border border-zinc-200`;
  }
};

const JobOpeningUpdate = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showReferrerDetails, setShowReferrerDetails] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Direct Offer Modal
  const [showDirectOfferModal, setShowDirectOfferModal] = useState(false);
  const [directCandidate, setDirectCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Custom Send Offer Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [currentReferral, setCurrentReferral] = useState(null);
  const [offerData, setOfferData] = useState({
    company_name: "",
    logo_file: null,
    logo_preview: "",
    from_email: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get("/hr/job-openings/");
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const loadReferrals = async (jobId) => {
    if (!jobId) return;
    try {
      const res = await api.get(`/hr/referrals/?job_opening=${jobId}`);
      setReferrals(res.data || []);
    } catch (err) {
      console.error("Failed to load referrals:", err);
      setReferrals([]);
    }
  };

  const saveJob = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      if (selectedJob) {
        await api.put(`/hr/job-openings/${selectedJob.id}/`, { title, description });
      } else {
        await api.post("/hr/job-openings/", { title, description });
      }
      resetForm();
      await loadJobs();
    } catch (err) {
      alert("Failed to save job opening");
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this job opening? All referrals will be lost.")) return;
    try {
      await api.delete(`/hr/job-openings/${id}/`);
      await loadJobs();
      if (selectedJob?.id === id) resetForm();
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/hr/referrals/${id}/update-status/`, { status });
      await loadReferrals(selectedJob.id);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const openOfferModal = (referral) => {
    const job = referral.job_opening;
    const branding = job.organization?.branding || {};

    setCurrentReferral(referral);
    setOfferData({
      company_name: branding.name || job.organization?.name || "Your Company",
      logo_preview: branding.logo || "",
      from_email: branding.hr_email || "hr@company.com",
      subject: `Job Offer – ${job.title} at ${branding.name || job.organization?.name || "Your Company"}`,
      body: `Dear ${referral.candidate_name},

Congratulations! We are delighted to extend a formal job offer for the position of **${job.title}** at **${branding.name || "our company"}**.

Please find the official offer letter attached.

Best regards,
HR Team
${branding.name || "Our Company"}`,
    });
    setShowOfferModal(true);
  };

  const sendDirectOffer = async () => {
    if (!directCandidate.name.trim() || !directCandidate.email.trim()) {
      alert("Name and Email are required!");
      return;
    }
    try {
      await api.post("/hr/send-direct-offer/", {
        job_opening_id: selectedJob.id,
        candidate_name: directCandidate.name,
        candidate_email: directCandidate.email,
        candidate_phone: directCandidate.phone || null,
        notes: directCandidate.notes || "",
      });
      alert(`Offer sent successfully to ${directCandidate.name}!`);
      setShowDirectOfferModal(false);
      setDirectCandidate({ name: "", email: "", phone: "", notes: "" });
    } catch (err) {
      alert("Failed to send direct offer.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedJob(null);
    setReferrals([]);
    setShowReferrerDetails(null);
    setSearchQuery("");
    setStatusFilter("all");
  };

  const selectJobForEdit = (job) => {
    setSelectedJob(job);
    setTitle(job.title);
    setDescription(job.description);
    loadReferrals(job.id);
    setShowReferrerDetails(null);
    setSearchQuery("");
    setStatusFilter("all");
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const matchesSearch =
        r.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.referred_by_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.referred_by_email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [referrals, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Talent Acquisition
                </h1>
                <p className="text-zinc-500">Manage job openings and candidate referrals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top: Form + Job List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Form */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
            <h3 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6" />
              {selectedJob ? "Edit Job Opening" : "Create New Job Opening"}
            </h3>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              />
              <textarea
                rows="5"
                placeholder="Job Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 resize-y"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveJob}
                  disabled={!title.trim() || !description.trim()}
                  className="px-6 py-3 bg-zinc-900 text-white font-medium rounded-2xl hover:bg-black transition disabled:opacity-50"
                >
                  {selectedJob ? "Update Job" : "Create Job"}
                </button>
                {selectedJob && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Job Openings */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
            <h3 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
              <UserPlus className="w-6 h-6" />
              Active Openings ({jobs.length})
            </h3>
            {jobs.length === 0 ? (
              <p className="text-center text-zinc-500 py-16">No job openings yet. Create one above.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => selectJobForEdit(job)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      selectedJob?.id === job.id
                        ? "border-zinc-900 bg-zinc-50 shadow"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-zinc-900">{job.title}</h4>
                        {job.organization?.name && (
                          <p className="text-sm text-zinc-500 mt-1">{job.organization.name}</p>
                        )}
                        <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{job.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJob(job.id);
                        }}
                        className="text-red-500 hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Referrals Section */}
        <div className="space-y-6">
          {selectedJob ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  Referrals for: <span className="text-zinc-700">{selectedJob.title}</span>
                </h2>
                <button
                  onClick={() => setShowDirectOfferModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition"
                >
                  <Plus className="w-5 h-5" />
                  Send Direct Offer
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search candidate or referrer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-5 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  {(searchQuery || statusFilter !== "all") && (
                    <button
                      onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                      className="px-6 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Referrals Table */}
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    {referrals.length === 0 ? "No referrals yet for this job." : "No matching referrals found."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-8 py-5 text-left font-semibold text-zinc-600">Candidate</th>
                          <th className="px-8 py-5 text-left font-semibold text-zinc-600">Referred By</th>
                          <th className="px-8 py-5 text-left font-semibold text-zinc-600">Job</th>
                          <th className="px-8 py-5 text-center font-semibold text-zinc-600">Resume</th>
                          <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                          <th className="px-8 py-5 text-center font-semibold text-zinc-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredReferrals.map((r) => (
                          <tr key={r.id} className="hover:bg-zinc-50 transition">
                            <td className="px-8 py-5 font-medium">{r.candidate_name}</td>
                            <td className="px-8 py-5">
                              <button
                                onClick={() => setShowReferrerDetails(showReferrerDetails === r.id ? null : r.id)}
                                className="text-zinc-700 hover:text-zinc-900 flex items-center gap-2"
                              >
                                <User className="w-4 h-4" />
                                {r.referred_by_name || "Unknown"}
                              </button>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-medium">{r.job_opening.title}</p>
                              {r.job_opening.organization?.name && (
                                <p className="text-xs text-zinc-500">{r.job_opening.organization.name}</p>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center">
                              {r.resume ? (
                                <a href={r.resume} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                                  <Download className="w-5 h-5 inline" />
                                </a>
                              ) : "—"}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <select
                                value={r.status}
                                onChange={(e) => updateStatus(r.id, e.target.value)}
                                disabled={r.status === "joined"}
                                className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm focus:border-zinc-400"
                              >
                                {STATUS.map((s) => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-8 py-5 text-center">
                              {r.status === "selected" && (
                                <button
                                  onClick={() => openOfferModal(r)}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium flex items-center gap-2 mx-auto"
                                >
                                  <Send className="w-4 h-4" /> Send Offer
                                </button>
                              )}
                              {r.status === "joined" && (
                                <span className="text-emerald-600 font-medium">Joined</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-16 text-center">
              <UserPlus className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">Select or create a job opening to manage referrals</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Send Offer Modal */}
      {showOfferModal && currentReferral && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900/95 border border-cyan-700 rounded-xl shadow-2xl p-8 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-3">
                <Send className="w-6 h-6" />
                Customize & Send Job Offer
              </h2>
              <button onClick={() => setShowOfferModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-cyan-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Branding */}
              <div className="space-y-5">
                <h3 className="text-lg font-medium text-cyan-200">Branding (for this offer)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo</label>
                  <div className="flex items-center gap-4">
                    {offerData.logo_preview ? (
                      <img src={offerData.logo_preview} alt="Logo" className="h-20 rounded border border-cyan-800 object-contain bg-white" />
                    ) : (
                      <div className="h-20 w-32 bg-gray-800 rounded border-2 border-dashed border-cyan-800 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setOfferData({
                            ...offerData,
                            logo_file: file,
                            logo_preview: URL.createObjectURL(file),
                          });
                        }
                      }}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-800 file:text-cyan-200 hover:file:bg-cyan-700"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Upload a new logo just for this offer (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={offerData.company_name}
                    onChange={(e) => setOfferData({ ...offerData, company_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                  <input
                    type="email"
                    value={offerData.from_email}
                    onChange={(e) => setOfferData({ ...offerData, from_email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {/* Right: Email Content */}
              <div className="space-y-5">
                <h3 className="text-lg font-medium text-cyan-200">Email Content</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                  <input
                    type="text"
                    value={currentReferral.candidate_email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={offerData.subject}
                    onChange={(e) => setOfferData({ ...offerData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message Body</label>
                  <textarea
                    rows="12"
                    value={offerData.body}
                    onChange={(e) => setOfferData({ ...offerData, body: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 resize-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <button
                onClick={async () => {
                  const formData = new FormData();
                  formData.append("subject", offerData.subject);
                  formData.append("body", offerData.body);
                  formData.append("company_name", offerData.company_name);
                  formData.append("from_email", offerData.from_email);
                  if (offerData.logo_file) {
                    formData.append("custom_logo", offerData.logo_file);
                  }

                  try {
                    await api.post(`/hr/referrals/${currentReferral.id}/send-offer/`, formData);
                    alert("Offer sent successfully with custom branding!");
                    setShowOfferModal(false);
                    await loadReferrals(selectedJob.id);
                  } catch (err) {
                    alert("Failed to send offer.");
                    console.error(err);
                  }
                }}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-green-600/50 transition"
              >
                Send Offer with PDF
              </button>
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Offer Modal */}
      {showDirectOfferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 border border-cyan-700 rounded-xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-cyan-300 flex items-center gap-3">
                <Send className="w-6 h-6" />
                Send Direct Offer
              </h2>
              <button onClick={() => setShowDirectOfferModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-cyan-300" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Position:{' '}
              <span className="text-cyan-300 font-medium">
                {selectedJob.title}
                {selectedJob.organization?.name && ` - ${selectedJob.organization.name}`}
              </span>
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Candidate Name *"
                value={directCandidate.name}
                onChange={(e) => setDirectCandidate({ ...directCandidate, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
              />
              <input
                type="email"
                placeholder="Email *"
                value={directCandidate.email}
                onChange={(e) => setDirectCandidate({ ...directCandidate, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
              />
              <input
                type="text"
                placeholder="Phone (Optional)"
                value={directCandidate.phone}
                onChange={(e) => setDirectCandidate({ ...directCandidate, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
              />
              <textarea
                rows="4"
                placeholder="Notes (Optional)"
                value={directCandidate.notes}
                onChange={(e) => setDirectCandidate({ ...directCandidate, notes: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 resize-none"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={sendDirectOffer}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-green-600/40 transition"
                >
                  Send Offer
                </button>
                <button
                  onClick={() => setShowDirectOfferModal(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobOpeningUpdate;