import { formatDate } from '../../utils/dateTime';
import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, getApiUrl } from '../../config/api';
import { Save, AlertTriangle, Clock, Video, UploadCloud, Trash2, RefreshCw, CheckCircle2, Film, Info } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SystemSettingsTab = () => {
    const [settings, setSettings] = useState({
        retry_timer_minutes: 5,
        maintenance_mode: false,
        maintenance_message: 'The system is currently undergoing scheduled maintenance. Please check back later.',
        default_test_job_role: 'General Assessment Candidate',
        default_test_job_description: 'This assessment evaluates candidate readiness across core technical and problem-solving skills relevant to the role.'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Company profile video states
    const [companyVideo, setCompanyVideo] = useState(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isDeletingVideo, setIsDeletingVideo] = useState(false);
    const [videoMessage, setVideoMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const replaceInputRef = useRef(null);

    useEffect(() => {
        fetchSettings();
        fetchCompanyVideo();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.settings) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load system settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyVideo = async () => {
        setIsVideoLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings/company-video', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setCompanyVideo(data.video || null);
            }
        } catch (error) {
            console.error('Error fetching company video:', error);
        } finally {
            setIsVideoLoading(false);
        }
    };

    const handleVideoFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset inputs
        e.target.value = '';

        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/ogg'];
        const isValidExtension = /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(file.name);
        if (!validTypes.includes(file.type) && !isValidExtension) {
            setVideoMessage({
                type: 'error',
                text: 'Please select a valid video format (MP4, WebM, MOV, AVI, MKV).'
            });
            return;
        }

        // Validate 100MB size limit
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_SIZE) {
            setVideoMessage({
                type: 'error',
                text: `File size (${formatFileSize(file.size)}) exceeds the maximum 100MB limit.`
            });
            return;
        }

        setIsUploadingVideo(true);
        setVideoMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('video', file);

            const response = await apiFetch('api/settings/company-video/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success && data.video) {
                setCompanyVideo(data.video);
                setVideoMessage({
                    type: 'success',
                    text: 'Company profile video uploaded successfully! Students will be required to watch at least 50%.'
                });
            } else {
                setVideoMessage({
                    type: 'error',
                    text: data.message || 'Failed to upload video'
                });
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            setVideoMessage({
                type: 'error',
                text: 'Network error while uploading video. Please try again.'
            });
        } finally {
            setIsUploadingVideo(false);
            setTimeout(() => setVideoMessage({ type: '', text: '' }), 6000);
        }
    };

    const handleDeleteVideo = async () => {
        if (!window.confirm('Are you sure you want to remove the company profile video? Students will no longer be prompted to watch it.')) {
            return;
        }

        setIsDeletingVideo(true);
        setVideoMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings/company-video', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCompanyVideo(null);
                setVideoMessage({
                    type: 'success',
                    text: 'Company profile video removed successfully.'
                });
            } else {
                setVideoMessage({
                    type: 'error',
                    text: data.message || 'Failed to delete video'
                });
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            setVideoMessage({
                type: 'error',
                text: 'Error removing company profile video.'
            });
        } finally {
            setIsDeletingVideo(false);
            setTimeout(() => setVideoMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    retry_timer_minutes: parseInt(settings.retry_timer_minutes, 10),
                    maintenance_mode: settings.maintenance_mode,
                    maintenance_message: settings.maintenance_message,
                    default_test_job_role: settings.default_test_job_role,
                    default_test_job_description: settings.default_test_job_description
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });

                localStorage.setItem('retry_timer_minutes', settings.retry_timer_minutes);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error saving system settings' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-shnoor-navy">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                    <p className="text-sm text-[#9A9AC9] mt-0.5">Configure global application behaviors, company videos, and maintenance modes.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-[#403f75] hover:bg-[#2d2d53] text-white h-12 px-6 rounded-xl font-bold shadow-sm transition-all w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-dangerLight' : 'bg-shnoor-successLight text-shnoor-success border border-shnoor-successLight'}`}>
                    {message.text}
                </div>
            )}

            {/* COMPANY PROFILE VIDEO CARD */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-3 text-[#403f75]">
                        <div className="w-10 h-10 rounded-xl bg-[#403f75]/10 flex items-center justify-center text-[#403f75]">
                            <Video size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Company Profile Video
                                {companyVideo ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 size={12} /> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                        Optional / Not Uploaded
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-[#9A9AC9] mt-0.5">
                                When uploaded, newly registered students will be required to watch at least 50% of this video before proceeding to the dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {videoMessage.text && (
                    <div className={`p-4 rounded-xl mb-5 text-sm font-medium ${videoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {videoMessage.text}
                    </div>
                )}

                {/* Hidden File Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleVideoFileSelect}
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={replaceInputRef}
                    onChange={handleVideoFileSelect}
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                    className="hidden"
                />

                {isVideoLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Checking company video status...</div>
                ) : companyVideo ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Video Preview Player */}
                            <div className="lg:col-span-6 overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center shadow-inner relative group">
                                <video
                                    src={getApiUrl(companyVideo.video_url)}
                                    controls
                                    preload="metadata"
                                    className="w-full h-full object-contain rounded-xl"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            {/* Video Details & Actions */}
                            <div className="lg:col-span-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#403f75]">
                                        <Film size={14} /> Current Active Video
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 break-all">
                                        {companyVideo.filename || 'Company Profile Video'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 bg-white p-3.5 rounded-xl border border-slate-200">
                                        <div>
                                            <span className="text-gray-400 block">File Size</span>
                                            <span className="font-semibold text-gray-700">{formatFileSize(companyVideo.file_size)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block">Uploaded On</span>
                                            <span className="font-semibold text-gray-700">
                                                {companyVideo.uploaded_at ? formatDate(companyVideo.uploaded_at, undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => replaceInputRef.current?.click()}
                                        disabled={isUploadingVideo || isDeletingVideo}
                                        className="inline-flex items-center justify-center gap-2 bg-[#403f75] hover:bg-[#2d2d53] text-white text-xs h-10 px-4 rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw size={14} className={isUploadingVideo ? 'animate-spin' : ''} />
                                        <span>{isUploadingVideo ? 'Uploading Replacement...' : 'Replace Video'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleDeleteVideo}
                                        disabled={isUploadingVideo || isDeletingVideo}
                                        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-xs h-10 px-4 rounded-xl font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={14} className="text-red-600 shrink-0" />
                                        <span>{isDeletingVideo ? 'Removing...' : 'Delete Video'}</span>
                                    </button>
                                </div>

                                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl">
                                    <Info size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
                                    <span>
                                        Replacing this video creates a fresh record. Newly registering students will need to watch the new video.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Upload Dropzone */
                    <div
                        onClick={() => !isUploadingVideo && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isUploadingVideo ? 'border-[#403f75] bg-[#403f75]/5' : 'border-slate-300 hover:border-[#403f75] hover:bg-slate-50'}`}
                    >
                        <div className="max-w-md mx-auto space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-[#403f75]/10 text-[#403f75] flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                                <UploadCloud size={28} className={isUploadingVideo ? 'animate-bounce' : ''} />
                            </div>
                            <div>
                                <p className="text-base font-bold text-gray-800">
                                    {isUploadingVideo ? 'Uploading Video...' : 'Click to Upload Company Profile Video'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: MP4, WebM, MOV, AVI, MKV (Maximum file size: 100MB)
                                </p>
                            </div>
                            <div className="pt-2">
                                <span className="inline-block text-xs font-semibold text-[#403f75] bg-white border border-[#403f75]/20 px-3 py-1.5 rounded-lg shadow-xs">
                                    {isUploadingVideo ? 'Processing video file...' : 'Browse files from computer'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
                    <div className="flex items-center mb-4 space-x-2 text-[#403f75]">
                        <Clock size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Disaster Recovery</h3>
                    </div>
                    <p className="text-sm text-[#9A9AC9] mb-6">
                        Configure how the frontend behaves when the backend server goes down unexpectedly.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Auto-Retry Timer (Minutes)
                            </label>
                            <input
                                type="number"
                                name="retry_timer_minutes"
                                min="1"
                                max="60"
                                value={settings.retry_timer_minutes}
                                onChange={handleChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                            />
                            <p className="text-xs text-[#9A9AC9] mt-2">
                                When the server goes down, students will see a fallback screen that counts down this many minutes before automatically polling the server again.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
                    <div className="flex items-center mb-4 space-x-2 text-amber-500">
                        <AlertTriangle size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Maintenance Mode</h3>
                    </div>
                    <p className="text-sm text-[#9A9AC9] mb-6">
                        Manually restrict student access to the platform during scheduled updates. Admins bypass this restriction.
                    </p>

                    <div className="space-y-6">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="maintenance_mode"
                                    checked={settings.maintenance_mode}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-amber-500' : 'bg-[#E5E5F3]'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.maintenance_mode ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 font-bold text-gray-900">
                                Enable Maintenance Mode
                            </div>
                        </label>

                        {settings.maintenance_mode && (
                            <div className="animate-fadeIn">
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                    Maintenance Message
                                </label>
                                <textarea
                                    name="maintenance_message"
                                    value={settings.maintenance_message}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-none"
                                    placeholder="Enter the message students will see..."
                                ></textarea>
                                <p className="text-xs text-[#9A9AC9] mt-2">
                                    This message is displayed prominently on the maintenance screen.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 bg-white rounded-2xl shadow-sm border-0 md:col-span-2">
                    <div className="flex items-center mb-4 space-x-2 text-[#403f75]">
                        <Save size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Assessment Defaults</h3>
                    </div>
                    <p className="text-sm text-[#9A9AC9] mb-6">
                        Configure fallback values used when admins create or edit tests without entering Job Role or Job Description.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Default Job Role
                            </label>
                            <input
                                type="text"
                                name="default_test_job_role"
                                value={settings.default_test_job_role || ''}
                                onChange={handleChange}
                                className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                                placeholder="e.g., General Assessment Candidate"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                Default Job Description
                            </label>
                            <textarea
                                name="default_test_job_description"
                                value={settings.default_test_job_description || ''}
                                onChange={handleChange}
                                rows="12"
                                className="w-full px-4 py-3 rounded-xl border border-[#D1D1E6] bg-white text-sm leading-relaxed text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-y min-h-[240px] max-h-[600px]"
                                placeholder="Default description shown when test-specific description is not provided"
                            ></textarea>
                            <p className="text-xs text-[#9A9AC9] mt-2">
                                Drag the bottom-right corner to resize. Supports multiple lines.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SystemSettingsTab;
