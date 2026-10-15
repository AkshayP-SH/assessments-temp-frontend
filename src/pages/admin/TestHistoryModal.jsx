import { formatDateTime } from '../../utils/dateTime';
import React from 'react';
import { X, Loader2, Plus, Users, Calendar, Pencil } from 'lucide-react';

const TestHistoryModal = ({
  isLoadingHistory,
  testHistory,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="bg-[#44448E] text-white px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Test History</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">{testHistory?.testName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#44448E]" size={28} />
              <span className="ml-3 text-slate-500 text-sm font-medium">Loading history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Created Info */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/80">
                <div className="flex items-center space-x-3 mb-2.5">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Plus className="text-emerald-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Created</h4>
                    <p className="text-xs text-slate-500">Test was created</p>
                  </div>
                </div>
                <div className="ml-11 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-slate-500">By:</span>
                    <span className="font-semibold text-slate-800">{testHistory?.createdBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-slate-500">On:</span>
                    <span className="font-semibold text-slate-800">
                      {testHistory?.createdAt && formatDateTime(testHistory.createdAt, 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Updated Info */}
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/70">
                <div className="flex items-center space-x-3 mb-2.5">
                  <div className="w-8 h-8 bg-indigo-100/80 text-[#44448E] rounded-lg flex items-center justify-center">
                    <Pencil className="text-[#44448E]" size={15} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Last Updated</h4>
                    <p className="text-xs text-slate-500">Most recent modification</p>
                  </div>
                </div>
                <div className="ml-11 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-slate-500">By:</span>
                    <span className="font-semibold text-slate-800">{testHistory?.updatedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-slate-500">On:</span>
                    <span className="font-semibold text-slate-800">
                      {testHistory?.updatedAt && formatDateTime(testHistory.updatedAt, 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-medium text-sm transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestHistoryModal;
