import React from 'react';
import { X, XCircle, Loader2, Copy } from 'lucide-react';

const CloneModal = ({
  testToClone,
  cloneTestName,
  setCloneTestName,
  isCloning,
  cloneError,
  handleCloneTestSubmit,
  onClose,
}) => {
  if (!testToClone) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-md w-full">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Clone Test</h3>
            <p className="text-shnoor-lavender text-sm mt-1">Create a copy of "{testToClone.name}"</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            disabled={isCloning}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-shnoor-indigo mb-2">
              New Test Name <span className="text-shnoor-danger">*</span>
            </label>
            <input
              type="text"
              value={cloneTestName}
              onChange={(e) => setCloneTestName(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shnoor-indigo ${
                cloneError ? 'border-shnoor-danger' : 'border-shnoor-mist'
              }`}
              placeholder="Enter new test name"
              disabled={isCloning}
              autoFocus
            />
            {cloneError && (
              <p className="mt-2 text-sm text-shnoor-danger flex items-center">
                <XCircle size={14} className="mr-1" />
                {cloneError}
              </p>
            )}
          </div>

          <div className="bg-shnoor-lavender border border-shnoor-light rounded-lg p-4">
            <p className="text-sm text-shnoor-navy">
              <strong>Note:</strong> This will create a new test with:
            </p>
            <ul className="mt-2 text-sm text-shnoor-indigo space-y-1 ml-4 list-disc">
              <li>All questions from the original test</li>
              <li>Same duration and settings</li>
              <li>Draft status (not published)</li>
              <li>No results or student assignments</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
              disabled={isCloning}
            >
              Cancel
            </button>
            <button
              onClick={handleCloneTestSubmit}
              className="flex-1 px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCloning}
            >
              {isCloning ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Cloning...</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Clone Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloneModal;
