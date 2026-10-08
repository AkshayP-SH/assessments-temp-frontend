import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  X,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch } from '../../config/api';

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    company_name: '',
    profile_image: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch admin profile details
  const fetchProfileData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
      if (!token) return;

      const response = await apiFetch('api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admin) {
          setProfile(data.admin);
          setFormData({
            full_name: data.admin.full_name || '',
            phone: data.admin.phone || '',
            address: data.admin.address || '',
            company_name: data.admin.company_name || '',
            profile_image: data.admin.profile_image || ''
          });
        }
      } else {
        toast.error('Failed to load profile');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Could not load profile details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Copy text to clipboard
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle password form input change
  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Compress and handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
          const response = await apiFetch('api/admin/photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ photo: compressedDataUrl })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            setProfile(prev => ({ ...prev, profile_image: compressedDataUrl }));
            setFormData(prev => ({ ...prev, profile_image: compressedDataUrl }));
            toast.success('Profile photo updated successfully!');
          } else {
            toast.error(data.message || 'Failed to update photo');
          }
          setUploadingPhoto(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload photo');
      setUploadingPhoto(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
      const response = await apiFetch('api/admin/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ photo: null })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(prev => ({ ...prev, profile_image: null }));
        setFormData(prev => ({ ...prev, profile_image: '' }));
        toast.success('Profile photo removed');
      } else {
        toast.error(data.message || 'Failed to remove photo');
      }
    } catch (err) {
      console.error('Remove photo error:', err);
      toast.error('Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
      const response = await apiFetch('api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Profile updated successfully!');
        setProfile(prev => ({ ...prev, ...data.admin }));
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit password change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
      const response = await apiFetch('api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Failed to change password. Check your current password.');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Initials helper
  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isPasswordFilled = Boolean(
    passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] w-full bg-white dark:bg-[#1A1A32] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#403f75] dark:border-indigo-500 border-t-transparent mb-3"></div>
        <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
          Loading profile...
        </p>
      </div>
    );
  }

  const isSuper = profile?.role === 'super_admin';

  return (
    <>
      {/* Hidden Photo File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-theme-text tracking-tight">
              My Profile
            </h2>
            <p className="text-sm sm:text-base text-theme-muted mt-1 font-medium">
              View and manage your administrator details and account settings
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchProfileData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-theme-text bg-theme-card hover:bg-theme-panel border border-theme-border rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Refresh profile"
            >
              <RefreshCw size={15} className={`${refreshing ? 'animate-spin text-theme-accent' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-theme-accent hover:bg-theme-accent2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-theme-card rounded-2xl border border-theme-border shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-theme-border">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Circular Avatar with Camera Upload */}
              <div className="relative group flex-shrink-0">
                {profile?.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.full_name || 'Admin'}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md border-2 border-theme-accent/30"
                  />
                ) : (
                  <div className="admin-profile-avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0">
                    {getInitials(profile?.full_name)}
                  </div>
                )}

                {/* Upload Camera Button Badge */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-1.5 bg-theme-accent hover:bg-theme-accent2 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Upload / Change Photo"
                >
                  <Camera size={13} />
                </button>

                {/* Delete Photo Button Badge */}
                {profile?.profile_image && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Remove Photo"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-theme-text">
                  {profile?.full_name || 'Administrator'}
                </h3>
                <p className="text-sm text-theme-muted font-medium mt-0.5">
                  {profile?.email}
                </p>
                <p className="text-xs text-theme-muted/80 font-medium mt-0.5">
                  {profile?.company_name || (isSuper ? 'Shnoor International' : 'Organization')}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
            {/* Full Name */}
            <div className="bg-theme-panel/70 p-4 rounded-xl border border-theme-border">
              <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
                <span className="flex items-center gap-1.5">
                  <User size={14} className="text-theme-accent" />
                  Full Name
                </span>
                <button
                  onClick={() => handleCopy(profile?.full_name, 'Full Name')}
                  className="text-theme-muted hover:text-theme-text cursor-pointer"
                >
                  {copiedField === 'Full Name' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-sm font-bold text-theme-text truncate">
                {profile?.full_name || '—'}
              </p>
            </div>

            {/* Email */}
            <div className="bg-theme-panel/70 p-4 rounded-xl border border-theme-border">
              <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-theme-accent" />
                  Email Address
                </span>
                <button
                  onClick={() => handleCopy(profile?.email, 'Email')}
                  className="text-theme-muted hover:text-theme-text cursor-pointer"
                >
                  {copiedField === 'Email' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-sm font-bold text-theme-text truncate">
                {profile?.email || '—'}
              </p>
            </div>

            {/* Organization */}
            <div className="bg-theme-panel/70 p-4 rounded-xl border border-theme-border">
              <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-theme-accent" />
                  Organization
                </span>
                <button
                  onClick={() => handleCopy(profile?.company_name, 'Organization')}
                  className="text-theme-muted hover:text-theme-text cursor-pointer"
                >
                  {copiedField === 'Organization' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-sm font-bold text-theme-text truncate">
                {profile?.company_name || (isSuper ? 'Shnoor International' : '—')}
              </p>
            </div>

            {/* Phone */}
            <div className="bg-theme-panel/70 p-4 rounded-xl border border-theme-border">
              <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-theme-accent" />
                  Mobile Number
                </span>
                {profile?.phone && (
                  <button
                    onClick={() => handleCopy(profile.phone, 'Mobile Number')}
                    className="text-theme-muted hover:text-theme-text cursor-pointer"
                  >
                    {copiedField === 'Mobile Number' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-theme-text">
                {profile?.phone || '—'}
              </p>
            </div>

            {/* Address */}
            <div className="bg-theme-panel/70 p-4 rounded-xl border border-theme-border">
              <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-theme-accent" />
                  Office Location
                </span>
                {profile?.address && (
                  <button
                    onClick={() => handleCopy(profile.address, 'Office Location')}
                    className="text-theme-muted hover:text-theme-text cursor-pointer"
                  >
                    {copiedField === 'Office Location' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-theme-text truncate">
                {profile?.address || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-theme-card rounded-2xl border border-theme-border shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-theme-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-theme-panel text-theme-accent border border-theme-border">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-text">
                  Change Password
                </h3>
                <p className="text-xs text-theme-muted font-medium">
                  Update your security password
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-theme-text mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-theme-text mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-theme-text mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!isPasswordFilled || isChangingPassword}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-theme-accent hover:bg-theme-accent2 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Lock size={14} />
                <span>{isChangingPassword ? 'Changing Password...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-theme-card rounded-2xl border border-theme-border shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-theme-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-theme-panel text-theme-accent border border-theme-border">
                  <Edit3 size={18} />
                </div>
                <h3 className="text-lg font-black text-theme-text">
                  Edit Profile
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-theme-muted hover:text-theme-text rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-theme-text mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text mb-1">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                  className="w-full px-3.5 py-2 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text mb-1">
                  Office / Address Location
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter location / address"
                  className="w-full px-3.5 py-2 text-sm bg-theme-panel/60 border border-theme-border rounded-xl text-theme-text placeholder:text-theme-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-theme-muted hover:text-theme-text rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-theme-accent hover:bg-theme-accent2 rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
