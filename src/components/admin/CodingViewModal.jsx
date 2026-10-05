import React from 'react';
import { X } from 'lucide-react';

const CodingViewModal = ({
  viewingCodingQuestion,
  onClose
}) => {
  if (!viewingCodingQuestion) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-shnoor-navy">View Coding Question</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
          >
            <X size={20} className="text-shnoor-navy" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-lg font-bold text-shnoor-navy mb-2">{viewingCodingQuestion.title}</h4>
            <p className="text-shnoor-navy whitespace-pre-wrap">{viewingCodingQuestion.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-shnoor-lavender rounded-lg">
            <div>
              <span className="text-sm text-shnoor-navy">Marks:</span>
              <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.marks}</p>
            </div>
            <div>
              <span className="text-sm text-shnoor-navy">Time Limit:</span>
              <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.timeLimit}s</p>
            </div>
            <div>
              <span className="text-sm text-shnoor-navy">Memory Limit:</span>
              <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.memoryLimit}MB</p>
            </div>
          </div>

          {viewingCodingQuestion.publicTestCases && viewingCodingQuestion.publicTestCases.length > 0 && (
            <div>
              <h5 className="font-semibold text-shnoor-navy mb-3">Public Test Cases</h5>
              <div className="space-y-3">
                {viewingCodingQuestion.publicTestCases.map((tc, idx) => (
                  <div key={idx} className="p-4 border border-shnoor-mist rounded-lg">
                    <p className="text-sm font-medium text-shnoor-navy mb-2">Test Case {idx + 1}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-shnoor-navy font-medium">Input:</span>
                        <pre className="mt-1 p-2 bg-shnoor-lavender rounded text-shnoor-navy">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-shnoor-navy font-medium">Output:</span>
                        <pre className="mt-1 p-2 bg-shnoor-lavender rounded text-shnoor-navy">{tc.output}</pre>
                      </div>
                    </div>
                    {tc.explanation && (
                      <p className="mt-2 text-sm text-shnoor-navy">
                        <strong>Explanation:</strong> {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewingCodingQuestion.hiddenTestCases && viewingCodingQuestion.hiddenTestCases.length > 0 && (
            <div>
              <h5 className="font-semibold text-shnoor-navy mb-3">Hidden Test Cases</h5>
              <div className="space-y-3">
                {viewingCodingQuestion.hiddenTestCases.map((tc, idx) => (
                  <div key={idx} className="p-4 border border-shnoor-mist rounded-lg bg-shnoor-lavender/30">
                    <p className="text-sm font-medium text-shnoor-navy mb-2">Hidden Test Case {idx + 1}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-shnoor-navy font-medium">Input:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-shnoor-navy">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-shnoor-navy font-medium">Output:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-shnoor-navy">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-shnoor-mist">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-navy transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingViewModal;
