import React from 'react';
import { X, Search, Plus, Trash2, ChevronDown, UserCheck, Users, Loader2, AlertCircle } from 'lucide-react';

const StudentManageModal = ({
  selectedInstituteForStudents,
  isLoadingStudentsForManagement,
  instituteStudentsForManagement,
  studentSearchTerm,
  setStudentSearchTerm,
  showAddStudentForm,
  setShowAddStudentForm,
  newStudentData,
  setNewStudentData,
  isAddingStudent,
  handleAddStudent,
  selectedStudentsForDelete,
  toggleStudentForDelete,
  toggleAllStudentsForDelete,
  selectionRange,
  setSelectionRange,
  handleSelectRange,
  handleBulkDeleteStudents,
  handleDeleteAllStudents,
  tests,
  selectedTestsForStudentModal,
  setSelectedTestsForStudentModal,
  isStudentTestDropdownOpen,
  setIsStudentTestDropdownOpen,
  isAssigningTestInModal,
  handleAssignTestInModal,
  expandedStudentTests,
  toggleStudentTests,
  handleUnassignTestFromStudent,
  handleDeleteStudent,
  onClose,
}) => {
  const filteredStudents = instituteStudentsForManagement.filter(student => {
    if (!studentSearchTerm) return true;
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.roll_number?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="bg-[#403f75] dark:bg-indigo-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{selectedInstituteForStudents.display_name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Manage Students</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Student Form */}
          {showAddStudentForm ? (
            <div className="bg-slate-50 dark:bg-[#232348] border border-slate-200 dark:border-slate-700 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Add New Student</h4>
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newStudentData.full_name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, full_name: e.target.value })}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 focus:border-[#403f75] bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 text-sm shadow-xs transition-all"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 focus:border-[#403f75] bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 text-sm shadow-xs transition-all"
                />
                <input
                  type="text"
                  placeholder="Roll Number (Optional)"
                  value={newStudentData.roll_number}
                  onChange={(e) => setNewStudentData({ ...newStudentData, roll_number: e.target.value })}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 focus:border-[#403f75] bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 text-sm shadow-xs transition-all"
                />
                <input
                  type="text"
                  value={newStudentData.institute}
                  disabled
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-[#181830] text-slate-500 dark:text-slate-400 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#25254A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#303060] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAddingStudent && (
                    <Loader2 className="animate-spin" size={13} />
                  )}
                  <span>{isAddingStudent ? 'Adding...' : 'Add Student'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Students List</h4>
                  {instituteStudentsForManagement.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-full">
                      {instituteStudentsForManagement.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-56 pl-10 pr-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 focus:border-[#403f75] bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddStudentForm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Student</span>
                  </button>
                  {selectedStudentsForDelete.length > 0 && (
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete ({selectedStudentsForDelete.length})</span>
                    </button>
                  )}
                  {instituteStudentsForManagement.length > 0 && handleDeleteAllStudents && (
                    <button
                      onClick={handleDeleteAllStudents}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Test Assignment Section */}
              {selectedStudentsForDelete.length > 0 && (
                <div className="bg-slate-50 dark:bg-[#232348] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Assign Test to {selectedStudentsForDelete.length} Selected Student{selectedStudentsForDelete.length !== 1 ? 's' : ''}
                    </h5>
                    {selectedTestsForStudentModal.length > 0 && (
                      <span className="text-xs font-semibold text-[#403f75] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded-full">
                        {selectedTestsForStudentModal.length} selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() => setIsStudentTestDropdownOpen(!isStudentTestDropdownOpen)}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1E1E38] text-slate-800 dark:text-slate-100 text-sm font-medium transition-all flex items-center justify-between hover:border-[#403f75] dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#403f75]/15 shadow-2xs cursor-pointer"
                      >
                        <span className={selectedTestsForStudentModal.length === 0 ? 'text-slate-400 dark:text-slate-400 font-normal' : 'text-slate-800 dark:text-white font-semibold'}>
                          {selectedTestsForStudentModal.length === 0
                            ? 'Choose tests to assign...'
                            : `${selectedTestsForStudentModal.length} test${selectedTestsForStudentModal.length !== 1 ? 's' : ''} chosen`
                          }
                        </span>
                        <ChevronDown size={18} className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isStudentTestDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isStudentTestDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsStudentTestDropdownOpen(false)}
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
                                    if (selectedTestsForStudentModal.includes(test.id)) {
                                      setSelectedTestsForStudentModal(selectedTestsForStudentModal.filter(id => id !== test.id));
                                    } else {
                                      setSelectedTestsForStudentModal([...selectedTestsForStudentModal, test.id]);
                                    }
                                    setIsStudentTestDropdownOpen(false);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedTestsForStudentModal.includes(test.id)}
                                    readOnly
                                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block truncate">{test.name}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{test.questions} questions • {test.duration} mins</span>
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
                        handleAssignTestInModal();
                        setIsStudentTestDropdownOpen(false);
                      }}
                      disabled={selectedTestsForStudentModal.length === 0 || isAssigningTestInModal}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                        selectedTestsForStudentModal.length > 0 && !isAssigningTestInModal
                          ? 'bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-xs hover:shadow active:scale-[0.99]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {isAssigningTestInModal ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <UserCheck size={16} />
                      )}
                      <span>
                        {isAssigningTestInModal
                          ? 'Assigning...'
                          : selectedTestsForStudentModal.length > 0
                            ? `Assign (${selectedTestsForStudentModal.length})`
                            : 'Assign Test'
                        }
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students List */}
          <div>
            {isLoadingStudentsForManagement ? (
              <div className="flex items-center justify-center py-10 bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                <span className="ml-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">Loading students...</span>
              </div>
            ) : instituteStudentsForManagement.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Users size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No students found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add students using the button above or upload in bulk.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-[#232348] border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Search size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No students match your search</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try searching with a different name or roll number.</p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/90 dark:bg-[#25254A] border border-slate-200/80 dark:border-slate-700 rounded-xl mb-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedStudentsForDelete.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => toggleAllStudentsForDelete(filteredStudents)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedStudentsForDelete.length > 0 ? `${selectedStudentsForDelete.length} of ${filteredStudents.length} selected` : 'Select All Students'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Select Range:</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-[#403f75] dark:focus:border-indigo-500 bg-slate-50 dark:bg-[#25254A] text-slate-900 dark:text-white text-center font-bold"
                      placeholder="1"
                      value={selectionRange.start}
                      onChange={(e) => setSelectionRange({ ...selectionRange, start: e.target.value })}
                    />
                    <span className="text-slate-400 text-[11px]">to</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-[#403f75] dark:focus:border-indigo-500 bg-slate-50 dark:bg-[#25254A] text-slate-900 dark:text-white text-center font-bold"
                      placeholder={filteredStudents.length.toString()}
                      value={selectionRange.end}
                      onChange={(e) => setSelectionRange({ ...selectionRange, end: e.target.value })}
                    />
                    <button
                      onClick={() => handleSelectRange(filteredStudents)}
                      className="ml-1 px-2.5 py-0.5 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-[11px] font-bold rounded transition-colors shadow-2xs cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
                  {filteredStudents.map((student, index) => (
                    <div
                      key={student.id}
                      className={`border rounded-2xl transition-all overflow-hidden ${
                        selectedStudentsForDelete.includes(student.id)
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/30 border-[#403f75]/40 dark:border-indigo-500/50 shadow-xs'
                          : 'bg-white dark:bg-[#1E1E38] border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                            {index + 1}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedStudentsForDelete.includes(student.id)}
                            onChange={() => toggleStudentForDelete(student.id)}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">{student.full_name}</h5>
                              {student.roll_number && (
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md">
                                  {student.roll_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{student.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          {student.assigned_tests_count > 0 ? (
                            <button
                              onClick={() => toggleStudentTests(student)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                expandedStudentTests[student.id]
                                  ? 'bg-[#403f75] dark:bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-[#403f75] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60'
                              }`}
                            >
                              <span>{student.assigned_tests_count} test{student.assigned_tests_count !== 1 ? 's' : ''} assigned</span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${expandedStudentTests[student.id] ? 'rotate-180' : ''}`}
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 px-2.5 py-1">0 tests</span>
                          )}

                          <button
                            onClick={() => handleDeleteStudent(student.id, student.full_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Tests View */}
                      {expandedStudentTests[student.id] && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#181830]">
                          <div className="bg-white dark:bg-[#232348] rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Assigned Tests</h6>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {expandedStudentTests[student.id].tests?.length || 0} total
                              </span>
                            </div>

                            {expandedStudentTests[student.id].loading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={18} />
                                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">Loading tests...</span>
                              </div>
                            ) : expandedStudentTests[student.id].tests?.length === 0 ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">No tests assigned</p>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {expandedStudentTests[student.id].tests.map((test) => (
                                  <div
                                    key={test.id}
                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/80 dark:hover:bg-[#2A2A54] rounded-lg transition-colors"
                                  >
                                    <div className="flex-1 min-w-0 pr-3">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">{test.title}</span>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {test.question_count} questions • {test.duration_minutes} mins
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {test.status && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                          test.status === 'completed'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                                            : test.status === 'in_progress'
                                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                                        }`}>
                                          {test.status === 'completed' ? 'Completed' : test.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleUnassignTestFromStudent(student.id, test.id, test.title, student.full_name)}
                                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                        title="Unassign Test"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
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

export default StudentManageModal;
