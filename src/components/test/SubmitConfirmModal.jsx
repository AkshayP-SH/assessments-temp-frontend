import React from 'react';
import { CheckCircle2, HelpCircle, Flag, AlertTriangle, ArrowLeft, Send } from 'lucide-react';

const SubmitConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  totalQuestions = 0,
  answeredCount = 0,
  markedForReviewCount = 0,
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-shnoor-light transform transition-all scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-shnoor-navy to-shnoor-indigo text-white px-6 py-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shadow-inner">
              <Send size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Submit Assessment</h2>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                Review your exam summary before finalizing
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Answered */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex justify-center mb-1 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700">{answeredCount}</div>
              <div className="text-[11px] sm:text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-0.5">
                Answered
              </div>
            </div>

            {/* Unanswered */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex justify-center mb-1 text-amber-600">
                <HelpCircle size={20} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700">{unansweredCount}</div>
              <div className="text-[11px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider mt-0.5">
                Unanswered
              </div>
            </div>

            {/* Marked for Review */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="flex justify-center mb-1 text-shnoor-indigo">
                <Flag size={20} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-shnoor-indigo">{markedForReviewCount}</div>
              <div className="text-[11px] sm:text-xs font-semibold text-shnoor-indigoMedium uppercase tracking-wider mt-0.5">
                Review
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                <p className="font-semibold mb-0.5">Ready to submit?</p>
                <p>
                  Once you submit your test, you cannot return to modify your responses. Make sure you have answered all intended questions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm"
          >
            <ArrowLeft size={16} />
            <span>Return to Test</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Yes, Submit Exam</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
