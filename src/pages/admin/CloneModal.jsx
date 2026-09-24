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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="bg-[#44448E] text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Clone Test</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Create a copy of "{testToClone.name}"</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            disabled={isCloning}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              New Test Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={cloneTestName}
              onChange={(e) => setCloneTestName(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/20 transition-all ${
                cloneError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#44448E]'
              }`}
              placeholder="Enter new test name"
              disabled={isCloning}
              autoFocus
            />
            {cloneError && (
              <p className="mt-2 text-xs font-medium text-rose-600 flex items-center">
                <XCircle size={14} className="mr-1" />
                {cloneError}
              </p>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700">
              <strong>Note:</strong> This will create a new test with:
            </p>
            <ul className="mt-2 text-xs text-slate-600 space-y-1.5 ml-4 list-disc">
              <li>All questions from the original test</li>
              <li>Same duration and settings</li>
              <li>Draft status (not published)</li>
              <li>No results or student assignments</li>
            </ul>
          </div>

          <div className="flex items-center space-x-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-medium text-sm transition-all duration-200"
              disabled={isCloning}
            >
              Cancel
            </button>
            <button
              onClick={handleCloneTestSubmit}
              className="flex-1 px-4 py-2.5 bg-[#44448E] hover:bg-[#373772] text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
