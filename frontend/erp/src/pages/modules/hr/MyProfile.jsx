import React, { useEffect, useState, useRef } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import {
  fetchMyProfile,
  fetchManagers,
  fetchLeaveHistory,
  fetchPermissionHistory,
  uploadMyDocument,
  fetchMyDocuments,
  deleteDocument,
  fetchTrainingCompletions,
  fetchReimbursements,
  submitReimbursementRequest,
} from "../../../pages/modules/hr/api/hrApi";
import api from "../../../services/api";
import {
  Upload,
  Eye,
  Trash2,
  FileText,
  Calendar,
  Clock,
  X,
  ChevronRight,
  Gift,
  Users,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  PlayCircle,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [newDocs, setNewDocs] = useState({
    resume: null,
    aadhaar: null,
    pan: null,
    education: null,
    offer_letter: null,
    others: null,
  });
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [permissionHistory, setPermissionHistory] = useState([]);
  const [leaveBalance] = useState({ sick: 7, casual: 2, earned: 4 });
  const [loading, setLoading] = useState(true);

  // Separate tab states – no more conflicts
  const [activeTab, setActiveTab] = useState("documents");
  const [statusSubTab, setStatusSubTab] = useState("leaves"); // leaves | permissions
  const [reimbursementTab, setReimbursementTab] = useState("pending"); // pending | completed

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [allCompleted, setAllCompleted] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [trainingCompletedAt, setTrainingCompletedAt] = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [reimbursementsLoading, setReimbursementsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState("");

  const [leave, setLeave] = useState({
    type: "",
    from: "",
    to: "",
    reason: "",
    manager_id: "",
  });
  const [permission, setPermission] = useState({
    date: "",
    from: "",
    to: "",
    reason: "",
    manager_id: "",
  });
  const [reimbursement, setReimbursement] = useState({
    amount: "",
    date: "",
    reason: "",
    manager_id: "",
  });

  const [command, setCommand] = useState("");
  const inputRef = useRef(null);

  const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL || `${API_BASE_URL}`;

  useEffect(() => {
    loadData();
    fetchTrainingStatus();
    fetchMyReimbursements();
    loadTodayAttendance();
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
    } catch (err) {
      console.log("Profile error:", err);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await fetchManagers();
      setManagers(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const res = await api.get("/hr/attendance/today/");
      setAttendance(res.data);
    } catch (err) {
      console.error("Attendance load failed", err);
    }
  };

  const punchButtonText = () => {
    if (!attendance || !attendance.punch_in) return "Punch In";
    if (!attendance.punch_out) return "Punch Out";
    return "Attendance Completed";
  };

  const handlePunch = async () => {
    setPunchLoading(true);
    setPunchMsg("");
    try {
      let res;
      if (!attendance || !attendance.punch_in) {
        res = await api.post("/hr/attendance/punch-in/");
      } else if (!attendance.punch_out) {
        res = await api.post("/hr/attendance/punch-out/");
      }
      setPunchMsg(res.data.message);
      await loadTodayAttendance();
    } catch (err) {
      setPunchMsg(err.response?.data?.message || "Punch failed");
    } finally {
      setPunchLoading(false);
    }
  };

  const loadLeaveHistory = async () => {
    try {
      const data = await fetchLeaveHistory();
      setLeaveHistory(data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadPermissionHistory = async () => {
    try {
      const data = await fetchPermissionHistory();
      setPermissionHistory(data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetchMyDocuments();
      setUploadedDocs(res.data || []);
    } catch (err) {
      console.log("Documents error:", err);
    }
  };

  const fetchTrainingVideos = async () => {
    setVideosLoading(true);
    try {
      const res = await api.get("/organizations/training-videos/");
      let videos = res.data || [];
      videos.sort((a, b) => a.id - b.id);
      setTrainingVideos(videos);
      setWatchedVideos(new Set());
      setAllCompleted(false);
    } catch (err) {
      console.error("Failed to fetch training videos:", err);
      setTrainingVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchTrainingStatus = async () => {
    try {
      const res = await fetchTrainingCompletions();
      const userCompletion =
        res.data.find((item) => item.employee_id === profile?.id) || res.data[0];
      if (userCompletion) {
        setTrainingCompleted(userCompletion.completed);
        setTrainingCompletedAt(userCompletion.completed_at);
      } else {
        setTrainingCompleted(false);
        setTrainingCompletedAt(null);
      }
    } catch (err) {
      console.error("Failed to fetch training status", err);
      setTrainingCompleted(false);
      setTrainingCompletedAt(null);
    }
  };

  const fetchMyReimbursements = async () => {
    setReimbursementsLoading(true);
    try {
      const res = await fetchReimbursements();
      setReimbursements(res.data || []);
      console.log(res.data)
    } catch (err) {
      console.error("Failed to fetch reimbursements", err);
      setReimbursements([]);
    } finally {
      setReimbursementsLoading(false);
    }
  };

  const openVideosModal = async () => {
    setShowVideosModal(true);
    await Promise.all([fetchTrainingVideos(), fetchTrainingStatus()]);
  };

  const handleVideoEnded = (videoId) => {
    setWatchedVideos((prev) => {
      const newSet = new Set(prev);
      newSet.add(videoId);
      if (newSet.size === trainingVideos.length) {
        setAllCompleted(true);
      }
      return newSet;
    });
  };

  const isVideoUnlocked = (index) => {
    if (index === 0) return true;
    const prevVideo = trainingVideos[index - 1];
    return prevVideo && watchedVideos.has(prevVideo.id);
  };

  const markTrainingCompleted = async () => {
    try {
      const res = await api.post("/organizations/training-completed/");
      setTrainingCompleted(true);
      setTrainingCompletedAt(res.data.completed_at);
      setAllCompleted(true);
      setWatchedVideos(new Set(trainingVideos.map((v) => v.id)));
      alert(
        `Training completed!\nEmployee: ${res.data.employee}\nDate: ${new Date(res.data.completed_at).toLocaleString()}`
      );
      setShowVideosModal(false);
      await fetchTrainingStatus();
    } catch (err) {
      alert("Failed to mark training as completed");
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      const isAlreadyUploaded = uploadedDocs.some((doc) => doc.title === name);
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
    setNewDocs({
      resume: null,
      aadhaar: null,
      pan: null,
      education: null,
      offer_letter: null,
      others: null,
    });
    document.querySelectorAll('input[type="file"]').forEach((i) => (i.value = ""));
    loadDocuments();
  };

  useEffect(() => {
  if (managers.length > 0 && !reimbursement.manager_id) {
    const directManager = managers.find(m => m.is_direct_manager);
    if (directManager) {
      setReimbursement(prev => ({
        ...prev,
        manager_id: directManager.id.toString()
      }));
    }
  }
}, [managers, reimbursement.manager_id]);
 const submitReimbursement = async (e) => {
  e.preventDefault();

  if (!reimbursement.manager_id) {
    alert("Please select a manager");
    return;
  }
  const payload = {
    amount: parseFloat(reimbursement.amount),  
    date: reimbursement.date,
    reason: reimbursement.reason.trim(),
    manager_id: parseInt(reimbursement.manager_id),
  };

  console.log("Sending payload:", payload);  

  try {
    await submitReimbursementRequest(payload);
    alert("Reimbursement request submitted successfully!");
    setShowReimbursementModal(false);
    setReimbursement({ amount: "", date: "", reason: "", manager_id: "" });
    fetchMyReimbursements();
  } catch (err) {
  console.error("Error:", err.response?.data);
  const errors = err.response?.data;
  let msg = "Failed to submit reimbursement request";

  if (errors?.manager_id) msg = errors.manager_id[0];
  else if (errors?.amount) msg = "Invalid amount";
  else if (errors?.non_field_errors) msg = errors.non_field_errors[0];

  alert(msg);
}
};

  const deleteDoc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
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

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    const showAlert = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
    };

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert(
        "Available commands: hrdashboard, profile, leaves, permission, reimbursement, training, status, clear, help"
      );
      return;
    }

    if (cmd === "hrdashboard") {
      window.location.href = "/hr/dashboard";
      return;
    }

    if (["profile", "myprofile", "me"].includes(cmd)) {
      showAlert("You are already on My Profile.");
      return;
    }

    if (["leaves", "leave", "apply leave"].includes(cmd)) {
      setShowLeaveModal(true);
      showAlert("Leave request modal opened.");
      return;
    }

    if (["permission", "perm", "request permission"].includes(cmd)) {
      setShowPermissionModal(true);
      showAlert("Permission request modal opened.");
      return;
    }

    if (["reimbursement", "reimb", "expense"].includes(cmd)) {
      setShowReimbursementModal(true);
      showAlert("Reimbursement request modal opened.");
      return;
    }

    if (["training", "videos", "train"].includes(cmd)) {
      openVideosModal();
      showAlert("Training videos modal opened.");
      return;
    }

    if (cmd === "status") {
      const trainingStatus = trainingCompleted ? "Completed" : "Not Completed";
      showAlert(
        `Leave Balance: Sick(${leaveBalance.sick}) Casual(${leaveBalance.casual}) Earned(${leaveBalance.earned}) | Training: ${trainingStatus}`
      );
      return;
    }

    if (cmd === "clear") {
      showAlert("Terminal feedback cleared.");
      return;
    }

    showAlert(`Unknown command: "${cmd}". Type "help" for available commands.`);
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved")
      return (
        <span className="px-3 py-1 bg-green-900/50 border border-green-600 text-green-300 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> APPROVED
        </span>
      );
    if (s === "rejected")
      return (
        <span className="px-3 py-1 bg-red-900/50 border border-red-600 text-red-300 rounded-full text-xs font-bold flex items-center gap-1">
          <XCircle className="w-4 h-4" /> REJECTED
        </span>
      );
    return (
      <span className="px-3 py-1 bg-yellow-900/50 border border-yellow-600 text-yellow-300 rounded-full text-xs font-bold flex items-center gap-1">
        <ClockIcon className="w-4 h-4" /> PENDING
      </span>
    );
  };

  const formatTitle = (title) => {
    const map = {
      resume: "Resume",
      aadhaar: "Aadhaar Card",
      pan: "PAN Card",
      education: "Educational Certificates",
      offer_letter: "Offer Letter",
      others: "Other Documents",
    };
    return map[title] || title.charAt(0).toUpperCase() + title.slice(1).replace("_", " ");
  };

  const filteredReimbursements = reimbursements.filter((r) => {
    const status = (r.status || "").toLowerCase();
    if (reimbursementTab === "pending") {
      return status === "" || status === "pending";
    }
    return status === "approved" || status === "rejected";
  });

  const handleCommandBarClick = () => {
    inputRef.current?.focus();
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-cyan-300 text-xl font-mono">
        Loading My Profile...
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calendar for December 2025 (current date: December 26, 2025)
  const monthName = "December 2025";
  const daysInMonth = 31;
  const firstDayOfMonth = 1; // December 1, 2025 is a Monday (0=Sun, 1=Mon)

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          <header className="border-b border-cyan-800 pb-3 mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow shadow-cyan-400/50"></div>
            <h1 className="text-blue-300 text-lg font-bold">
              ALU-CORE: MY PROFILE
            </h1>
            <span className="ml-auto text-gray-400 text-sm">
              [ {profile.full_name} ]
            </span>
          </header>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-cyan-300">
              Hello, {profile.full_name.split(" ")[0]}!
            </h2>
            <div className="text-right">
              <p className="text-gray-400 text-lg">{today}</p>
              <button
                onClick={handlePunch}
                disabled={punchLoading || attendance?.punch_out}
                className="mt-3 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold disabled:opacity-50"
              >
                {punchLoading ? "Processing..." : punchButtonText()}
              </button>
              {punchMsg && (
                <p className="mt-2 text-sm text-green-400">{punchMsg}</p>
              )}
            </div>
          </div>

          {trainingCompleted && (
            <div className="bg-gray-900/30 border border-green-800 p-4 rounded-xl mb-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-green-300 font-semibold">
                Training Completed
                {trainingCompletedAt && (
                  <span className="text-sm ml-2 text-gray-400">
                    ({new Date(trainingCompletedAt).toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl p-6">
                <h3 className="text-blue-300 text-xl font-bold mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-cyan-400" /> Apply Leave
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={() => navigate("/hr/jobreferrals")}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-cyan-400" /> Job Referrals
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setShowPermissionModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-cyan-400" /> Request Permission
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={openVideosModal}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <PlayCircle className="w-6 h-6 text-cyan-400" /> Training Videos
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={() => setShowReimbursementModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Gift className="w-6 h-6 text-cyan-400" /> Reimbursement
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigate("/hr/tasks")}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/20 border border-cyan-900 rounded-xl hover:bg-gray-800/40 transition"
                  >
                    <span className="flex items-center gap-3">
                      <ClipboardList className="w-6 h-6 text-cyan-400" />
                      Task Management
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                </div>
              </div>

              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl p-6">
                <h3 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Team Planned Leaves
                </h3>
                <p className="text-3xl font-bold text-cyan-300">2 members</p>
              </div>
            </div>

            {/* Center Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl p-6">
                <h3 className="text-blue-300 text-xl font-bold mb-6">
                  Leave Balance
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg shadow-red-600/50">
                      {leaveBalance.sick}
                    </div>
                    <p className="mt-3 text-gray-400">Sick Leave</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg shadow-cyan-600/50">
                      {leaveBalance.casual}
                    </div>
                    <p className="mt-3 text-gray-400">Casual Leave</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-600/50">
                      {leaveBalance.earned}
                    </div>
                    <p className="mt-3 text-gray-400">Earned Leave</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl p-6">
                <h3 className="text-blue-300 text-xl font-bold mb-6">
                  My Requests & Documents
                </h3>
                <div className="flex border-b border-cyan-800 mb-6 text-sm">
                  {["documents", "upload", "status", "reimbursement"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        if (tab === "status") setStatusSubTab("leaves");
                        if (tab === "reimbursement") setReimbursementTab("pending");
                      }}
                      className={`px-6 py-3 ${activeTab === tab
                          ? "text-cyan-300 border-b-2 border-cyan-400"
                          : "text-gray-500 hover:text-gray-400"
                        } transition`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    {uploadedDocs.length === 0 ? (
                      <p className="text-gray-500 italic text-center py-12">
                        No documents uploaded yet
                      </p>
                    ) : (
                      uploadedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-gray-900/20 p-5 rounded-lg border border-cyan-900/50 hover:bg-gray-800/30 transition"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="w-8 h-8 text-cyan-400" />
                            <div>
                              <p className="font-medium">
                                {formatTitle(doc.title)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded{" "}
                                {doc.uploaded_at
                                  ? new Date(doc.uploaded_at).toLocaleDateString()
                                  : "Recently"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="w-6 h-6 text-cyan-400 hover:text-cyan-300" />
                            </a>
                            <button onClick={() => deleteDoc(doc.id)}>
                              <Trash2 className="w-6 h-6 text-red-400 hover:text-red-300" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === "upload" && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {[
                        "resume",
                        "aadhaar",
                        "pan",
                        "education",
                        "offer_letter",
                        "others",
                      ].map((key) => {
                        const isUploaded = uploadedDocs.some(
                          (doc) => doc.title === key
                        );
                        return (
                          <div key={key}>
                            <label className="block text-sm text-gray-400 mb-2">
                              {formatTitle(key)}
                            </label>
                            {isUploaded ? (
                              <div className="bg-green-900/30 border-2 border-green-600 rounded-lg p-6 flex items-center justify-center gap-3">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                                <span className="font-semibold text-green-300">
                                  Submitted
                                </span>
                              </div>
                            ) : (
                              <input
                                type="file"
                                name={key}
                                onChange={handleFileChange}
                                className="w-full text-sm text-cyan-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-600 file:text-gray-900 hover:file:bg-cyan-500 cursor-pointer"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={saveDocuments}
                      disabled={Object.values(newDocs).every((f) => !f)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-5 h-5" /> Upload Selected Documents
                    </button>
                  </div>
                )}

                {/* Status Tab */}
                {activeTab === "status" && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-6">
                      Leave & Permission Requests
                    </h4>
                    <div className="flex border-b border-cyan-800 mb-6 text-sm">
                      <button
                        onClick={() => setStatusSubTab("leaves")}
                        className={`px-6 py-3 ${statusSubTab === "leaves"
                            ? "text-cyan-300 border-b-2 border-cyan-400"
                            : "text-gray-500 hover:text-gray-400"
                          } transition`}
                      >
                        Leaves
                      </button>
                      <button
                        onClick={() => setStatusSubTab("permissions")}
                        className={`px-6 py-3 ${statusSubTab === "permissions"
                            ? "text-cyan-300 border-b-2 border-cyan-400"
                            : "text-gray-500 hover:text-gray-400"
                          } transition`}
                      >
                        Permissions
                      </button>
                    </div>

                    {statusSubTab === "leaves" && (
                      <>
                        {leaveHistory.length === 0 ? (
                          <p className="text-gray-500 italic text-center py-12">
                            No leave requests submitted yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {leaveHistory.map((l) => (
                              <div
                                key={l.id}
                                className="bg-gray-900/20 p-4 rounded-lg border border-cyan-900/50 flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium capitalize">
                                    {l.leave_type} Leave
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(l.start_date).toLocaleDateString()} →{" "}
                                    {new Date(l.end_date).toLocaleDateString()}
                                  </p>
                                  {l.reason && (
                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                                      {l.reason}
                                    </p>
                                  )}
                                </div>
                                {getStatusBadge(l.status)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {statusSubTab === "permissions" && (
                      <>
                        {permissionHistory.length === 0 ? (
                          <p className="text-gray-500 italic text-center py-12">
                            No permission requests submitted yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {permissionHistory.map((p) => (
                              <div
                                key={p.id}
                                className="bg-gray-900/20 p-4 rounded-lg border border-cyan-900/50 flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium">
                                    {new Date(p.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {p.time_from} - {p.time_to}
                                  </p>
                                  {p.reason && (
                                    <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                                      {p.reason}
                                    </p>
                                  )}
                                </div>
                                {getStatusBadge(p.status)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Reimbursement Tab */}
                {activeTab === "reimbursement" && (
                  <div>
                    <div className="flex border-b border-cyan-800 mb-6 text-sm">
                      <button
                        onClick={() => setReimbursementTab("pending")}
                        className={`px-6 py-3 ${reimbursementTab === "pending"
                            ? "text-cyan-300 border-b-2 border-cyan-400"
                            : "text-gray-500 hover:text-gray-400"
                          } transition`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setReimbursementTab("completed")}
                        className={`px-6 py-3 ${reimbursementTab === "completed"
                            ? "text-cyan-300 border-b-2 border-cyan-400"
                            : "text-gray-500 hover:text-gray-400"
                          } transition`}
                      >
                        Completed
                      </button>
                    </div>

                    {reimbursementsLoading ? (
                      <p className="text-center py-8 text-gray-500">Loading...</p>
                    ) : filteredReimbursements.length === 0 ? (
                      <p className="text-gray-500 italic text-center py-12">
                        {reimbursementTab === "pending"
                          ? "No pending reimbursement requests."
                          : "No completed reimbursement requests."}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {filteredReimbursements.map((r) => (
                          <div
                            key={r.id}
                            className="bg-gray-900/20 p-4 rounded-lg border border-cyan-900/50 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">
                                ₹{r.amount} - {r.reason}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(r.date).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(r.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Calendar */}
            <div>
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl p-6">
                <h3 className="text-blue-300 font-bold mb-4">Calendar</h3>
                <div className="text-center">
                  <p className="text-xl font-bold text-cyan-300">{monthName}</p>
                  <div className="grid grid-cols-7 gap-2 mt-6 text-sm">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                      <div key={day} className="text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                    {Array(firstDayOfMonth)
                      .fill(null)
                      .map((_, i) => (
                        <div key={`empty-${i}`} className="py-3" />
                      ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => (
                        <div
                          key={day}
                          className={`py-3 rounded-lg ${day === 26
                              ? "bg-cyan-600 text-gray-900 font-bold"
                              : "hover:bg-gray-800/40"
                            } transition`}
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center cursor-text shadow-2xl"
        onClick={handleCommandBarClick}
      >
        <span className="text-green-400 font-bold mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type 'help' for commands..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono z-50">
          {alertMessage}
        </div>
      )}
      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b border-cyan-900 pb-4">
              <h2 className="text-2xl font-bold text-cyan-300">
                Apply for Leave
              </h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-gray-400 hover:text-cyan-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitLeave} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Leave Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 focus:border-cyan-500"
                  value={leave.type}
                  onChange={(e) => setLeave({ ...leave, type: e.target.value })}
                  required
                >
                  <option value="" className="bg-gray-900">
                    Select Leave Type
                  </option>
                  <option value="sick" className="bg-gray-900">
                    Sick Leave
                  </option>
                  <option value="casual" className="bg-gray-900">
                    Casual Leave
                  </option>
                  <option value="earned" className="bg-gray-900">
                    Earned Leave
                  </option>
                  <option value="wfh" className="bg-gray-900">
                    Work From Home
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={leave.from}
                  onChange={(e) => setLeave({ ...leave, from: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={leave.to}
                  onChange={(e) => setLeave({ ...leave, to: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reporting Manager
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={leave.manager_id}
                  onChange={(e) =>
                    setLeave({ ...leave, manager_id: e.target.value })
                  }
                  required
                >
                  <option value="" className="bg-gray-900">
                    Select Manager
                  </option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id} className="bg-gray-900">
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reason
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 h-32 resize-none"
                  placeholder="Describe your reason for leave"
                  value={leave.reason}
                  onChange={(e) =>
                    setLeave({ ...leave, reason: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-gray-900 font-bold rounded-lg transition"
                >
                  Submit Leave
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b border-cyan-900 pb-4">
              <h2 className="text-2xl font-bold text-cyan-300">
                Request Permission
              </h2>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-400 hover:text-cyan-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitPermission} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={permission.date}
                  onChange={(e) =>
                    setPermission({ ...permission, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  From Time
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={permission.from}
                  onChange={(e) =>
                    setPermission({ ...permission, from: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  To Time
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={permission.to}
                  onChange={(e) =>
                    setPermission({ ...permission, to: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reporting Manager
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={permission.manager_id}
                  onChange={(e) =>
                    setPermission({ ...permission, manager_id: e.target.value })
                  }
                  required
                >
                  <option value="" className="bg-gray-900">
                    Select Manager
                  </option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id} className="bg-gray-900">
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reason
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 h-32 resize-none"
                  placeholder="Describe your reason for permission"
                  value={permission.reason}
                  onChange={(e) =>
                    setPermission({ ...permission, reason: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-gray-900 font-bold rounded-lg transition"
                >
                  Submit Permission
                </button>
                <button
                  type="button"
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reimbursement Modal */}
      {showReimbursementModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b border-cyan-900 pb-4">
              <h2 className="text-2xl font-bold text-cyan-300">
                Submit Reimbursement Request
              </h2>
              <button
                onClick={() => setShowReimbursementModal(false)}
                className="text-gray-400 hover:text-cyan-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitReimbursement} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 placeholder-gray-500"
                  value={reimbursement.amount}
                  onChange={(e) =>
                    setReimbursement({
                      ...reimbursement,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Date of Expense
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300"
                  value={reimbursement.date}
                  onChange={(e) =>
                    setReimbursement({ ...reimbursement, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reporting Manager
                </label>
               <select
  value={reimbursement.manager_id}
  disabled
  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 opacity-70"
>
  {managers.map((m) => (
    <option key={m.id} value={m.id}>
      {m.full_name} {m.is_direct_manager && "(Direct Manager)"}
    </option>
  ))}
</select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reason / Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-cyan-900 rounded-lg text-cyan-300 h-32 resize-none placeholder-gray-500"
                  placeholder="Explain the expense"
                  value={reimbursement.reason}
                  onChange={(e) =>
                    setReimbursement({
                      ...reimbursement,
                      reason: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold rounded-lg transition"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowReimbursementModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Training Videos Modal */}
      {showVideosModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-cyan-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-cyan-900 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cyan-300">
                Training Videos
              </h2>
              <button
                onClick={() => setShowVideosModal(false)}
                className="text-gray-400 hover:text-cyan-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="p-8">
              {videosLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500"></div>
                  <p className="mt-4 text-gray-400">Loading videos...</p>
                </div>
              ) : trainingVideos.length === 0 ? (
                <p className="text-center text-gray-500 py-12 italic">
                  No training videos available yet.
                </p>
              ) : (
                <>
                  <div className="mb-8">
                    <p className="text-sm text-gray-400">
                      Progress: {watchedVideos.size} / {trainingVideos.length}{" "}
                      completed
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-3 mt-2">
                      <div
                        className="bg-cyan-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${(watchedVideos.size / trainingVideos.length) * 100
                            }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    {trainingVideos.map((video, index) => {
                      const unlocked = isVideoUnlocked(index);
                      const watched = watchedVideos.has(video.id);
                      return (
                        <div
                          key={video.id}
                          className={`bg-gray-800/50 rounded-lg overflow-hidden shadow hover:shadow-cyan-800/50 transition ${!unlocked ? "opacity-60" : ""
                            }`}
                        >
                          <div className="aspect-video bg-black relative">
                            {video.video ? (
                              <video
                                controls={unlocked}
                                controlsList="nodownload"
                                className="w-full h-full object-cover"
                                poster={video.thumbnail || undefined}
                                onEnded={() => handleVideoEnded(video.id)}
                              >
                                <source
                                  src={`${BACKEND_URL}${video.video}`}
                                  type="video/mp4"
                                />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                <PlayCircle className="w-16 h-16 text-gray-500" />
                              </div>
                            )}

                            {!unlocked && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <div className="text-cyan-300 text-center">
                                  <svg
                                    className="w-16 h-16 mx-auto mb-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <p className="text-lg font-semibold">
                                    Locked
                                  </p>
                                  <p className="text-sm mt-1">
                                    Complete previous video first
                                  </p>
                                </div>
                              </div>
                            )}

                            {watched && (
                              <div className="absolute top-4 right-4 bg-green-600 text-gray-900 rounded-full p-2">
                                <CheckCircle className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
                                  <span className="text-sm font-bold text-cyan-500">
                                    #{index + 1}
                                  </span>
                                  {video.title || "Untitled Video"}
                                </h4>
                                {video.description && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    {video.description}
                                  </p>
                                )}
                              </div>
                              {watched && (
                                <span className="text-sm text-green-400 font-medium">
                                  Completed
                                </span>
                              )}
                              {!unlocked && !watched && (
                                <span className="text-sm text-gray-500">
                                  Locked
                                </span>
                              )}
                            </div>
                            {video.created_at && (
                              <p className="text-xs text-gray-500 mt-2">
                                Uploaded on{" "}
                                {new Date(
                                  video.created_at
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {trainingCompleted ? (
                    <div className="mt-12 text-center text-green-400 font-bold text-xl flex items-center justify-center gap-3">
                      <CheckCircle className="w-10 h-10" />
                      Training Completed
                    </div>
                  ) : (
                    allCompleted && (
                      <div className="mt-12 text-center">
                        <button
                          onClick={markTrainingCompleted}
                          className="px-10 py-5 bg-green-600 hover:bg-green-500 text-gray-900 font-bold text-xl rounded-lg transition"
                        >
                          Mark Training as Completed
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
