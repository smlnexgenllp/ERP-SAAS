import { useState, useEffect } from "react";
import api from "../../../../../src/services/api"; // Assuming correct path

// Props now need to include video data and management functions
export default function UploadTrainingVideoModal({
  isOpen,
  onClose,
  videos, // Array of videos passed from parent
  onDeleteVideo, // Function to delete a video (calls API in parent or service)
  onVideoUploadSuccess, // Function to refresh video list in parent
}) {
  // --- Upload Form State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [videoFile, setVideoFile] = useState(null); // Renamed state to avoid conflict
  const [loading, setLoading] = useState(false);
  const [isUploadSectionVisible, setIsUploadSectionVisible] = useState(false); // To show/hide upload form

  const handleUpload = async () => {
    if (!title || !videoFile) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("video", videoFile);

    try {
      setLoading(true);
      // NOTE: Ensure your API endpoint is correct based on your setup
      await api.post("organizations/training-videos/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset form and notify parent to refresh the list
      setTitle("");
      setDescription("");
      setCategory("general");
      setVideoFile(null);

      onVideoUploadSuccess?.(); // Success handler from parent (e.g., refresh list)
      setIsUploadSectionVisible(false); // Hide form after successful upload
      alert("Successfully Uploaded!!");
    } catch (err) {
      console.error("Video Upload failed", err);
      // Optional: Add user-friendly error state/message here
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Function to render the video list item
  const renderVideoItem = (video) => (
    <li
      key={video.id}
      className="py-3 px-2 flex justify-between items-center border-b border-gray-800 hover:bg-gray-800/50 transition"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-pink-400 truncate">
          {video.title}
        </p>
        <p className="text-xs text-cyan-500">{video.category} • {video.description.substring(0, 40)}...</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={() => onDeleteVideo(video.id)}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition"
        >
          Delete
        </button>
      </div>
    </li>
  );

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        
        {/* Header and Toggle */}
        <div className="flex justify-between items-center mb-6 border-b border-cyan-800 pb-3">
          <h2 className="text-2xl font-bold text-pink-400">
            Training Video Manager
          </h2>
          <button
            onClick={() => setIsUploadSectionVisible(!isUploadSectionVisible)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              isUploadSectionVisible
                ? "bg-gray-700 text-cyan-300"
                : "bg-cyan-500 text-gray-900 hover:bg-cyan-600"
            }`}
          >
            {isUploadSectionVisible ? "— Hide Upload Form" : "+ Upload New Video"}
          </button>
        </div>

        {/* --- Upload Form (Conditionally Rendered) --- */}
        {isUploadSectionVisible && (
          <div className="mb-6 p-4 border border-cyan-900 rounded-lg bg-gray-950/50 space-y-3">
            <h3 className="text-lg font-semibold text-cyan-300">New Video Details</h3>
            
            <input
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded focus:ring-2 focus:ring-pink-500"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded focus:ring-2 focus:ring-pink-500"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-gray-800 text-cyan-300 rounded appearance-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="onboarding">Onboarding</option>
              <option value="hr">HR</option>
              <option value="safety">Safety</option>
              <option value="technical">Technical</option>
              <option value="general">General</option>
            </select>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="text-cyan-300 w-full block py-2"
            />

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={loading || !title || !videoFile}
                className={`text-gray-900 px-4 py-2 rounded font-semibold transition ${
                  loading || !title || !videoFile
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                {loading ? "Uploading..." : "Submit Video"}
              </button>
            </div>
          </div>
        )}
        
        {/* --- Video List Section --- */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-3">
            Uploaded Training Videos ({videos?.length || 0})
          </h3>
          
          {videos && videos.length > 0 ? (
            <ul className="divide-y divide-gray-800 bg-gray-950 rounded-lg border border-cyan-900">
              {videos.map(renderVideoItem)}
            </ul>
          ) : (
            <div className="text-center py-10 bg-gray-950 rounded-lg border border-cyan-900 text-cyan-600">
              No videos found. Start by uploading one!
            </div>
          )}
        </div>


        {/* Footer/Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-cyan-800">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 px-4 py-2 rounded transition">
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}