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
} from "lucide-react";

const STATUS = ["submitted", "review", "interview", "selected", "rejected", "joined"];

const getStatusBadge = (status) => {
  const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium border";
  switch (status) {
    case "submitted": return `${baseClasses} bg-gray-800/70 text-gray-300 border-gray-700`;
    case "review": return `${baseClasses} bg-blue-900/50 text-blue-300 border-blue-700`;
    case "interview": return `${baseClasses} bg-purple-900/50 text-purple-300 border-purple-700`;
    case "selected": return `${baseClasses} bg-green-900/50 text-green-300 border-green-700`;
    case "rejected": return `${baseClasses} bg-red-900/50 text-red-300 border-red-700`;
    case "joined": return `${baseClasses} bg-cyan-800/70 text-cyan-100 border-cyan-600`;
    default: return `${baseClasses} bg-gray-800/70 text-gray-300`;
  }
};

const JobOpeningUpdate = () => {
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
      console.log(res.data)
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
    <div className="min-h-screen bg-gray-950 text-cyan-200 p-6">
      {/* Header */}
      <header className="mb-8 border-b border-cyan-900/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse"></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ALU-CORE: Talent Acquisition
          </h1>
        </div>
      </header>

      {/* Top: Form Left + Job List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Job Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {selectedJob ? "Edit Job Opening" : "Create New Job Opening"}
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
            />
            <textarea
              rows="5"
              placeholder="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={saveJob}
                disabled={!title.trim() || !description.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-cyan-600/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedJob ? "Update" : "Create"}
              </button>
              {selectedJob && (
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-cyan-700 text-cyan-300 text-sm rounded-lg hover:bg-cyan-900/20 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Job List */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Active Openings ({jobs.length})
          </h3>
          {jobs.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No job openings yet. Create one to start receiving referrals.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => selectJobForEdit(job)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedJob?.id === job.id
                      ? "border-cyan-500 bg-cyan-900/20 shadow-md"
                      : "border-cyan-900/40 bg-gray-800/30 hover:border-cyan-600"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-cyan-200">{job.title}</h4>
                      {job.organization?.name && (
                        <p className="text-xs text-gray-400 mt-1">
                          {job.organization.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJob(job.id);
                      }}
                      className="text-red-400 hover:text-red-300 transition ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Full Width: Referrals */}
      <div className="space-y-5">
        {selectedJob ? (
          <>
            {/* Header + Direct Offer */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl p-5 shadow-xl">
              <h2 className="text-xl font-semibold text-cyan-300">
                Referrals for:{' '}
                <span className="text-cyan-100">
                  {selectedJob.title}
                  {selectedJob.organization?.name && ` - ${selectedJob.organization.name}`}
                </span>
              </h2>
              <button
                onClick={() => setShowDirectOfferModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-green-600/40 transition hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Send Direct Offer
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search candidate, referrer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-sm text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>
                <div className="relative sm:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-gray-800/60 border border-cyan-800/50 rounded-lg text-sm text-cyan-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    {STATUS.map((s) => (
                      <option key={s} value={s} className="bg-gray-900">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {(searchQuery || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="px-4 py-2.5 border border-cyan-700 text-cyan-300 text-sm rounded-lg hover:bg-cyan-900/20 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Referrals Table */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl shadow-xl overflow-hidden">
              {filteredReferrals.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {referrals.length === 0 ? "No referrals yet." : "No matching referrals."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cyan-900/20 border-b border-cyan-800/50">
                      <tr>
                        <th className="text-left py-3 px-5 font-medium text-cyan-200">Candidate</th>
                        <th className="text-left py-3 px-5 font-medium text-cyan-200">Referred By</th>
                        <th className="text-left py-3 px-5 font-medium text-cyan-200">Job</th>
                        <th className="text-center py-3 px-5 font-medium text-cyan-200">Resume</th>
                        <th className="text-center py-3 px-5 font-medium text-cyan-200">Status</th>
                        <th className="text-center py-3 px-5 font-medium text-cyan-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30">
                      {filteredReferrals.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-800/30 transition">
                          <td className="py-4 px-5 font-medium">{r.candidate_name}</td>
                          <td className="py-4 px-5">
                            <button
                              onClick={() => setShowReferrerDetails(showReferrerDetails === r.id ? null : r.id)}
                              className="flex items-center gap-2 text-cyan-300 hover:text-cyan-100 transition text-sm"
                            >
                              <User className="w-4 h-4" />
                              {r.referred_by_name || "Unknown"}
                            </button>
                            {showReferrerDetails === r.id && (
                              <div className="absolute z-20 mt-2 left-5 w-64 bg-gray-900/95 border border-cyan-700 rounded-lg shadow-xl p-4 text-sm">
                                <div className="space-y-2">
                                  <p className="flex items-center gap-2 font-medium">
                                    <User className="w-4 h-4" /> {r.referred_by_name}
                                  </p>
                                  {r.referred_by_email && (
                                    <p className="flex items-center gap-2 text-gray-400">
                                      <Mail className="w-4 h-4" /> {r.referred_by_email}
                                    </p>
                                  )}
                                  {r.referred_by_phone && (
                                    <p className="flex items-center gap-2 text-gray-400">
                                      <Phone className="w-4 h-4" /> {r.referred_by_phone}
                                    </p>
                                  )}
                                </div>
                                <div className="absolute -top-2 left-8 w-4 h-4 bg-gray-900/95 border-l border-t border-cyan-700 rotate-45"></div>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <div>
                              <p className="font-medium text-cyan-300">
                                {r.job_opening.title}
                              </p>
                              {r.job_opening.organization?.name && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {r.job_opening.organization.name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            {r.resume ? (
                              <a
                                href={r.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-200 transition"
                              >
                                <Download className="w-4 h-4 inline" />
                              </a>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <select
                              value={r.status}
                              onChange={(e) => updateStatus(r.id, e.target.value)}
                              disabled={r.status === "joined"}
                              className="px-3 py-1 bg-gray-800/60 border border-cyan-800/50 rounded text-xs focus:border-cyan-400 transition mb-2"
                            >
                              {STATUS.map((s) => (
                                <option key={s} value={s} className="bg-gray-900">
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                            <div>
                              <span className={getStatusBadge(r.status)}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            {r.status === "selected" ? (
                              <button
                                onClick={() => openOfferModal(r)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-700/60 hover:bg-green-600 text-white text-xs font-medium rounded transition"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Send Offer
                              </button>
                            ) : r.status === "joined" ? (
                              <span className="text-cyan-400 text-xs font-medium flex items-center gap-1.5 justify-center">
                                <ExternalLink className="w-3.5 h-3.5" />
                                Joined
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
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
          <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-800/40 rounded-xl shadow-xl p-12 text-center">
            <UserPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Select or create a job opening to manage referrals.</p>
          </div>
        )}
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