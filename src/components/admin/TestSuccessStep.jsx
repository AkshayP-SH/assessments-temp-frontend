import React from 'react';
import { CheckCircle, Upload, ArrowLeft, FileText } from 'lucide-react';

const TestSuccessStep = ({
  uploadedTestName,
  handlePublish,
  isPublishing,
  resetForm,
  onComplete
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-8 max-w-2xl mx-auto">
      <div className="text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-shnoor-successLight rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-shnoor-success" />
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-shnoor-navy mb-3">Test Saved as Draft!</h2>
        <p className="text-lg text-shnoor-navy mb-2">"{uploadedTestName}"</p>
        <p className="text-sm text-shnoor-navy mb-8">
          Your test has been saved as a draft. You can publish it now or later from the dashboard.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Publish Test Now</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              if (onComplete) onComplete();
            }}
            className="w-full py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Save as Draft & Return to Dashboard</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg text-left">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <FileText className="h-5 w-5 text-shnoor-indigo" />
            </div>
            <div className="text-sm text-shnoor-indigo">
              <p className="font-bold mb-1">What's the difference?</p>
              <ul className="text-shnoor-indigo space-y-1 list-disc list-inside">
                <li>
                  <span className="font-semibold">Draft:</span> Test is saved but not visible to students
                </li>
                <li>
                  <span className="font-semibold">Published:</span> Students can immediately see and take the test
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuccessStep;
