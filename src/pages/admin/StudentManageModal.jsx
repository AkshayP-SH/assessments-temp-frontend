import React from 'react';
import { X, Search, Plus, Trash2, ChevronDown, UserCheck, Users, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="bg-[#44448E] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{selectedInstituteForStudents.display_name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Manage Students</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Student Form */}
          {showAddStudentForm ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Student</h4>
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
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
                  className="px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] bg-white text-slate-800 text-sm shadow-xs transition-all"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] bg-white text-slate-800 text-sm shadow-xs transition-all"
                />
                <input
                  type="text"
                  placeholder="Roll Number (Optional)"
                  value={newStudentData.roll_number}
                  onChange={(e) => setNewStudentData({ ...newStudentData, roll_number: e.target.value })}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] bg-white text-slate-800 text-sm shadow-xs transition-all"
                />
                <input
                  type="text"
                  value={newStudentData.institute}
                  disabled
                  className="px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="btn-secondary !text-xs !py-1.5 !px-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#44448E] hover:bg-[#383878] text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
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
                  <h4 className="text-sm font-bold text-slate-900">Students List</h4>
                  {instituteStudentsForManagement.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
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
                      className="w-56 pl-10 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] bg-white text-slate-800 shadow-2xs transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddStudentForm(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#44448E] hover:bg-[#383878] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Student</span>
                  </button>
                  {selectedStudentsForDelete.length > 0 && (
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Delete ({selectedStudentsForDelete.length})</span>
                    </button>
                  )}
                  {instituteStudentsForManagement.length > 0 && handleDeleteAllStudents && (
                    <button
                      onClick={handleDeleteAllStudents}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-medium transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Delete All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Test Assignment Section */}
              {selectedStudentsForDelete.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Assign Test to {selectedStudentsForDelete.length} Selected Student{selectedStudentsForDelete.length !== 1 ? 's' : ''}
                    </h5>
                    {selectedTestsForStudentModal.length > 0 && (
                      <span className="text-xs font-semibold text-[#44448E] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {selectedTestsForStudentModal.length} selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() => setIsStudentTestDropdownOpen(!isStudentTestDropdownOpen)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm font-medium transition-all flex items-center justify-between hover:border-[#44448E] focus:outline-none focus:ring-2 focus:ring-[#44448E]/15 focus:border-[#44448E] shadow-2xs"
                      >
                        <span className={selectedTestsForStudentModal.length === 0 ? 'text-slate-400 font-normal' : 'text-slate-800 font-medium'}>
                          {selectedTestsForStudentModal.length === 0
                            ? 'Choose tests to assign...'
                            : `${selectedTestsForStudentModal.length} test${selectedTestsForStudentModal.length !== 1 ? 's' : ''} chosen`
                          }
                        </span>
                        <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${isStudentTestDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isStudentTestDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsStudentTestDropdownOpen(false)}
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
                                    checked={selectedTestsForStudentModal.includes(test.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTestsForStudentModal([...selectedTestsForStudentModal, test.id]);
                                      } else {
                                        setSelectedTestsForStudentModal(selectedTestsForStudentModal.filter(id => id !== test.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-[#44448E] accent-[#44448E] cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-slate-800 block truncate">{test.name}</span>
                                    <span className="text-xs text-slate-400">{test.questions} questions • {test.duration} mins</span>
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
                        handleAssignTestInModal();
                        setIsStudentTestDropdownOpen(false);
                      }}
                      disabled={selectedTestsForStudentModal.length === 0 || isAssigningTestInModal}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${
                        selectedTestsForStudentModal.length > 0 && !isAssigningTestInModal
                          ? 'bg-[#44448E] hover:bg-[#383878] text-white shadow-xs hover:shadow active:scale-[0.99]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80'
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
              <div className="flex items-center justify-center py-10 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <Loader2 className="animate-spin text-[#44448E]" size={24} />
                <span className="ml-2.5 text-xs font-medium text-slate-500">Loading students...</span>
              </div>
            ) : instituteStudentsForManagement.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Users size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No students found</p>
                <p className="text-xs text-slate-500 mt-0.5">Add students using the button above or upload in bulk.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Search size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No students match your search</p>
                <p className="text-xs text-slate-500 mt-0.5">Try searching with a different name or roll number.</p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/90 border border-slate-200/80 rounded-xl mb-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedStudentsForDelete.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => toggleAllStudentsForDelete(filteredStudents)}
                      className="w-4 h-4 text-[#44448E] accent-[#44448E] rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedStudentsForDelete.length > 0 ? `${selectedStudentsForDelete.length} of ${filteredStudents.length} selected` : 'Select All Students'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                    <span className="font-medium text-slate-600">Select Range:</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#44448E] bg-slate-50 text-slate-800 text-center font-medium"
                      placeholder="1"
                      value={selectionRange.start}
                      onChange={(e) => setSelectionRange({ ...selectionRange, start: e.target.value })}
                    />
                    <span className="text-slate-400 text-[11px]">to</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-12 px-1.5 py-0.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-[#44448E] bg-slate-50 text-slate-800 text-center font-medium"
                      placeholder={filteredStudents.length.toString()}
                      value={selectionRange.end}
                      onChange={(e) => setSelectionRange({ ...selectionRange, end: e.target.value })}
                    />
                    <button
                      onClick={handleSelectRange}
                      className="ml-1 px-2.5 py-0.5 bg-[#44448E] hover:bg-[#383878] text-white text-[11px] font-semibold rounded transition-colors shadow-2xs"
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
                          ? 'bg-indigo-50/30 border-[#44448E]/40 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedStudentsForDelete.includes(student.id)}
                            onChange={() => toggleStudentForDelete(student.id)}
                            className="w-4 h-4 text-[#44448E] accent-[#44448E] rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-semibold text-sm text-slate-900 truncate">{student.full_name}</h5>
                              {student.roll_number && (
                                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                  {student.roll_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{student.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          {student.assigned_tests_count > 0 ? (
                            <button
                              onClick={() => toggleStudentTests(student)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                expandedStudentTests[student.id]
                                  ? 'bg-[#44448E] text-white shadow-2xs'
                                  : 'bg-indigo-50 hover:bg-indigo-100/80 text-[#44448E] border border-indigo-100'
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
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Tests View */}
                      {expandedStudentTests[student.id] && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/60">
                          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Assigned Tests</h6>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {expandedStudentTests[student.id].tests?.length || 0} total
                              </span>
                            </div>

                            {expandedStudentTests[student.id].loading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="animate-spin text-[#44448E]" size={18} />
                                <span className="ml-2 text-xs text-slate-500">Loading tests...</span>
                              </div>
                            ) : expandedStudentTests[student.id].tests?.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-3">No tests assigned</p>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {expandedStudentTests[student.id].tests.map((test) => (
                                  <div
                                    key={test.id}
                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors"
                                  >
                                    <div className="flex-1 min-w-0 pr-3">
                                      <span className="text-xs font-semibold text-slate-800 truncate block">{test.title}</span>
                                      <span className="text-[11px] text-slate-500">
                                        {test.question_count} questions • {test.duration_minutes} mins
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {test.status && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                          test.status === 'completed'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                            : test.status === 'in_progress'
                                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                              : 'bg-slate-100 text-slate-600 border-slate-200/80'
                                        }`}>
                                          {test.status === 'completed' ? 'Completed' : test.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleUnassignTestFromStudent(student.id, test.id, test.title, student.full_name)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

export default StudentManageModal;
