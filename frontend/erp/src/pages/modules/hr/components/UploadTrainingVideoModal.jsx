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

  const [isUploadSectionVisible, setIsUploadSectionVisible] =
    useState(false);

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

      await api.post(
        "organizations/training-videos/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

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
      className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 hover:bg-zinc-50 transition"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 truncate">
          {video.title}
        </p>

        <p className="text-xs text-zinc-500 mt-1">
          {video.category} •{" "}
          {video.description?.substring(0, 50)}...
        </p>
      </div>

      <button
        onClick={() => onDeleteVideo(video.id)}
        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-xl font-medium transition"
      >
        Delete
      </button>
    </li>
  );

  /* =========================
      RENDER
  ========================== */

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5 border-b border-zinc-200">
          
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              Training Video Manager
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Upload and manage employee training videos
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                setIsUploadSectionVisible(
                  !isUploadSectionVisible
                )
              }
              className="bg-zinc-900 hover:bg-black text-white px-4 py-2.5 rounded-2xl font-medium transition"
            >
              {isUploadSectionVisible
                ? "Hide Upload"
                : "Upload Video"}
            </button>

            <button
              onClick={handleFetchCompletions}
              className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 px-4 py-2.5 rounded-2xl font-medium transition"
            >
              Completion Status
            </button>

            <button
              onClick={fetchTrainingProgress}
              className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 px-4 py-2.5 rounded-2xl font-medium transition"
            >
              View Progress
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* UPLOAD FORM */}
          {isUploadSectionVisible && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Video Title
                </label>

                <input
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-300"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Description
                </label>

                <textarea
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-300 min-h-[120px]"
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-300"
                >
                  <option value="general">General</option>
                  <option value="hr">HR</option>
                  <option value="onboarding">
                    Onboarding
                  </option>
                  <option value="technical">
                    Technical
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Upload Video
                </label>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setVideoFile(e.target.files[0])
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-700"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-zinc-900 hover:bg-black disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold transition"
                >
                  {loading ? "Uploading..." : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* VIDEO LIST */}
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <h3 className="text-xl font-bold text-zinc-900">
                Uploaded Videos ({videos?.length || 0})
              </h3>
            </div>

            {videos?.length ? (
              <ul>
                {videos.map(renderVideoItem)}
              </ul>
            ) : (
              <div className="text-center py-10 text-zinc-500">
                No videos uploaded
              </div>
            )}
          </div>

          {/* COMPLETION LIST */}
          {showCompletion && (
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
              
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
                <h3 className="text-xl font-bold text-zinc-900">
                  Completed Employees (
                  {completedUsers.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700">
                        Employee
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700">
                        Email
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-700">
                        Completed At
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {completedUsers.map((c, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-zinc-200 hover:bg-zinc-50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-zinc-900">
                          {c.employee_name}
                        </td>

                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {c.employee_email}
                        </td>

                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {new Date(
                            c.completed_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROGRESS LIST */}
          {showProgress && (
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
              
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
                <h3 className="text-xl font-bold text-zinc-900">
                  Training Progress
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {progressUsers.map((u) => (
                  <div
                    key={u.employee_id}
                    className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                      
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {u.employee_name}
                        </p>

                        <p className="text-sm text-zinc-500">
                          {u.employee_email}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-lg font-bold text-zinc-900">
                          {u.percentage}%
                        </p>

                        <p className="text-xs text-zinc-500">
                          {u.completed} / {u.total} videos
                          completed
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-3 bg-zinc-900 rounded-full transition-all duration-500"
                        style={{
                          width: `${u.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end px-6 py-5 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 px-5 py-2.5 rounded-2xl font-medium transition"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}
