import { useState } from "react";
import api from "../../../../../src/services/api";
import { fetchTrainingCompletions } from "../../../modules/hr/api/hrApi";

export default function UploadTrainingVideoModal({
  isOpen,
  onClose,
  videos,
  onDeleteVideo,
  onVideoUploadSuccess,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isUploadSectionVisible, setIsUploadSectionVisible] = useState(false);

  const [showCompletion, setShowCompletion] = useState(false);
  const [completedUsers, setCompletedUsers] = useState([]);

  const [showProgress, setShowProgress] = useState(false);
  const [progressUsers, setProgressUsers] = useState([]);

  if (!isOpen) return null;

  /* =========================
      API CALLS
  ========================== */

  const fetchTrainingProgress = async () => {
    try {
      const res = await api.get("/organizations/training-progress");
      setProgressUsers(res.data);
      setShowProgress(true);
    } catch (err) {
      console.error("Failed to fetch progress", err);
      alert("Failed to load training progress");
    }
  };

  const handleFetchCompletions = async () => {
    try {
      const res = await fetchTrainingCompletions();
      setCompletedUsers(res.data);
      setShowCompletion(true);
    } catch (err) {
      console.error("Failed to fetch completions", err);
      alert("Error fetching completion status");
    }
  };

  const handleUpload = async () => {
    if (!title || !videoFile) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("video", videoFile);

    try {
      setLoading(true);
      await api.post("organizations/training-videos/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setDescription("");
      setCategory("general");
      setVideoFile(null);

      onVideoUploadSuccess?.();
      setIsUploadSectionVisible(false);
      alert("Successfully Uploaded!");
    } catch (err) {
      console.error("Video Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      UI HELPERS
  ========================== */

  const renderVideoItem = (video) => (
    <li
      key={video.id}
      className="py-4 px-4 flex justify-between items-center border-b border-zinc-100 hover:bg-zinc-50 transition"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 truncate">
          {video.title}
        </p>
        <p className="text-xs text-zinc-500">
          {video.category} • {video.description.substring(0, 60)}...
        </p>
      </div>
      <button
        onClick={() => onDeleteVideo(video.id)}
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded-xl font-medium transition"
      >
        Delete
      </button>
    </li>
  );

  /* =========================
      RENDER
  ========================== */

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 w-full max-w-3xl max-h-[88vh] overflow-y-auto shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
          <h2 className="text-2xl font-bold text-zinc-900">
            Training Video Manager
          </h2>

          <div className="flex gap-3">
            <button
              onClick={() => setIsUploadSectionVisible(!isUploadSectionVisible)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
            >
              {isUploadSectionVisible ? "Hide Upload" : "Upload Video"}
            </button>

            <button
              onClick={handleFetchCompletions}
              className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition"
            >
              Completion Status
            </button>

            <button
              onClick={fetchTrainingProgress}
              className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition"
            >
              View Progress
            </button>
          </div>
        </div>

        {/* UPLOAD FORM */}
        {isUploadSectionVisible && (
          <div className="mb-8 p-6 border border-zinc-200 rounded-2xl bg-zinc-50 space-y-4">
            <input
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
            >
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="onboarding">Onboarding</option>
              <option value="technical">Technical</option>
            </select>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-2.5 rounded-2xl font-semibold transition"
              >
                {loading ? "Uploading..." : "Upload Video"}
              </button>
            </div>
          </div>
        )}

        {/* VIDEO LIST */}
        <h3 className="text-xl font-semibold text-zinc-900 mb-4">
          Uploaded Videos ({videos?.length || 0})
        </h3>

        {videos?.length ? (
          <ul className="divide-y divide-zinc-100 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            {videos.map(renderVideoItem)}
          </ul>
        ) : (
          <p className="text-zinc-500 text-center py-12 bg-white border border-zinc-200 rounded-2xl">
            No videos uploaded yet
          </p>
        )}

        {/* COMPLETION LIST */}
        {showCompletion && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-zinc-900 mb-4">
              Completed Employees ({completedUsers.length})
            </h3>
            <ul className="divide-y divide-zinc-100 bg-white border border-zinc-200 rounded-2xl p-4">
              {completedUsers.map((c, idx) => (
                <li key={idx} className="flex justify-between py-3 text-zinc-700">
                  <span className="font-medium">{c.employee_name}</span>
                  <span className="text-zinc-500">{c.employee_email}</span>
                  <span className="text-emerald-600 text-sm">
                    {new Date(c.completed_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PROGRESS LIST */}
        {showProgress && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-zinc-900 mb-4">
              Training Progress
            </h3>

            <div className="space-y-4">
              {progressUsers.map((u) => (
                <div
                  key={u.employee_id}
                  className="bg-white border border-zinc-200 p-5 rounded-2xl"
                >
                  <div className="flex justify-between text-zinc-700 mb-3">
                    <span className="font-medium">{u.employee_name}</span>
                    <span className="text-zinc-500">{u.employee_email}</span>
                    <span className="font-semibold text-emerald-600">{u.percentage}%</span>
                  </div>

                  <div className="w-full bg-zinc-100 rounded-full h-2.5">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${u.percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-500 mt-2">
                    {u.completed} / {u.total} videos completed
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end mt-8 pt-6 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-6 py-2.5 rounded-2xl font-medium transition"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}