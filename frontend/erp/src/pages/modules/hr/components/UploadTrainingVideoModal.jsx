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
      className="py-3 px-2 flex justify-between items-center border-b border-gray-800 hover:bg-gray-800/50 transition"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-pink-400 truncate">
          {video.title}
        </p>
        <p className="text-xs text-cyan-500">
          {video.category} • {video.description.substring(0, 40)}...
        </p>
      </div>
      <button
        onClick={() => onDeleteVideo(video.id)}
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
      >
        Delete
      </button>
    </li>
  );

  /* =========================
      RENDER
  ========================== */

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b border-cyan-800 pb-3">
          <h2 className="text-2xl font-bold text-pink-400">
            Training Video Manager
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setIsUploadSectionVisible(!isUploadSectionVisible)
              }
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-medium"
            >
              {isUploadSectionVisible ? "Hide Upload" : "Upload Video"}
            </button>

            <button
              onClick={handleFetchCompletions}
              className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-gray-900 font-medium"
            >
              Completion Status
            </button>

            <button
              onClick={fetchTrainingProgress}
              className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-medium"
            >
              View Progress
            </button>
          </div>
        </div>

        {/* UPLOAD FORM */}
        {isUploadSectionVisible && (
          <div className="mb-6 p-4 border border-cyan-900 rounded-lg bg-gray-950 space-y-3">
            <input
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded"
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
              className="text-cyan-300"
            />

            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-pink-500 hover:bg-pink-600 text-gray-900 px-4 py-2 rounded font-semibold"
              >
                {loading ? "Uploading..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* VIDEO LIST */}
        <h3 className="text-xl font-bold text-cyan-400 mb-3">
          Uploaded Videos ({videos?.length || 0})
        </h3>

        {videos?.length ? (
          <ul className="divide-y divide-gray-800 bg-gray-950 rounded-lg border border-cyan-900">
            {videos.map(renderVideoItem)}
          </ul>
        ) : (
          <p className="text-cyan-600 text-center py-6">No videos uploaded</p>
        )}

        {/* COMPLETION LIST */}
        {showCompletion && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-pink-400 mb-3">
              Completed Employees ({completedUsers.length})
            </h3>
            <ul className="divide-y divide-gray-800 bg-gray-950 rounded-lg border border-pink-500 p-3">
              { completedUsers.map((c, idx) => (
                <li key={idx} className="flex justify-between text-cyan-300 py-2">
                  <span>{c.employee_name}</span>
                  <span>{c.employee_email}</span>
                  <span className="text-pink-400">
                    {new Date(c.completed_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PROGRESS LIST */}
        {showProgress && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-3">
              Training Progress
            </h3>

            <ul className="space-y-3">
              {progressUsers.map((u) => (
                <li
                  key={u.employee_id}
                  className="bg-gray-950 border border-cyan-700 p-3 rounded"
                >
                  <div className="flex justify-between text-cyan-300 mb-1">
                    <span>{u.employee_name}</span>
                    <span>{u.employee_email}</span>
                    <span>{u.percentage}%</span>
                  </div>

                  <div className="w-full bg-gray-800 rounded h-2">
                    <div
                      className="bg-pink-500 h-2 rounded"
                      style={{ width: `${u.percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    {u.completed} / {u.total} videos completed
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end mt-6 border-t border-cyan-800 pt-4">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-cyan-300 px-4 py-2 rounded"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}
