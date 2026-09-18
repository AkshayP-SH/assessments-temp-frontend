import React from 'react';
import { X, Loader2, Plus, Users, Calendar, Pencil } from 'lucide-react';

const TestHistoryModal = ({
  isLoadingHistory,
  testHistory,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-2xl w-full">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Test History</h3>
            <p className="text-shnoor-lavender text-sm mt-1">{testHistory?.testName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
              <span className="ml-3 text-shnoor-indigoMedium">Loading history...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Created Info */}
              <div className="p-4 bg-shnoor-successLight rounded-xl border border-shnoor-successLight">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-shnoor-successLight rounded-full flex items-center justify-center">
                    <Plus className="text-shnoor-success" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-shnoor-navy">Created</h4>
                    <p className="text-sm text-shnoor-indigoMedium">Test was created</p>
                  </div>
                </div>
                <div className="ml-13 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users size={16} className="text-shnoor-indigoMedium" />
                    <span className="text-shnoor-indigoMedium">By:</span>
                    <span className="font-bold text-shnoor-navy">{testHistory?.createdBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar size={16} className="text-shnoor-indigoMedium" />
                    <span className="text-shnoor-indigoMedium">On:</span>
                    <span className="font-bold text-shnoor-navy">
                      {testHistory?.createdAt && new Date(testHistory.createdAt).toLocaleString('en-US', {
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
              <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-shnoor-lavender rounded-full flex items-center justify-center">
                    <Pencil className="text-shnoor-indigo" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-shnoor-navy">Last Updated</h4>
                    <p className="text-sm text-shnoor-indigoMedium">Most recent modification</p>
                  </div>
                </div>
                <div className="ml-13 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users size={16} className="text-shnoor-indigoMedium" />
                    <span className="text-shnoor-indigoMedium">By:</span>
                    <span className="font-bold text-shnoor-navy">{testHistory?.updatedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar size={16} className="text-shnoor-indigoMedium" />
                    <span className="text-shnoor-indigoMedium">On:</span>
                    <span className="font-bold text-shnoor-navy">
                      {testHistory?.updatedAt && new Date(testHistory.updatedAt).toLocaleString('en-US', {
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

        <div className="p-6 border-t border-shnoor-light flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestHistoryModal;
