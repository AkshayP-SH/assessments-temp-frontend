import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  BookOpen,
  FileText,
  ExternalLink,
  Edit3,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  X,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Search,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch } from '../config/api';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [openInstitutes, setOpenInstitutes] = useState([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);
  const [isInstituteDropdownOpen, setIsInstituteDropdownOpen] = useState(false);
  const [instituteSearch, setInstituteSearch] = useState('');
  const instituteDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    institute: '',
    phone: '',
    address: '',
    course: '',
    specialization: '',
    resume_link: '',
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

  // Fetch open institutes from admin manage institutes
  const fetchOpenInstitutes = useCallback(async () => {
    try {
      setLoadingInstitutes(true);
      const token = localStorage.getItem('studentAuthToken');
      let response = await apiFetch('api/student/open-institutes', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        response = await apiFetch('api/institutes/public');
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.institutes)) {
          setOpenInstitutes(data.institutes);
        }
      }
    } catch (err) {
      console.error('Failed to load open institutes:', err);
      try {
        const fallbackRes = await apiFetch('api/institutes/public');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && Array.isArray(fallbackData.institutes)) {
            setOpenInstitutes(fallbackData.institutes);
          }
        }
      } catch (fErr) {
        console.error('Fallback error:', fErr);
      }
    } finally {
      setLoadingInstitutes(false);
    }
  }, []);

  // Fetch student profile details
  const fetchProfileData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('studentAuthToken');
      if (!token) return;

      const response = await apiFetch('api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.student || data.user || data.data;
        if (data.success && userData) {
          setProfile(userData);
          setFormData({
            full_name: userData.full_name || '',
            roll_number: userData.roll_number || '',
            institute: userData.display_institute || userData.institute || '',
            phone: userData.phone || '',
            address: userData.address || '',
            course: userData.course || '',
            specialization: userData.specialization || '',
            resume_link: userData.resume_link || '',
            profile_image: userData.profile_image || ''
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
    fetchOpenInstitutes();
  }, [fetchProfileData, fetchOpenInstitutes]);

  // Handle outside click to close institute dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (instituteDropdownRef.current && !instituteDropdownRef.current.contains(e.target)) {
        setIsInstituteDropdownOpen(false);
      }
    };
    if (isInstituteDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isInstituteDropdownOpen]);

  // Copy field value to clipboard
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle profile form input change
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
      // Compress and resize image using Canvas
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

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

          // Save photo to backend
          const token = localStorage.getItem('studentAuthToken');
          const response = await apiFetch('api/student/photo', {
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
            toast.error(data.message || 'Failed to update profile photo');
          }
          setUploadingPhoto(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading photo:', err);
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
      const token = localStorage.getItem('studentAuthToken');
      const response = await apiFetch('api/student/photo', {
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
      console.error('Error removing photo:', err);
      toast.error('Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save updated profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('studentAuthToken');
      const response = await apiFetch('api/student/profile', {
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
        setProfile(data.student);
        if (data.student.full_name) {
          localStorage.setItem('studentName', data.student.full_name);
        }
        if (data.student.roll_number) {
          localStorage.setItem('rollNumber', data.student.roll_number);
        }
        if (data.student.institute) {
          localStorage.setItem('studentInstitute', data.student.institute);
        }
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit modal and ensure fresh state
  const handleOpenEditModal = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        roll_number: profile.roll_number || '',
        institute: profile.display_institute || profile.institute || '',
        phone: profile.phone || '',
        address: profile.address || '',
        course: profile.course || '',
        specialization: profile.specialization || '',
        resume_link: profile.resume_link || '',
        profile_image: profile.profile_image || ''
      });
    }
    setIsInstituteDropdownOpen(false);
    setInstituteSearch('');
    fetchOpenInstitutes();
    setIsEditModalOpen(true);
  };

  // Filter open institutes based on search input
  const filteredOpenInstitutes = useMemo(() => {
    if (!instituteSearch.trim()) return openInstitutes;
    const term = instituteSearch.toLowerCase().trim();
    return openInstitutes.filter(inst =>
      (inst.display_name && inst.display_name.toLowerCase().includes(term)) ||
      (inst.name && inst.name.toLowerCase().includes(term))
    );
  }, [openInstitutes, instituteSearch]);

  // Check if an institute is currently selected
  const isInstSelected = (inst) => {
    if (!formData.institute) return false;
    const current = formData.institute.toLowerCase().trim();
    return (
      (inst.name && inst.name.toLowerCase().trim() === current) ||
      (inst.display_name && inst.display_name.toLowerCase().trim() === current)
    );
  };

  // Get display name for the currently selected institute
  const getSelectedInstituteDisplayName = () => {
    if (!formData.institute) return '';
    const match = openInstitutes.find(
      inst =>
        (inst.name && inst.name.toLowerCase().trim() === formData.institute.toLowerCase().trim()) ||
        (inst.display_name && inst.display_name.toLowerCase().trim() === formData.institute.toLowerCase().trim())
    );
    if (match) return match.display_name;
    return formatText(formData.institute);
  };

  // Change student password with manual current password verification
  const handleChangePassword = async (e) => {
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
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password with Firebase Authentication
      const { auth, signInWithEmailAndPassword } = await import('../config/firebase');
      const studentEmail = profile?.email;
      if (!studentEmail) {
        toast.error('Student account email not found');
        setIsChangingPassword(false);
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, studentEmail.trim(), passwordForm.currentPassword);
      } catch (authErr) {
        console.error('Current password verification failed:', authErr);
        toast.error('Current password is incorrect. Please try again.');
        setIsChangingPassword(false);
        return;
      }

      // Update password via backend API
      const token = localStorage.getItem('studentAuthToken');
      const response = await apiFetch('api/student/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Failed to change password');
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

  // Format text to Title Case
  const formatText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word === 'shnoor') return 'SHNOOR';
        if (word === 'international') return 'international';
        if (word === 'llc') return 'LLC';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Get user name initials
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isPasswordFormFilled = Boolean(
    passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] w-full bg-white dark:bg-[#1A1A32] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#403f75] dark:border-indigo-500 border-t-transparent mb-3"></div>
        <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
          Loading student profile...
        </p>
      </div>
    );
  }

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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Profile
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
              View and manage your student candidate details
            </p>
          </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchProfileData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E1E38] hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Refresh profile"
          >
            <RefreshCw size={15} className={`${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#403f75] dark:bg-indigo-600 hover:bg-[#343360] dark:hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-[#1A1A32] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar with Photo Upload (Circular) */}
            <div className="relative group flex-shrink-0">
              {profile?.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.full_name || 'Profile'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md border-2 border-indigo-100 dark:border-indigo-900/60"
                />
              ) : (
                <div className="student-profile-avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#403f75] to-[#6868AC] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md">
                  {getInitials(profile?.full_name)}
                </div>
              )}

              {/* Camera Upload Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-[#403f75] dark:bg-indigo-600 hover:bg-[#343360] dark:hover:bg-indigo-700 text-white shadow-md border-2 border-white dark:border-[#1A1A32] cursor-pointer transition-all hover:scale-110 disabled:opacity-60"
                title="Change profile photo"
              >
                {uploadingPhoto ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {profile?.full_name || 'Student Name'}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.display_institute || formatText(profile?.institute) || 'Institute not assigned'}
              </p>

              {profile?.profile_image && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 mt-1 cursor-pointer"
                >
                  <Trash2 size={11} /> Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile?.resume_link && (
              <a
                href={profile.resume_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#403f75] dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all"
              >
                <FileText size={14} />
                <span>View Resume</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {/* Email */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Mail size={14} /> Email Address
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {profile?.email || '—'}
              </span>
              <button
                onClick={() => handleCopy(profile?.email, 'Email')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Copy Email"
              >
                {copiedField === 'Email' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* College Roll Number */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <BookOpen size={14} /> College Roll Number
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {profile?.roll_number || '—'}
              </span>
              <button
                onClick={() => handleCopy(profile?.roll_number, 'College Roll Number')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Copy College Roll Number"
              >
                {copiedField === 'College Roll Number' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Phone size={14} /> Phone / Mobile
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {profile?.phone || <span className="text-slate-400 font-normal italic">Not provided</span>}
            </span>
          </div>

          {/* Institute / University */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Building2 size={14} /> Institute / College
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {profile?.display_institute || formatText(profile?.institute) || '—'}
            </span>
          </div>

          {/* Course / Degree */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <GraduationCap size={14} /> Course / Degree
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {profile?.course || <span className="text-slate-400 font-normal italic">Not provided</span>}
            </span>
          </div>

          {/* Specialization */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <GraduationCap size={14} /> Specialization / Branch
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {profile?.specialization || <span className="text-slate-400 font-normal italic">Not provided</span>}
            </span>
          </div>

          {/* Address / City */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <MapPin size={14} /> City / Location
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {profile?.address || <span className="text-slate-400 font-normal italic">Not provided</span>}
            </span>
          </div>

          {/* Registration Date */}
          <div className="bg-slate-50 dark:bg-[#202040] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar size={14} /> Registration Date
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {formatDate(profile?.created_at)}
            </span>
          </div>
        </div>

        {/* Resume Link Box */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-[#202040] border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText size={14} /> Resume / Portfolio Link
            </span>
            {profile?.resume_link && (
              <button
                onClick={() => handleCopy(profile.resume_link, 'Resume Link')}
                className="text-xs font-bold text-[#403f75] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} /> Copy URL
              </button>
            )}
          </div>
          {profile?.resume_link ? (
            <a
              href={profile.resume_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline break-all block"
            >
              {profile.resume_link}
            </a>
          ) : (
            <p className="text-xs text-slate-400 italic">No resume link uploaded yet. Click "Edit Profile" to add one.</p>
          )}
        </div>
      </div>

      {/* Inline Change Password Card */}
      <div className="bg-white dark:bg-[#1A1A32] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Lock className="text-amber-500 flex-shrink-0" size={19} />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Change Password
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
          Update your password to keep your account secure.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181830] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="Enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181830] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="Confirm new password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181830] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Update Password Action Button */}
          <div>
            <button
              type="submit"
              disabled={isChangingPassword || !isPasswordFormFilled}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs ${
                isPasswordFormFilled && !isChangingPassword
                  ? 'bg-[#403f75] dark:bg-indigo-600 text-white hover:bg-[#343360] dark:hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-100 dark:bg-[#202040] text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/60 cursor-not-allowed'
              }`}
            >
              {isChangingPassword ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Lock size={15} />
              )}
              <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-[#403f75] dark:bg-indigo-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold">Edit Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    College Roll Number
                  </label>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleInputChange}
                    placeholder="e.g. 21B91A0501"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Institution / College Selector */}
              <div className="relative" ref={instituteDropdownRef}>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#403f75] dark:text-indigo-400" />
                    Institution / College
                  </span>
                  {openInstitutes.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {openInstitutes.length} open {openInstitutes.length === 1 ? 'institute' : 'institutes'}
                    </span>
                  )}
                </label>

                {/* Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setIsInstituteDropdownOpen(prev => !prev)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-left flex items-center justify-between hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                    <Building2 size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className={formData.institute ? "text-slate-900 dark:text-white truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
                      {getSelectedInstituteDisplayName() || 'Select an open institute...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {formData.institute && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        open
                      </span>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isInstituteDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isInstituteDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1E1E38] rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in duration-100">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-[#181830]/50">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={instituteSearch}
                          onChange={(e) => setInstituteSearch(e.target.value)}
                          placeholder="Search open institutes..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {loadingInstitutes ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 size={14} className="animate-spin text-indigo-500" />
                          <span>Loading open institutes...</span>
                        </div>
                      ) : filteredOpenInstitutes.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          {openInstitutes.length === 0
                            ? 'No open institutes currently available in Manage Institutes.'
                            : `No institutes match "${instituteSearch}"`}
                        </div>
                      ) : (
                        filteredOpenInstitutes.map((inst) => {
                          const isSelected = isInstSelected(inst);
                          return (
                            <button
                              key={inst.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, institute: inst.name || inst.display_name }));
                                setIsInstituteDropdownOpen(false);
                                setInstituteSearch('');
                              }}
                              className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#25254A] transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate mr-2">
                                <Building2 size={14} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                                <span className="truncate">{inst.display_name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  open
                                </span>
                                {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Course / Degree
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    placeholder="e.g. B.Tech"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Specialization / Branch
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Resume Link (Google Drive / URL)
                </label>
                <input
                  type="url"
                  name="resume_link"
                  value={formData.resume_link}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#181830] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#403f75] dark:bg-indigo-600 hover:bg-[#343360] dark:hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
