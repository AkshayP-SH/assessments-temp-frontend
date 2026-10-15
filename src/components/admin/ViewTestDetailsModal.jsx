import { formatDateTime } from '../../utils/dateTime';
import { X, Calendar, Clock, FileText, Target, Users, Award, Edit3 } from 'lucide-react';
import Button from '../Button';

const ViewTestDetailsModal = ({ test, onClose, onEdit }) => {
  if (!test) return null;

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    const date = new Date(dateTimeString);
    return formatDateTime(date, 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="bg-[#44448E] text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Test Details</h2>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">View test configuration</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Overview Banner */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{test.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${test.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}>
                    {test.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <Target size={14} className="text-[#44448E] shrink-0" />
                  <span>{test.jobRole || <span className="text-slate-400 italic font-normal">Job Role not specified</span>}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium shrink-0 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <span className="flex items-center gap-1">
                  <FileText size={14} className="text-[#44448E]" />
                  <strong className="text-slate-800">{test.questions}</strong> Questions
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-[#44448E]" />
                  <strong className="text-slate-800">{test.duration}</strong> Mins
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white shadow-2xs text-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#44448E] flex items-center justify-center mx-auto mb-1.5">
                <Clock size={16} />
              </div>
              <h4 className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Duration</h4>
              <p className="text-lg font-bold text-slate-900">{test.duration} <span className="text-xs font-normal text-slate-400">mins</span></p>
            </div>

            <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white shadow-2xs text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                <Award size={16} />
              </div>
              <h4 className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Passing Score</h4>
              <p className="text-lg font-bold text-emerald-700">{test.passingPercentage}%</p>
            </div>

            <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white shadow-2xs text-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#44448E] flex items-center justify-center mx-auto mb-1.5">
                <Users size={16} />
              </div>
              <h4 className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Max Attempts</h4>
              <p className="text-lg font-bold text-slate-900">{test.maxAttempts || 1}</p>
            </div>
          </div>

          {/* Schedule Window if set */}
          {(test.startDateTime || test.endDateTime) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date & Time</span>
                  <span className="font-semibold text-slate-800 truncate block">{formatDateTime(test.startDateTime)}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">End Date & Time</span>
                  <span className="font-semibold text-slate-800 truncate block">{formatDateTime(test.endDateTime)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <FileText size={14} className="text-[#44448E]" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Description</h4>
            </div>
            <div className="p-4 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
              {test.description || <span className="text-slate-400 italic">No description provided</span>}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/60 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-xs text-slate-400">
            Created: {test.date}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(test);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#44448E] hover:bg-[#383878] text-white rounded-xl text-sm font-semibold shadow-xs transition-all"
            >
              <Edit3 size={15} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTestDetailsModal;
