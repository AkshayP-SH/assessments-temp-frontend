import { useState } from 'react';
import { Lock, Unlock, Pause, X, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../config/api';
import CustomDateTimePicker from './CustomDateTimePicker';

const InstituteRegistrationControl = ({ institute, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    registration_status: institute.registration_status || 'open',
    registration_start_time: institute.registration_start_time 
      ? new Date(institute.registration_start_time) 
      : null,
    registration_deadline: institute.registration_deadline 
      ? new Date(institute.registration_deadline) 
      : null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function convertISTToUTC(date) {
    if (!date) return null;
    return date.toISOString();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${institute.id}/registration-control`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registration_status: formData.registration_status,
          registration_start_time: convertISTToUTC(formData.registration_start_time),
          registration_deadline: convertISTToUTC(formData.registration_deadline)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onUpdate();
        onClose();
      } else {
        setError(data.message || 'Failed to update registration control');
      }
    } catch (error) {
      console.error('Error updating registration control:', error);
      setError(error.message || 'Failed to update registration control');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'closed':
        return <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
      case 'closed':
        return 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200';
      case 'paused':
        return 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="bg-[#403f75] dark:bg-indigo-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Registration Control</h2>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">{institute.display_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border-l-4 border-rose-500 text-rose-800 dark:text-rose-200 p-3 rounded-r-lg flex items-start text-xs font-medium">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {(() => {
            const now = new Date();
            const startTime = institute.registration_start_time ? new Date(institute.registration_start_time) : null;
            const deadline = institute.registration_deadline ? new Date(institute.registration_deadline) : null;
            const notYetOpen = startTime && now < startTime;
            const deadlinePassed = deadline && now > deadline;
            
            let effectiveStatus = institute.registration_status || 'open';
            let statusText = effectiveStatus;
            let statusColor = getStatusColor(effectiveStatus);
            let statusIcon = getStatusIcon(effectiveStatus);
            
            if (notYetOpen) {
              effectiveStatus = 'not_yet_open';
              statusText = 'Not Yet Open';
              statusColor = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
              statusIcon = <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
            }
            else if (deadlinePassed && effectiveStatus === 'open') {
              effectiveStatus = 'closed';
              statusText = 'Closed (Deadline Passed)';
              statusColor = 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200';
              statusIcon = <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
            }
            
            return (
              <div className={`border rounded-xl p-4 transition-all ${statusColor}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/80 dark:bg-[#1E1E38]/80 rounded-lg shadow-xs border border-slate-200/50 dark:border-slate-700/50">
                    {statusIcon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Status</p>
                    <p className="text-sm font-extrabold capitalize mt-0.5">{statusText}</p>
                  </div>
                </div>
                {institute.registration_start_time && (
                  <p className="text-xs mt-2.5 text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Start:</span> {new Date(institute.registration_start_time).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })} IST
                    {notYetOpen && <span className="ml-1.5 font-bold text-amber-600 dark:text-amber-400">(Not Yet Open)</span>}
                  </p>
                )}
                {institute.registration_deadline && (
                  <p className="text-xs mt-1.5 text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Deadline:</span> {new Date(institute.registration_deadline).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })} IST
                    {deadlinePassed && <span className="ml-1.5 font-bold text-rose-600 dark:text-rose-400">(Passed)</span>}
                  </p>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2.5">
              Registration Status <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2.5">
              <label className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${
                formData.registration_status === 'open'
                  ? 'border-[#403f75] dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-[#2E2E5A]'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="open"
                  checked={formData.registration_status === 'open'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Open</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Students can register</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${
                formData.registration_status === 'paused'
                  ? 'border-[#403f75] dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-[#2E2E5A]'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="paused"
                  checked={formData.registration_status === 'paused'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Pause className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Paused</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Temporarily disabled</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${
                formData.registration_status === 'closed'
                  ? 'border-[#403f75] dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-[#2E2E5A]'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="closed"
                  checked={formData.registration_status === 'closed'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Closed</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Registration permanently closed</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
              Registration Start Time (Optional)
            </label>
            <CustomDateTimePicker
              value={formData.registration_start_time}
              onChange={(date) => setFormData({ ...formData, registration_start_time: date })}
              placeholder="YYYY-MM-DD HH:MM or click to select"
              disabled={isSaving}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Format: YYYY-MM-DD HH:MM (24-hour). Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
              Registration Deadline (Optional)
            </label>
            <CustomDateTimePicker
              value={formData.registration_deadline}
              onChange={(date) => setFormData({ ...formData, registration_deadline: date })}
              placeholder="YYYY-MM-DD HH:MM or click to select"
              disabled={isSaving}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Format: YYYY-MM-DD HH:MM (24-hour). Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 p-4 rounded-xl">
            <div className="flex items-start">
              <AlertCircle size={15} className="text-[#403f75] dark:text-indigo-400 mr-2.5 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Status "Closed" or "Paused" blocks all registrations</li>
                  <li>Start time blocks registrations before the specified time</li>
                  <li>Deadline automatically blocks registrations after the specified time</li>
                  <li>You can manually reopen registration anytime by changing status to "Open"</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-[#181830]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-[#25254A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#303060] transition-colors cursor-pointer"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstituteRegistrationControl;
