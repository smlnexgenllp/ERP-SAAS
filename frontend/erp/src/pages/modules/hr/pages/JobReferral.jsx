import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { UserPlus, FileText, Mail, Phone, Briefcase, Upload, ExternalLink } from "lucide-react";

const STATUS_LABELS = {
  submitted: "Submitted",
  review: "Under Review",
  interview: "Interview Scheduled",
  selected: "Selected",
  rejected: "Rejected",
  joined: "Joined",
};

const STATUS_COLORS = {
  submitted: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  review: "bg-blue-100 text-blue-700 border border-blue-200",
  interview: "bg-purple-100 text-purple-700 border border-purple-200",
  selected: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  joined: "bg-cyan-100 text-cyan-700 border border-cyan-200",
};

const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || "bg-zinc-100 text-zinc-700 border border-zinc-200";
  return (
    <span className={`inline-block ${color} text-xs px-4 py-1.5 rounded-full`}>
      {label}
    </span>
  );
};

const JobReferral = () => {
  const [referrals, setReferrals] = useState([]);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    job_opening: "",
    description: "",
    resume: null,
  });

  const fetchReferrals = async () => {
    try {
      const res = await api.get("/hr/referrals/");
      setReferrals(res.data || []);
    } catch (err) {
      setError("Failed to load referrals");
      console.error(err);
    }
  };

  const fetchJobOpenings = async () => {
    try {
      const res = await api.get("/hr/job-openings/");
      setJobOpenings(res.data || []);
    } catch (err) {
      setError("Failed to load job openings");
      console.error(err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchReferrals(), fetchJobOpenings()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "resume") {
      setFormData({ ...formData, resume: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.job_opening) {
      alert("Please select a job opening");
      return;
    }

    try {
      const data = new FormData();
      data.append("candidate_name", formData.candidate_name);
      data.append("candidate_email", formData.candidate_email);
      data.append("candidate_phone", formData.candidate_phone || "");
      data.append("job_opening", formData.job_opening);
      data.append("description", formData.description || "");
      if (formData.resume) {
        data.append("resume", formData.resume);
      }

      await api.post("/hr/referrals/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Referral submitted successfully!");
      setFormData({
        candidate_name: "",
        candidate_email: "",
        candidate_phone: "",
        job_opening: "",
        description: "",
        resume: null,
      });
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      await fetchReferrals();
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      alert("Failed to submit referral. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 flex items-center gap-4">
            <UserPlus className="w-10 h-10 text-blue-600" />
            Job Referrals
          </h1>
          <p className="text-zinc-500 mt-2">Submit and track employee referrals</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Referral Submission Form */}
          <div className="xl:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                Submit New Referral
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="candidate_name"
                    placeholder="John Doe"
                    value={formData.candidate_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="candidate_email"
                    placeholder="john@example.com"
                    value={formData.candidate_email}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Phone</label>
                  <input
                    type="text"
                    name="candidate_phone"
                    placeholder="+91 98765 43210"
                    value={formData.candidate_phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Job Opening <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="job_opening"
                    value={formData.job_opening}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Job Opening</option>
                    {jobOpenings.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} {job.organization?.name && `(${job.organization.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Remarks / Description</label>
                  <textarea
                    name="description"
                    placeholder="Why is this candidate a good fit?"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Resume (Optional)</label>
                  <input
                    type="file"
                    name="resume"
                    onChange={handleChange}
                    accept=".pdf,.doc,.docx"
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition"
                >
                  Submit Referral
                </button>
              </form>
            </div>
          </div>

          {/* Right: Referrals List */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6" />
                All Referrals ({referrals.length})
              </h3>

              {loading && (
                <p className="text-center text-zinc-500 py-12">Loading referrals...</p>
              )}

              {error && (
                <p className="text-center text-red-500 py-8">{error}</p>
              )}

              {!loading && referrals.length === 0 && (
                <p className="text-center text-zinc-500 py-16">
                  No referrals submitted yet.
                </p>
              )}

              {!loading && referrals.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-600">
                        <th className="text-left py-4 px-3">Candidate</th>
                        <th className="text-left py-4 px-3">Email</th>
                        <th className="text-left py-4 px-3">Phone</th>
                        <th className="text-left py-4 px-3">Job</th>
                        <th className="text-center py-4 px-3">Status</th>
                        <th className="text-center py-4 px-3">Resume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {referrals.map((ref) => (
                        <tr key={ref.referral_id} className="hover:bg-zinc-50 transition">
                          <td className="py-4 px-3 font-medium">{ref.candidate_name}</td>
                          <td className="py-4 px-3 text-zinc-600">{ref.candidate_email}</td>
                          <td className="py-4 px-3 text-zinc-600">{ref.candidate_phone || "—"}</td>
                          <td className="py-4 px-3">
                            <div>
                              <span className="text-zinc-900 font-medium">
                                {ref.job_opening.title}
                              </span>
                              {ref.job_opening.organization?.name && (
                                <p className="text-xs text-zinc-500">
                                  {ref.job_opening.organization.name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <StatusBadge status={ref.status} />
                          </td>
                          <td className="py-4 px-3 text-center">
                            {ref.resume ? (
                              <a
                                href={ref.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition"
                              >
                                View <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobReferral;