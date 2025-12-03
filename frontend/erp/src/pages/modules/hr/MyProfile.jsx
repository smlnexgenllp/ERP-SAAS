// src/pages/modules/hr/MyProfile.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
// Assuming you have access to icons (e.g., from 'lucide-react' or a similar library)
// If not available, Tailwind components will use text placeholders as a fallback.
import { Mail, Phone, Building, Calendar, Cake, DollarSign, Lock, FileText, Upload } from 'lucide-react';

// --- Icon Mapping for Detail Cards (Optional: Replace if using a different icon library) ---
const IconMap = {
  Email: Mail,
  Phone: Phone,
  Building: Building,
  Calendar: Calendar,
  'Birthday Cake': Cake,
  Money: DollarSign,
};

export default function MyProfile() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchMyProfile();
    fetchMyDocuments();
  }, []);

  // Keep all your existing functions unchanged
  const fetchMyProfile = async () => {
    try {
      const res = await api.get('/hr/employees/me/');
      setEmployee(res.data);
    } catch (err) {
      setError('Failed to load profile. Please log in again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      const res = await api.get('/hr/employee-documents/');
      setDocuments(res.data.results || res.data);
    } catch (err) {
      console.log('No documents yet or error loading');
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUploadDocument = async () => {
    if (!selectedFile) return alert('Please select a file');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);

    try {
      await api.post('/hr/employee-documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Document uploaded successfully!');
      setSelectedFile(null);
      fetchMyDocuments();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      return alert("New passwords don't match!");
    }
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      alert('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Password change failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-cyan-400 text-4xl font-mono animate-pulse tracking-widest">LOADING PROFILE...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-10">
      <div className="bg-red-900/40 border-2 border-red-500 rounded-xl p-12 text-white text-2xl font-bold text-center shadow-red-500/50 shadow-2xl">
        {error}
      </div>
    </div>
  );

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '—';

  return (
    // Updated background to deep dark theme
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Hero Header - Cyber Grid Style */}
        <div className="text-center animate-fadeIn">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl p-10 shadow-3xl shadow-cyan-500/30 border border-cyan-700/50 transform transition-all duration-500 hover:shadow-cyan-400/50 hover:border-cyan-500/80">
            
            {/* Profile Picture */}
            {employee.photo ? (
              <img src={employee.photo} alt="Profile" className="w-40 h-40 rounded-full object-cover border-4 border-cyan-500 shadow-2xl shadow-cyan-500/50 mx-auto" />
            ) : (
              <div className="w-40 h-40 rounded-full bg-cyan-900/70 border-4 border-cyan-500 flex items-center justify-center text-cyan-400 text-7xl font-mono font-bold shadow-2xl shadow-cyan-500/50 mx-auto">
                {employee.full_name.charAt(0)}
              </div>
            )}
            
            <h1 className="text-6xl font-extrabold text-cyan-400 mt-6 tracking-wider drop-shadow-lg shadow-cyan-400/50">
              {employee.full_name}
            </h1>
            <p className="text-xl text-gray-400 mt-2 font-mono">
              <span className="text-pink-500 font-bold">ACCESS ID:</span> {employee.employee_code || 'N/A'}
            </p>
            
            {/* Role & Designation Badges - Neon Glow */}
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              {/* <span className="px-6 py-3 bg-pink-700/50 border border-pink-500 text-white font-bold rounded-full shadow-lg shadow-pink-500/30">
                {employee.role_display || employee.role}
              </span> */}
              <span className="px-6 py-3 bg-cyan-700/50 border border-cyan-500 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30">
                {employee.designation?.title || 'Employee'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Card - High Contrast Grid */}
        <div className="bg-gray-800/80 rounded-3xl shadow-3xl shadow-indigo-500/30 border border-indigo-700/50 p-10 transform transition-all duration-500 hover:shadow-indigo-400/50">
          
          <h2 className="text-4xl font-bold text-indigo-400 mb-8 flex items-center gap-4 border-b-2 border-indigo-500/50 pb-3">
            <Lock className="w-7 h-7" />
            Core Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { key: "Email", label: "Email", value: employee.email },
              { key: "Phone", label: "Phone", value: employee.phone || '—' },
              { key: "Building", label: "Department", value: employee.department?.name || '—' },
              { key: "Calendar", label: "Joined Date", value: formatDate(employee.date_of_joining) },
              { key: "Birthday Cake", label: "Date of Birth", value: formatDate(employee.date_of_birth) },
              { key: "Money", label: "Current CTC", value: employee.ctc ? `₹${Number(employee.ctc).toLocaleString('en-IN')}` : '—' },
            ].map((item, i) => {
              const IconComponent = IconMap[item.key] || FileText;
              return (
                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 shadow-xl shadow-gray-900/70 hover:border-indigo-500 transition-all duration-300 group">
                  <div className="text-4xl mb-3 text-indigo-400 group-hover:text-cyan-400 transition-colors">
                    <IconComponent className="w-8 h-8"/>
                  </div>
                  <p className="text-gray-400 text-sm font-mono">{item.label}</p>
                  <p className="text-xl font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors tracking-wide">{item.value}</p>
                </div>
              );
            })}
          </div>

          {/* Change Password */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              // Neon-style button with hover effect
              className="relative px-12 py-5 bg-transparent border-2 border-pink-500 text-pink-400 font-bold text-lg rounded-full shadow-lg shadow-pink-500/30 hover:bg-pink-500/20 transform hover:scale-105 transition-all duration-300 overflow-hidden group"
            >
              <span className="relative z-10">{isChangingPassword ? 'Cancel Update' : 'Change Security Credential (Recommended)'}</span>
            </button>

            {isChangingPassword && (
              <div className="mt-8 bg-gray-900/80 rounded-3xl p-8 border border-pink-700/50 shadow-2xl shadow-pink-500/30 animate-slideDown max-w-lg mx-auto">
                <h3 className="text-2xl font-bold text-pink-400 mb-6 text-center">ACCESS CREDENTIAL UPDATE</h3>
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <input type="password" placeholder="Current Password" required className="w-full p-5 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:border-pink-500" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} />
                  <input type="password" placeholder="New Password" required className="w-full p-5 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:border-pink-500" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} />
                  <input type="password" placeholder="Confirm New Password" required className="w-full p-5 rounded-xl bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:border-pink-500" value={passwordData.confirm_password} onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} />
                  <button type="submit" className="w-full py-5 bg-cyan-600 text-white font-bold text-xl rounded-xl shadow-lg shadow-cyan-500/50 hover:bg-cyan-500 transform hover:scale-[1.02] transition-all duration-300">
                    Execute Password Change
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section - Data Management Theme */}
        <div className="bg-gray-800/80 rounded-3xl shadow-3xl shadow-green-500/30 border border-green-700/50 p-10">
          
          <h2 className="text-4xl font-bold text-green-400 mb-8 flex items-center gap-4 border-b-2 border-green-500/50 pb-3">
            <FileText className="w-7 h-7" />
            Managed Documents
          </h2>

          {/* Upload Control */}
          <div className="bg-gray-900/70 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <input
                type="file"
                onChange={handleFileChange}
                // Custom file input styling for dark theme
                className="flex-1 p-4 bg-gray-800 rounded-lg text-white file:mr-6 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:font-bold file:hover:bg-green-500 transition-colors"
              />
              <button
                onClick={handleUploadDocument}
                disabled={!selectedFile}
                className={`px-10 py-4 rounded-lg font-bold text-white shadow-xl transition-all duration-300 flex items-center gap-2 ${selectedFile ? 'bg-green-600 hover:bg-green-500 transform hover:scale-105 shadow-green-500/40' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
              >
                <Upload className="w-5 h-5"/>
                Upload File
              </button>
            </div>
          </div>

          {/* Document List */}
          {documents.length === 0 ? (
            <div className="text-center py-20 text-gray-500 border-dashed border-2 border-gray-700 rounded-xl">
              <div className="text-8xl mb-4">📄</div>
              <p className="text-xl font-mono">No files detected in the system.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-700/50 rounded-xl p-5 border border-gray-700 hover:bg-gray-700 transition-all duration-300 flex justify-between items-center group">
                  <div>
                    <p className="text-xl font-bold text-white group-hover:text-green-300">{doc.title}</p>
                    <p className="text-gray-400 text-sm">Upload Timestamp: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <a href={doc.file} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transform hover:scale-105 transition-all duration-300">
                    VIEW DATA
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simple CSS Animations (Kept from original) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
        .shadow-3xl {
            box-shadow: 0 0px 40px rgba(0, 0, 0, 0.5); /* Custom large shadow */
        }
      `}</style>
    </div>
  );
}