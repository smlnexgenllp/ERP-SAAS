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
  submitted: "bg-gray-600 text-gray-200",
  review: "bg-blue-600 text-white",
  interview: "bg-purple-600 text-white",
  selected: "bg-green-600 text-white",
  rejected: "bg-red-600 text-white",
  joined: "bg-cyan-500 text-gray-900 font-bold",
};
const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || "bg-gray-600 text-gray-200";
  return (
    <span className={`inline-block ${color} text-xs px-4 py-1.5 rounded-full shadow shadow-black/50`}>
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
    }
  };
  const fetchJobOpenings = async () => {
    try {
      const res = await api.get("/hr/job-openings/");
      setJobOpenings(res.data || []);
    } catch (err) {
      setError("Failed to load job openings");
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
      setFormData({ ...formData, resume: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("candidate_name", formData.candidate_name);
      data.append("candidate_email", formData.candidate_email);
      data.append("candidate_phone", formData.candidate_phone);
      data.append("job_opening", formData.job_opening);
      data.append("description", formData.description);
      if (formData.resume) data.append("resume", formData.resume);

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
      document.querySelector('input[type="file"]').value = ""; // Clear file input

      fetchReferrals();
    } catch (err) {
      console.error(err.response?.data);
      alert("Failed to submit referral");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono p-6">
      {/* Header */}
      <header className="border-b border-cyan-800 pb-4 mb-8 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow shadow-cyan-400/50 animate-pulse"></div>
        <h1 className="text-blue-300 text-xl font-bold">
          ALU-CORE: JOB REFERRALS
        </h1>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Referral Submission Form */}
        <div className="xl:col-span-1">
          <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow p-6 backdrop-blur">
            <h3 className="text-blue-300 text-lg font-bold mb-6 flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Submit New Referral
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4" /> Candidate Name
                </label>
                <input
                  type="text"
                  name="candidate_name"
                  placeholder="John Doe"
                  value={formData.candidate_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-300 placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input
                  type="email"
                  name="candidate_email"
                  placeholder="john@example.com"
                  value={formData.candidate_email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-300 placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <input
                  type="text"
                  name="candidate_phone"
                  placeholder="+91 98765 43210"
                  value={formData.candidate_phone}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-300 placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4" /> Job Opening
                </label>
                <select
                  name="job_opening"
                  value={formData.job_opening}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-300 focus:border-cyan-400 focus:outline-none transition"
                >
                  <option value="" className="bg-gray-900">Select Job Opening</option>
                  {jobOpenings.map((job) => (
                    <option key={job.id} value={job.id} className="bg-gray-900">
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" /> Remarks / Description
                </label>
                <textarea
                  name="description"
                  placeholder="Why is this candidate a good fit?"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-gray-900/50 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-300 placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4" /> Resume (Optional)
                </label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx"
                  className="w-full file:bg-cyan-900/50 file:text-cyan-300 file:border file:border-cyan-800 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:cursor-pointer text-gray-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-gray-900 font-bold py-3.5 rounded-lg hover:opacity-90 transition shadow-lg shadow-cyan-900/30"
              >
                Submit Referral
              </button>
            </form>
          </div>
        </div>

        {/* Right: Referrals List */}
        <div className="xl:col-span-2">
          <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow p-6">
            <h3 className="text-blue-300 text-lg font-bold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                All Referrals ({referrals.length})
              </span>
            </h3>

            {loading && (
              <p className="text-center text-gray-400 py-12">Loading referrals...</p>
            )}

            {error && (
              <p className="text-center text-red-400 py-8">{error}</p>
            )}

            {!loading && referrals.length === 0 && (
              <p className="text-center text-gray-500 py-16">
                No referrals submitted yet.
              </p>
            )}

            {!loading && referrals.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyan-900 text-gray-400">
                      <th className="text-left py-4 px-3">Candidate</th>
                      <th className="text-left py-4 px-3">Email</th>
                      <th className="text-left py-4 px-3">Phone</th>
                      <th className="text-left py-4 px-3">Job</th>
                      <th className="text-center py-4 px-3">Status</th>
                      <th className="text-center py-4 px-3">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {referrals.map((ref) => (
                      <tr key={ref.referral_id} className="hover:bg-gray-900/40 transition">
                        <td className="py-4 px-3 font-medium">{ref.candidate_name}</td>
                        <td className="py-4 px-3 text-gray-400">{ref.candidate_email}</td>
                        <td className="py-4 px-3 text-gray-400">{ref.candidate_phone || "—"}</td>
                        <td className="py-4 px-3">
                          <span className="text-cyan-400">
                            {ref.job_opening_title || ref.job_opening}
                          </span>
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
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                            >
                              View <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-600">—</span>
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
  );
};

export default JobReferral;