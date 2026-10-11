import React, { useState, useRef, useEffect } from 'react';
import { apiFetch, getApiUrl } from '../../config/api';
import { Play, Pause, Volume2, VolumeX, CheckCircle2, Lock, ArrowRight, Film, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../Button';

const CompanyProfileVideoModal = ({ video, onComplete }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [maxWatchedTime, setMaxWatchedTime] = useState(0);
    const [watchPercentage, setWatchPercentage] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const REQUIRED_PERCENTAGE = 50;
    const isRequirementMet = watchPercentage >= REQUIRED_PERCENTAGE;

    // Track watched time and prevent skipping ahead
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration || 0;

        // If student attempts to scrub past max watched point + 2s buffer, snap back
        if (current > maxWatchedTime + 2.5) {
            videoRef.current.currentTime = maxWatchedTime;
            return;
        }

        setCurrentTime(current);

        if (current > maxWatchedTime) {
            setMaxWatchedTime(current);
        }

        if (total > 0) {
            const calculatedPercent = Math.min(100, Math.round((Math.max(current, maxWatchedTime) / total) * 100));
            setWatchPercentage(calculatedPercent);
        }
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        const total = videoRef.current.duration;
        setDuration(total);
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleProceed = async () => {
        if (!isRequirementMet || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const token = localStorage.getItem('studentAuthToken');
            const response = await apiFetch('api/student/company-video/mark-seen', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    video_id: video.id,
                    watched_seconds: Math.round(maxWatchedTime),
                    total_duration: Math.round(duration),
                    watch_percentage: watchPercentage
                })
            });

            const data = await response.json();
            if (data.success) {
                onComplete();
            } else {
                setErrorMsg(data.message || 'Failed to save completion status. Please try again.');
            }
        } catch (error) {
            console.error('Error recording video completion:', error);
            // Even if network blips, allow user through if requirement was met
            onComplete();
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (timeInSec) => {
        if (!timeInSec || isNaN(timeInSec)) return '00:00';
        const minutes = Math.floor(timeInSec / 60);
        const seconds = Math.floor(timeInSec % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-[#403f75] to-[#2d2d53] text-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                            <Film size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-white">Welcome! Company Profile Video</h3>
                                <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                                    Mandatory Onboarding
                                </span>
                            </div>
                            <p className="text-xs text-white/80">
                                Please watch at least 50% of the video to continue to your dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        src={getApiUrl(video.video_url)}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                            setIsPlaying(false);
                            setWatchPercentage(100);
                        }}
                        className="w-full h-full max-h-[50vh] object-contain cursor-pointer"
                        onClick={togglePlay}
                        playsInline
                    />

                    {/* Center Big Play Button when paused */}
                    {!isPlaying && (
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#403f75]/90 hover:bg-[#403f75] text-white flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 cursor-pointer"
                        >
                            <Play size={28} className="ml-1" fill="white" />
                        </button>
                    )}

                    {/* Bottom Custom Overlay Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={togglePlay}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            >
                                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
                            </button>
                            <button
                                type="button"
                                onClick={toggleMute}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <span className="font-mono text-white/90">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 font-medium">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${isRequirementMet ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`}>
                                {watchPercentage}% watched
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress & Bottom Action Card */}
                <div className="p-6 bg-slate-50 border-t border-slate-200/80 space-y-4">
                    {/* Watch Requirement Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-700 flex items-center gap-1.5">
                                {isRequirementMet ? (
                                    <>
                                        <CheckCircle2 size={15} className="text-emerald-600" />
                                        <span className="text-emerald-700">Requirement Completed (Watched {watchPercentage}%)</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={14} className="text-amber-600" />
                                        <span className="text-gray-700">Watch Requirement: <strong className="text-gray-900">{watchPercentage}%</strong> / 50% needed</span>
                                    </>
                                )}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                                {isRequirementMet ? 'Unlocked' : `${Math.max(0, 50 - watchPercentage)}% remaining`}
                            </span>
                        </div>

                        {/* Progress Track */}
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                            {/* 50% target marker */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10" title="50% Target" />
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                    isRequirementMet
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                        : 'bg-gradient-to-r from-[#403f75] to-[#605f9e]'
                                }`}
                                style={{ width: `${watchPercentage}%` }}
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                        <p className="text-xs text-gray-500 text-center sm:text-left">
                            {isRequirementMet ? (
                                <span className="text-emerald-700 font-medium">
                                    Great job! You have satisfied the orientation requirement.
                                </span>
                            ) : (
                                <span>
                                    Fast-forwarding is restricted until the video is watched.
                                </span>
                            )}
                        </p>

                        <Button
                            type="button"
                            onClick={handleProceed}
                            disabled={!isRequirementMet || isSubmitting}
                            className={`w-full sm:w-auto h-11 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${
                                isRequirementMet
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transform hover:scale-[1.02]'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
                            }`}
                        >
                            <span>{isSubmitting ? 'Saving Progress...' : 'Continue to Dashboard'}</span>
                            {isRequirementMet ? <ArrowRight size={16} /> : <Lock size={15} />}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompanyProfileVideoModal;
