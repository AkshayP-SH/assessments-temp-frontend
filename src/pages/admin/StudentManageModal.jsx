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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{selectedInstituteForStudents.display_name}</h3>
            <p className="text-shnoor-lavender text-sm mt-1">Manage Students</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Student Form */}
          {showAddStudentForm ? (
            <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-shnoor-navy">Add New Student</h4>
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="text-shnoor-indigoMedium hover:text-shnoor-indigo transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newStudentData.full_name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, full_name: e.target.value })}
                  className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                  className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                />
                <input
                  type="text"
                  placeholder="Roll Number (Optional)"
                  value={newStudentData.roll_number}
                  onChange={(e) => setNewStudentData({ ...newStudentData, roll_number: e.target.value })}
                  className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                />
                <input
                  type="text"
                  value={newStudentData.institute}
                  disabled
                  className="px-4 py-3 border border-shnoor-light rounded-xl bg-shnoor-lavender text-shnoor-indigoMedium"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddStudentForm(false)}
                  className="px-4 py-2 bg-shnoor-light hover:bg-shnoor-mist text-shnoor-navy rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${!isAddingStudent
                    ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                    : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                    }`}
                >
                  {isAddingStudent && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  <span>{isAddingStudent ? 'Adding...' : 'Add Student'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-shnoor-navy">Students List</h4>
                <div className="flex space-x-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shnoor-indigoMedium" size={16} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-48 pl-9 pr-3 py-2 text-sm border border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddStudentForm(true)}
                    className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Student</span>
                  </button>
                  {selectedStudentsForDelete.length > 0 && (
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete {selectedStudentsForDelete.length} Selected</span>
                    </button>
                  )}
                  {instituteStudentsForManagement.length > 0 && handleDeleteAllStudents && (
                    <button
                      onClick={handleDeleteAllStudents}
                      className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Test Assignment Section */}
              {selectedStudentsForDelete.length > 0 && (
                <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                  <h5 className="text-sm font-bold text-shnoor-navy mb-3">
                    Assign Test to {selectedStudentsForDelete.length} Selected Student{selectedStudentsForDelete.length !== 1 ? 's' : ''}
                  </h5>
                  <div className="relative space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsStudentTestDropdownOpen(!isStudentTestDropdownOpen)}
                      className="w-full px-4 py-3 border border-shnoor-light rounded-xl bg-white text-shnoor-navy font-medium transition-all flex items-center justify-between hover:border-shnoor-indigo focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo"
                    >
                      <span className={selectedTestsForStudentModal.length === 0 ? 'text-shnoor-indigoMedium' : 'text-shnoor-navy'}>
                        {selectedTestsForStudentModal.length === 0
                          ? '-- Select a test --'
                          : `${selectedTestsForStudentModal.length} test${selectedTestsForStudentModal.length !== 1 ? 's' : ''} selected`
                        }
                      </span>
                      <ChevronDown size={20} className={`transition-transform ${isStudentTestDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStudentTestDropdownOpen && (
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
                                  checked={selectedTestsForStudentModal.includes(test.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTestsForStudentModal([...selectedTestsForStudentModal, test.id]);
                                    } else {
                                      setSelectedTestsForStudentModal(selectedTestsForStudentModal.filter(id => id !== test.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                                />
                                <span className="text-sm font-medium text-shnoor-navy flex-1">
                                  {test.name} <span className="text-shnoor-indigoMedium">({test.questions} questions • {test.duration} mins)</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTestsForStudentModal.length > 0 && (
                      <p className="text-xs text-shnoor-indigo mt-2 font-medium">
                        {selectedTestsForStudentModal.length} test{selectedTestsForStudentModal.length !== 1 ? 's' : ''} selected
                      </p>
                    )}

                    <button
                      onClick={() => {
                        handleAssignTestInModal();
                        setIsStudentTestDropdownOpen(false);
                      }}
                      disabled={selectedTestsForStudentModal.length === 0 || isAssigningTestInModal}
                      className={`w-full px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${selectedTestsForStudentModal.length > 0 && !isAssigningTestInModal
                        ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                        : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                        }`}
                    >
                      {isAssigningTestInModal && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      <UserCheck size={18} />
                      <span>
                        {isAssigningTestInModal
                          ? 'Assigning...'
                          : selectedTestsForStudentModal.length > 0
                            ? `Assign ${selectedTestsForStudentModal.length} Test${selectedTestsForStudentModal.length !== 1 ? 's' : ''}`
                            : 'Select Tests to Assign'
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                <span className="ml-3 text-shnoor-indigoMedium">Loading students...</span>
              </div>
            ) : instituteStudentsForManagement.length === 0 ? (
              <div className="text-center py-8 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                <Users className="mx-auto mb-2 text-shnoor-mist" size={48} />
                <p className="text-shnoor-indigoMedium">No students found</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                <Search className="mx-auto mb-2 text-shnoor-mist" size={48} />
                <p className="text-shnoor-indigoMedium">No students match your search</p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedStudentsForDelete.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => toggleAllStudentsForDelete(filteredStudents)}
                      className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                    />
                    <span className="text-sm font-bold text-shnoor-indigo">
                      {selectedStudentsForDelete.length > 0 ? `${selectedStudentsForDelete.length} selected` : 'Select All'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-shnoor-indigoMedium">Select Range:</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-16 px-2 py-1 text-sm border border-shnoor-light rounded focus:ring-2 focus:ring-shnoor-lavender"
                      placeholder="1"
                      value={selectionRange.start}
                      onChange={(e) => setSelectionRange({ ...selectionRange, start: e.target.value })}
                    />
                    <span className="text-sm text-shnoor-indigoMedium">to</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredStudents.length}
                      className="w-16 px-2 py-1 text-sm border border-shnoor-light rounded focus:ring-2 focus:ring-shnoor-lavender"
                      placeholder={filteredStudents.length.toString()}
                      value={selectionRange.end}
                      onChange={(e) => setSelectionRange({ ...selectionRange, end: e.target.value })}
                    />
                    <button
                      onClick={handleSelectRange}
                      className="px-3 py-1 bg-shnoor-indigo hover:bg-shnoor-navy text-white text-sm rounded transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student, index) => (
                    <div key={student.id}>
                      <div
                        className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all ${selectedStudentsForDelete.includes(student.id)
                          ? 'bg-shnoor-lavender border-shnoor-indigo'
                          : 'bg-white border-shnoor-light'
                          }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-sm font-bold text-shnoor-indigo w-6">{index + 1}.</span>
                          <input
                            type="checkbox"
                            checked={selectedStudentsForDelete.includes(student.id)}
                            onChange={() => toggleStudentForDelete(student.id)}
                            className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                          />
                          <div className="flex-1">
                            <h5 className="font-bold text-shnoor-navy">{student.full_name}</h5>
                            <p className="text-sm text-shnoor-indigoMedium">
                              {student.email} • {student.roll_number || 'No roll number'}
                              {student.assigned_tests_count > 0 && (
                                <button
                                  onClick={() => toggleStudentTests(student)}
                                  className="ml-2 text-xs text-shnoor-indigo hover:text-shnoor-navy font-medium underline"
                                >
                                  ({student.assigned_tests_count} test{student.assigned_tests_count !== 1 ? 's' : ''} assigned)
                                </button>
                              )}
                              {student.assigned_tests_count === 0 && (
                                <span className="ml-2 text-xs text-shnoor-soft">
                                  (0 tests assigned)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {student.assigned_tests_count > 0 && (
                            <button
                              onClick={() => toggleStudentTests(student)}
                              className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
                              title="View Assigned Tests"
                            >
                              <ChevronDown
                                size={18}
                                className={`transition-transform ${expandedStudentTests[student.id] ? 'rotate-180' : ''}`}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.full_name)}
                            className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Tests Dropdown */}
                      {expandedStudentTests[student.id] && (
                        <div className="ml-12 mr-4 mt-2 mb-2 p-4 bg-shnoor-lavender rounded-lg border border-shnoor-light">
                          {expandedStudentTests[student.id].loading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="animate-spin text-shnoor-indigo" size={20} />
                              <span className="ml-2 text-sm text-shnoor-indigoMedium">Loading tests...</span>
                            </div>
                          ) : expandedStudentTests[student.id].tests.length === 0 ? (
                            <div className="text-center py-4">
                              <FileSpreadsheet className="mx-auto mb-2 text-shnoor-mist" size={32} />
                              <p className="text-sm text-shnoor-indigoMedium">No tests assigned</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <h6 className="text-xs font-bold text-shnoor-navy mb-2">Assigned Tests:</h6>
                              {expandedStudentTests[student.id].tests.map((test) => (
                                <div
                                  key={test.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-shnoor-light hover:shadow-sm transition-all"
                                >
                                  <div className="flex-1">
                                    <h6 className="text-sm font-semibold text-shnoor-navy">{test.title}</h6>
                                    <p className="text-xs text-shnoor-indigoMedium">
                                      {test.question_count} questions • {test.duration_minutes} mins
                                      {test.status && (
                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${test.status === 'completed'
                                          ? 'bg-green-100 text-green-700'
                                          : test.status === 'in_progress'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-blue-100 text-blue-700'
                                          }`}>
                                          {test.status === 'completed' ? 'Completed' : test.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleUnassignTestFromStudent(student.id, test.id, test.title, student.full_name)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Unassign Test"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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

export default StudentManageModal;
