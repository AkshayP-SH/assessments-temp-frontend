import React from 'react';
import { StopCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const TerminationModal = ({
  isOpen = false,
  terminationData,
  onContinue
}) => {
  if (!isOpen || !terminationData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <StopCircle size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Examination Terminated</h2>
              <p className="text-red-100 text-sm mt-1">Your test has been stopped by the administrator</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Notice Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 mb-1">Test Terminated</p>
                <p className="text-sm text-red-700">
                  The exam administrator has stopped your examination. Your current progress has been recorded and submitted.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-start space-x-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">Reason for Termination:</span>
            </div>
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{terminationData.reason}</p>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Next Steps:</span> You will be redirected to provide feedback about your exam experience. If you believe this action was taken in error, please contact the examination office.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <span>Continue to Feedback</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminationModal;
