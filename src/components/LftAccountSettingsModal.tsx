import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User as UserIcon,
  Camera,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  ShieldCheck,
  Save,
  Key
} from 'lucide-react';

interface LftAccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LftAccountSettingsModal: React.FC<LftAccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    updateCurrentUserProfile,
    updateCurrentUserPassword,
    verifyCurrentUserPassword
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Form state
  const [name, setName] = useState(currentUser?.name || 'Wella S. Bongons');
  const [title, setTitle] = useState(currentUser?.title || 'Local Farmer Technician (LFT)');
  const [contactNumber, setContactNumber] = useState(currentUser?.contactNumber || '0917-234-5678');
  const [email, setEmail] = useState(currentUser?.email || `${currentUser?.username || 'lft'}@silago-agriculture.gov.ph`);
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Status feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoUrl(result);
        updateCurrentUserProfile({ photoUrl: result });
        showToast('success', 'Profile photo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Officer full name cannot be empty.');
      return;
    }

    updateCurrentUserProfile({
      name: name.trim(),
      title: title.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      photoUrl: photoUrl.trim()
    });

    showToast('success', 'Your LFT account profile has been updated!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Please enter your current account password.');
      return;
    }

    if (!verifyCurrentUserPassword(currentPassword)) {
      showToast('error', 'Current password is incorrect (Default is lft123).');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }

    updateCurrentUserPassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Account password changed successfully!');
  };

  const assignedText = currentUser?.barangay || currentUser?.assignedBarangays?.join(', ') || 'Assigned Municipal Barangays';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={photoFileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-[#0b1e36] text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-md">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{name.charAt(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border-2 border-[#0b1e36] transition cursor-pointer"
                title="Change Photo"
              >
                <Camera size={12} />
              </button>
            </div>

            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/30">
                  LFT ACCOUNT SETTINGS
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Certified Field Officer</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">{name}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Jurisdiction: {assignedText}</span>
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserIcon size={14} />
              <span>Officer Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock size={14} />
              <span>Account Password</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`px-4 py-2.5 mx-6 mt-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Officer Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Title / Position</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone size={13} className="text-blue-600" />
                    <span>Contact Number</span>
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    placeholder="0917-000-0000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Mail size={13} className="text-blue-600" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    placeholder="officer@silago-agriculture.gov.ph"
                  />
                </div>
              </div>

              {/* Photo Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Profile Photo (Upload or Web URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Assigned Barangays Card */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <MapPin size={13} className="text-blue-600" />
                  <span>Assigned Field Barangays</span>
                </div>
                <p className="text-xs text-blue-800 font-medium">
                  {assignedText}
                </p>
                <span className="text-[10.5px] text-blue-600/80 block">
                  Official territory designation configured by Central Administration.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Key size={13} className="text-amber-600" />
                  <span>LFT Account Credentials</span>
                </div>
                <p>
                  You are changing the login credentials for username: <strong className="font-mono text-amber-950">{currentUser?.username}</strong>.
                </p>
                <span className="text-[11px] text-amber-700 block">
                  Default factory password is <code className="font-mono font-bold">lft123</code>.
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Current Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showPasswords ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Lock size={13} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
