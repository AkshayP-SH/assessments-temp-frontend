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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{selectedInstituteForTests.display_name}</h3>
            <p className="text-shnoor-lavender text-sm mt-1">Assigned Tests</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Assign New Test */}
          <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
            <label className="block text-sm font-bold text-shnoor-navy mb-3">
              Assign New Test to Institute
            </label>
            <div className="relative space-y-3">
              {/* Custom Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsInstituteTestDropdownOpen(!isInstituteTestDropdownOpen)}
                className="w-full px-4 py-3 border border-shnoor-light rounded-xl bg-white text-shnoor-navy font-medium transition-all flex items-center justify-between hover:border-shnoor-indigo focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo"
              >
                <span className={selectedTestsForInstitute.length === 0 ? 'text-shnoor-indigoMedium' : 'text-shnoor-navy'}>
                  {selectedTestsForInstitute.length === 0
                    ? '-- Select a test --'
                    : `${selectedTestsForInstitute.length} test${selectedTestsForInstitute.length !== 1 ? 's' : ''} selected`
                  }
                </span>
                <ChevronDown size={20} className={`transition-transform ${isInstituteTestDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu with Checkboxes */}
              {isInstituteTestDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-shnoor-light rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {tests.filter(test => test.status === 'published').length === 0 ? (
                    <div className="p-4 text-center text-shnoor-indigoMedium text-sm flex items-center justify-center">
                      <AlertCircle size={16} className="mr-1" />
                      No published tests available. Please publish a test first.
                    </div>
                  ) : (
                    <div className="py-2">
                      {tests.filter(test => test.status === 'published').map((test) => (
                        <label
                          key={test.id}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-shnoor-lavender cursor-pointer transition-colors"
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
                            className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                          />
                          <span className="text-sm font-medium text-shnoor-navy flex-1">
                            {test.name} <span className="text-shnoor-indigoMedium">({test.questions} questions)</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected tests count */}
              {selectedTestsForInstitute.length > 0 && (
                <p className="text-xs text-shnoor-indigo mt-2 font-medium">
                  {selectedTestsForInstitute.length} test{selectedTestsForInstitute.length !== 1 ? 's' : ''} selected
                </p>
              )}

              <button
                onClick={() => {
                  handleAssignTestToInstitute();
                  setIsInstituteTestDropdownOpen(false);
                }}
                disabled={selectedTestsForInstitute.length === 0 || isAssigningTestToInstitute}
                className={`w-full px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${selectedTestsForInstitute.length > 0 && !isAssigningTestToInstitute
                  ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                  : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                  }`}
              >
                {isAssigningTestToInstitute && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                <span>
                  {isAssigningTestToInstitute
                    ? 'Assigning...'
                    : selectedTestsForInstitute.length > 0
                      ? `Assign ${selectedTestsForInstitute.length} Test${selectedTestsForInstitute.length !== 1 ? 's' : ''}`
                      : 'Select Tests to Assign'
                  }
                </span>
              </button>
            </div>
          </div>

          {/* Assigned Tests List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-shnoor-navy">Currently Assigned Tests</h4>
              {selectedTestsForUnassign.length > 0 && (
                <button
                  onClick={handleBulkUnassignTests}
                  disabled={isUnassigningTests}
                  className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnassigningTests ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Unassigning...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Unassign {selectedTestsForUnassign.length} Selected</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {isLoadingAssignedTests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
              </div>
            ) : assignedTests.length === 0 ? (
              <div className="text-center py-8 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                <FileSpreadsheet className="mx-auto mb-2 text-shnoor-mist" size={48} />
                <p className="text-shnoor-indigoMedium">No tests assigned yet</p>
              </div>
            ) : (
              <>
                {/* Select All Checkbox */}
                <div className="flex items-center space-x-3 mb-3 p-3 bg-white rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedTestsForUnassign.length === assignedTests.length && assignedTests.length > 0}
                    onChange={toggleAllTestsForUnassign}
                    className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                  />
                  <span className="text-sm font-bold text-shnoor-indigo">
                    {selectedTestsForUnassign.length > 0 ? `${selectedTestsForUnassign.length} selected` : 'Select All'}
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assignedTests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all ${selectedTestsForUnassign.includes(test.id)
                        ? 'bg-shnoor-lavender border-shnoor-indigo'
                        : 'bg-white border-shnoor-light'
                        }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedTestsForUnassign.includes(test.id)}
                          onChange={() => toggleTestForUnassign(test.id)}
                          className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                        />
                        <div className="flex-1">
                          <h5 className="font-bold text-shnoor-navy">{test.title}</h5>
                          <p className="text-sm text-shnoor-indigoMedium">
                            {test.question_count} questions • {test.duration_minutes} mins
                            {test.is_institute_level && (
                              <span className="ml-2 px-2 py-0.5 bg-shnoor-lavender text-shnoor-indigo rounded text-xs font-medium">
                                Institute Level
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignTest(test.id, test.title)}
                        className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
                        title="Unassign Test"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-shnoor-light flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-mist text-shnoor-navy rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedTestsModal;
