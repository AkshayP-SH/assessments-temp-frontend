import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../config/api';
import Button from '../Button';

const EditTestDetailsModal = ({ test, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    jobRole: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    duration: 60,
    passingPercentage: 50,
    maxAttempts: 1
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (test) {
      setFormData({
        jobRole: test.jobRole || '',
        description: test.description || '',
        startDateTime: test.startDateTime ? formatDateTimeForInput(test.startDateTime) : '',
        endDateTime: test.endDateTime ? formatDateTimeForInput(test.endDateTime) : '',
        duration: test.duration || 60,
        passingPercentage: test.passingPercentage || 50,
        maxAttempts: test.maxAttempts || 1
      });
    }
  }, [test]);

  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);

    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.duration < 1 || formData.duration > 300) {
      newErrors.duration = 'Duration must be between 1 and 300 minutes';
    }

    if (formData.passingPercentage < 0 || formData.passingPercentage > 100) {
      newErrors.passingPercentage = 'Passing percentage must be between 0 and 100';
    }

    if (formData.maxAttempts < 1 || formData.maxAttempts > 10) {
      newErrors.maxAttempts = 'Max attempts must be between 1 and 10';
    }

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        newErrors.endDateTime = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSaveError('');
  };

  const convertISTToUTC = (dateTimeString) => {
    if (!dateTimeString) return null;
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
    const date = new Date(istDateString);

    return date.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}/details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_role: formData.jobRole.trim(),
          description: formData.description.trim(),
          start_datetime: convertISTToUTC(formData.startDateTime),
          end_datetime: convertISTToUTC(formData.endDateTime),
          duration: parseInt(formData.duration),
          passing_percentage: parseInt(formData.passingPercentage),
          max_attempts: parseInt(formData.maxAttempts)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSave();
        onClose();
      } else {
        setSaveError(data.message || 'Failed to update test details');
      }
    } catch (error) {
      console.error('Error updating test details:', error);
      setSaveError(error.message || 'Failed to update test details');
    } finally {
      setIsSaving(false);
    }
  };

  if (!test) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="bg-[#44448E] text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Edit Test Details</h2>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">{test.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {saveError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start text-xs font-medium">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Job Role
            </label>
            <input
              type="text"
              value={formData.jobRole}
              onChange={(e) => handleChange('jobRole', e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium bg-white shadow-2xs ${errors.jobRole
                ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500'
                : 'border-slate-200 text-slate-800 focus:ring-[#44448E]/15 focus:border-[#44448E]'
                }`}
              placeholder="e.g., Software Developer"
              disabled={isSaving}
            />
            {errors.jobRole && (
              <p className="text-rose-600 text-xs mt-1.5 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.jobRole}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] transition-all resize-none text-sm text-slate-800 font-medium bg-white shadow-2xs placeholder:text-slate-400"
              placeholder="Describe the job role..."
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => handleChange('startDateTime', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] transition-all text-sm text-slate-800 font-medium bg-white shadow-2xs"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => handleChange('endDateTime', e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium bg-white shadow-2xs ${errors.endDateTime
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500'
                  : 'border-slate-200 text-slate-800 focus:ring-[#44448E]/15 focus:border-[#44448E]'
                  }`}
                disabled={isSaving}
              />
              {errors.endDateTime && (
                <p className="text-rose-600 text-xs mt-1.5 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.endDateTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Duration (min) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium bg-white shadow-2xs ${errors.duration
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500'
                  : 'border-slate-200 text-slate-800 focus:ring-[#44448E]/15 focus:border-[#44448E]'
                  }`}
                disabled={isSaving}
              />
              {errors.duration && (
                <p className="text-rose-600 text-xs mt-1">{errors.duration}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Passing % <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.passingPercentage}
                onChange={(e) => handleChange('passingPercentage', e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium bg-white shadow-2xs ${errors.passingPercentage
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500'
                  : 'border-slate-200 text-slate-800 focus:ring-[#44448E]/15 focus:border-[#44448E]'
                  }`}
                disabled={isSaving}
              />
              {errors.passingPercentage && (
                <p className="text-rose-600 text-xs mt-1">{errors.passingPercentage}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                Max Attempts <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxAttempts}
                onChange={(e) => handleChange('maxAttempts', e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium bg-white shadow-2xs ${errors.maxAttempts
                  ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-500/15 focus:border-rose-500'
                  : 'border-slate-200 text-slate-800 focus:ring-[#44448E]/15 focus:border-[#44448E]'
                  }`}
                disabled={isSaving}
              />
              {errors.maxAttempts && (
                <p className="text-rose-600 text-xs mt-1">{errors.maxAttempts}</p>
              )}
            </div>
          </div>

          {test.status === 'published' && (
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <AlertCircle size={16} className="text-[#44448E] shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-800">Note:</strong> Changes will be reflected immediately. Questions cannot be modified for published tests.
              </p>
            </div>
          )}
        </form>

        <div className="bg-slate-50/60 border-t border-slate-100 px-6 py-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#44448E] hover:bg-[#383878] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTestDetailsModal;