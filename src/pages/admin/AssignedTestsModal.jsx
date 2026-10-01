import React from 'react';
import { X, ChevronDown, AlertCircle, Loader2, Trash2, FileSpreadsheet } from 'lucide-react';

const AssignedTestsModal = ({
  selectedInstituteForTests,
  isLoadingAssignedTests,
  assignedTests,
  tests,
  selectedTestsForInstitute,
  setSelectedTestsForInstitute,
  isInstituteTestDropdownOpen,
  setIsInstituteTestDropdownOpen,
  isAssigningTestToInstitute,
  handleAssignTestToInstitute,
  selectedTestsForUnassign,
  toggleTestForUnassign,
  toggleAllTestsForUnassign,
  handleBulkUnassignTests,
  handleUnassignTest,
  isUnassigningTests,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="bg-[#403f75] dark:bg-indigo-600 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{selectedInstituteForTests.display_name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Assigned Tests</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Assign New Test */}
          <div className="bg-slate-50 dark:bg-[#232348] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Assign New Test to Institute
              </label>
              {selectedTestsForInstitute.length > 0 && (
                <span className="text-xs font-semibold text-[#403f75] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded-full">
                  {selectedTestsForInstitute.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Custom Dropdown Button */}
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setIsInstituteTestDropdownOpen(!isInstituteTestDropdownOpen)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1E1E38] text-slate-800 dark:text-slate-100 text-sm font-medium transition-all flex items-center justify-between hover:border-[#403f75] dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 shadow-2xs cursor-pointer"
                >
                  <span className={selectedTestsForInstitute.length === 0 ? 'text-slate-400 dark:text-slate-400 font-normal' : 'text-slate-800 dark:text-white font-semibold'}>
                    {selectedTestsForInstitute.length === 0
                      ? 'Choose tests to assign...'
                      : `${selectedTestsForInstitute.length} test${selectedTestsForInstitute.length !== 1 ? 's' : ''} chosen`
                    }
                  </span>
                  <ChevronDown size={18} className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isInstituteTestDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu with Checkboxes */}
                {isInstituteTestDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsInstituteTestDropdownOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#25254A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-700/60">
                      {tests.filter(test => test.status === 'published').length === 0 ? (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-1.5">
                          <AlertCircle size={15} className="text-amber-500" />
                          <span>No published tests available. Please publish a test first.</span>
                        </div>
                      ) : (
                        tests.filter(test => test.status === 'published').map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/40 dark:hover:bg-[#2E2E5A] cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedTestsForInstitute.includes(test.id)) {
                                setSelectedTestsForInstitute(selectedTestsForInstitute.filter(id => id !== test.id));
                              } else {
                                setSelectedTestsForInstitute([...selectedTestsForInstitute, test.id]);
                              }
                              setIsInstituteTestDropdownOpen(false);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTestsForInstitute.includes(test.id)}
                              readOnly
                              className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block truncate">{test.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{test.questions} questions</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  handleAssignTestToInstitute();
                  setIsInstituteTestDropdownOpen(false);
                }}
                disabled={selectedTestsForInstitute.length === 0 || isAssigningTestToInstitute}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                  selectedTestsForInstitute.length > 0 && !isAssigningTestToInstitute
                    ? 'bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-xs hover:shadow active:scale-[0.99]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {isAssigningTestToInstitute && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                <span>
                  {isAssigningTestToInstitute
                    ? 'Assigning...'
                    : selectedTestsForInstitute.length > 0
                      ? `Assign (${selectedTestsForInstitute.length})`
                      : 'Assign Test'
                  }
                </span>
              </button>
            </div>
          </div>

          {/* Assigned Tests List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Currently Assigned Tests</h4>
                {assignedTests.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-full">
                    {assignedTests.length}
                  </span>
                )}
              </div>
              {selectedTestsForUnassign.length > 0 && (
                <button
                  onClick={handleBulkUnassignTests}
                  disabled={isUnassigningTests}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUnassigningTests ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      <span>Unassigning...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Unassign {selectedTestsForUnassign.length} Selected</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isLoadingAssignedTests ? (
              <div className="flex items-center justify-center py-10 bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                <span className="ml-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">Loading assigned tests...</span>
              </div>
            ) : assignedTests.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <FileSpreadsheet size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No tests assigned yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Use the selector above to assign tests to this institute.</p>
              </div>
            ) : (
              <div className="border border-slate-200/90 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-[#1E1E38] shadow-2xs">
                {/* Select All Checkbox Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 dark:bg-[#25254A] border-b border-slate-200/80 dark:border-slate-700">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedTestsForUnassign.length === assignedTests.length && assignedTests.length > 0}
                      onChange={toggleAllTestsForUnassign}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedTestsForUnassign.length > 0 ? `${selectedTestsForUnassign.length} of ${assignedTests.length} selected` : 'Select All Tests'}
                    </span>
                  </label>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {assignedTests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${
                        selectedTestsForUnassign.includes(test.id)
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50/70 dark:hover:bg-[#25254C]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedTestsForUnassign.includes(test.id)}
                          onChange={() => toggleTestForUnassign(test.id)}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">{test.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{test.question_count} questions</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{test.duration_minutes} mins</span>
                            {test.is_institute_level && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#403f75] dark:text-indigo-300 border border-indigo-100/80 dark:border-indigo-900/60 rounded-full text-[10px] font-semibold">
                                  Institute Level
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignTest(test.id, test.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-2 shrink-0 cursor-pointer"
                        title="Unassign Test"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-[#181830]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-[#25254A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#303060] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedTestsModal;
