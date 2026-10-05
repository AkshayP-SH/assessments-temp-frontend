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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="bg-[#44448E] px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{selectedInstituteForTests.display_name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Assigned Tests</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Assign New Test */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Assign New Test to Institute
              </label>
              {selectedTestsForInstitute.length > 0 && (
                <span className="text-xs font-semibold text-[#44448E] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm font-medium transition-all flex items-center justify-between hover:border-[#44448E] focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] shadow-2xs"
                >
                  <span className={selectedTestsForInstitute.length === 0 ? 'text-slate-400 font-normal' : 'text-slate-800 font-medium'}>
                    {selectedTestsForInstitute.length === 0
                      ? 'Choose tests to assign...'
                      : `${selectedTestsForInstitute.length} test${selectedTestsForInstitute.length !== 1 ? 's' : ''} chosen`
                    }
                  </span>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${isInstituteTestDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu with Checkboxes */}
                {isInstituteTestDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsInstituteTestDropdownOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 divide-y divide-slate-50">
                      {tests.filter(test => test.status === 'published').length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
                          <AlertCircle size={15} className="text-amber-500" />
                          <span>No published tests available. Please publish a test first.</span>
                        </div>
                      ) : (
                        tests.filter(test => test.status === 'published').map((test) => (
                          <label
                            key={test.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTestsForInstitute.includes(test.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTestsForInstitute([...selectedTestsForInstitute, test.id]);
                                } else {
                                  setSelectedTestsForInstitute(selectedTestsForInstitute.filter(id => id !== test.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-[#44448E] accent-[#44448E] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-slate-800 block truncate">{test.name}</span>
                              <span className="text-xs text-slate-400">{test.questions} questions</span>
                            </div>
                          </label>
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
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${
                  selectedTestsForInstitute.length > 0 && !isAssigningTestToInstitute
                    ? 'bg-[#44448E] hover:bg-[#383878] text-white shadow-xs hover:shadow active:scale-[0.99]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80'
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Currently Assigned Tests</h4>
                {assignedTests.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {assignedTests.length}
                  </span>
                )}
              </div>
              {selectedTestsForUnassign.length > 0 && (
                <button
                  onClick={handleBulkUnassignTests}
                  disabled={isUnassigningTests}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex items-center justify-center py-10 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <Loader2 className="animate-spin text-[#44448E]" size={24} />
                <span className="ml-2.5 text-xs font-medium text-slate-500">Loading assigned tests...</span>
              </div>
            ) : assignedTests.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <FileSpreadsheet size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No tests assigned yet</p>
                <p className="text-xs text-slate-500 mt-0.5">Use the selector above to assign tests to this institute.</p>
              </div>
            ) : (
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {/* Select All Checkbox Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedTestsForUnassign.length === assignedTests.length && assignedTests.length > 0}
                      onChange={toggleAllTestsForUnassign}
                      className="w-4 h-4 text-[#44448E] accent-[#44448E] rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedTestsForUnassign.length > 0 ? `${selectedTestsForUnassign.length} of ${assignedTests.length} selected` : 'Select All Tests'}
                    </span>
                  </label>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {assignedTests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${
                        selectedTestsForUnassign.includes(test.id)
                          ? 'bg-indigo-50/40'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedTestsForUnassign.includes(test.id)}
                          onChange={() => toggleTestForUnassign(test.id)}
                          className="w-4 h-4 text-[#44448E] accent-[#44448E] rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm text-slate-800 truncate">{test.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{test.question_count} questions</span>
                            <span className="text-slate-300">•</span>
                            <span>{test.duration_minutes} mins</span>
                            {test.is_institute_level && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-[#44448E] border border-indigo-100/80 rounded-full text-[10px] font-semibold">
                                  Institute Level
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignTest(test.id, test.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2 shrink-0"
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

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedTestsModal;
