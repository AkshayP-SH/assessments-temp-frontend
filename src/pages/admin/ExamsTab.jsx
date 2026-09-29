import React, { Suspense, lazy, useEffect } from 'react';
import {
  FileSpreadsheet, Plus, Trash2, CheckCircle2, CheckCircle,
  MoreVertical, Eye, Copy, Users, ChevronLeft, ChevronRight,
  FileText, BookOpen
} from 'lucide-react';

const ExamSearchFilter = lazy(() => import('../../components/ExamSearchFilter'));

const ExamsTab = ({
  loading,
  tests,
  filteredTests,
  paginatedTests,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  selectedTests,
  toggleAllTests,
  handleBulkDeleteTests,
  toggleTestSelection,
  openMenuId,
  setOpenMenuId,
  handlePreviewQuestions,
  handleViewTestHistory,
  handleViewJob,
  handleOpenCloneModal,
  handleViewTestDetails,
  setShowCreateTest,
  setEditingTest,
  handleTogglePublish,
  handleDeleteTest,
  setSelectedExamId,
  examCurrentPage,
  setExamCurrentPage,
  examTotalPages,
  examItemsPerPage = 9,
}) => {
  useEffect(() => {
    const handleWindowClick = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openMenuId, setOpenMenuId]);

  return (
    <div className="admin-exams-section">
      <div className="admin-exams-header">
        <div className="admin-exams-header-left">
          <h2 className="admin-exams-title">
            Exams
          </h2>
          <p className="admin-exams-subtitle">Manage all your exams and view results</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateTest(true)}
          className="admin-create-test-btn"
        >
          <Plus size={18} />
          <span>Create Test</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-shnoor-indigo"></div>
          <span className="ml-3 text-shnoor-indigoMedium font-medium">Loading exams...</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm text-shnoor-indigoMedium">
          <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
          <p className="font-bold text-lg text-shnoor-navy">No exams found</p>
          <p className="text-sm mt-1">Click "Create Test" to add your first exam</p>
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-12 bg-white rounded-xl animate-pulse mb-4" />}>
            <ExamSearchFilter
              initialSearchTerm={searchTerm}
              initialFilters={filters}
              initialSortBy={sortBy}
              onSearchChange={setSearchTerm}
              onFilterChange={setFilters}
              onSortChange={setSortBy}
              showPublishedFilter={true}
              showAttemptedFilter={true}
              resultCount={filteredTests.length}
              sortOptions={[
                { value: 'latest', label: 'Latest Created' },
                { value: 'oldest', label: 'Oldest Created' },
                { value: 'most-attempted', label: 'Most Attempted' },
                { value: 'duration-asc', label: 'Shortest Duration' },
                { value: 'duration-desc', label: 'Longest Duration' }
              ]}
            />
          </Suspense>

          {filteredTests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm text-shnoor-indigoMedium">
              <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
              <p className="font-medium">No exams match your filters</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Select All / Bulk Actions Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-3 bg-white rounded-xl border border-shnoor-mist space-y-2 sm:space-y-0 shadow-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedTests.length > 0 && selectedTests.length < filteredTests.length;
                    }}
                    onChange={toggleAllTests}
                    className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo cursor-pointer"
                  />
                  <span className="text-sm font-bold text-shnoor-navy">
                    Select All {selectedTests.length > 0 && `(${selectedTests.length} selected)`}
                  </span>
                </label>
                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteTests}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-shnoor-danger hover:bg-shnoor-danger text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-xs shadow-xs cursor-pointer"
                  >
                    <Trash2 size={15} />
                    <span>Delete {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>

              {/* Exam Cards Grid */}
              <div className="admin-exams-grid">
                {paginatedTests.map((test) => {
                  const attempts = test.attempts || 0;
                  const passedCount = test.passedCount ?? test.passed_count ?? test.passed ?? 0;
                  const passRate = test.passRate ?? (attempts > 0 ? Math.round((passedCount / attempts) * 100) : 0);
                  const initialLetter = test.name ? test.name.trim().charAt(0).toUpperCase() : 'F';
                  const formattedDate = test.date || (test.created_at ? new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 18, 2026');

                  return (
                    <div
                      key={test.id}
                      className="admin-exam-card"
                    >
                      {/* Top Bar: Checkbox & Badges */}
                      <div className="admin-exam-card-top">
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(test.id)}
                          onChange={() => toggleTestSelection(test.id)}
                          className="admin-exam-checkbox"
                          title="Select exam"
                        />

                        <div className="flex items-center gap-2">
                          <span className={test.status === 'published' ? 'admin-exam-status-published' : 'admin-exam-status-draft'}>
                            <CheckCircle2 size={13} />
                            <span>{test.status === 'published' ? 'Published' : test.status === 'archived' ? 'Archived' : 'Draft'}</span>
                          </span>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === test.id ? null : test.id);
                              }}
                              className="admin-exam-more-btn"
                              title="More options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMenuId === test.id && (
                              <div
                                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleViewTestDetails(test);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye size={14} className="text-gray-400" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handlePreviewQuestions(test);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText size={14} className="text-gray-400" />
                                  <span>Preview Questions</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenCloneModal(test);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy size={14} className="text-gray-400" />
                                  <span>Clone Test</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleViewTestHistory(test);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <BookOpen size={14} className="text-gray-400" />
                                  <span>Test History</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleTogglePublish(test.id, test.status);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle size={14} className="text-gray-400" />
                                  <span>{test.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Icon Avatar Initial Badge */}
                      <div className="admin-exam-avatar">
                        {initialLetter}
                      </div>

                      {/* Exam Title & Details */}
                      <div>
                        <h3 className="admin-exam-card-title truncate" title={test.name}>
                          {test.name}
                        </h3>
                        <div className="admin-exam-card-subtitle">
                          <FileText size={14} className="text-[#8F8FC4] flex-shrink-0" />
                          <span>{test.questions || test.total_questions || 0} Questions • {test.duration || 60} mins</span>
                        </div>
                        <p className="admin-exam-card-date">
                          Created: {formattedDate}
                        </p>
                      </div>

                      {/* Top Divider */}
                      <div className="admin-exam-divider" />

                      {/* Stats Section: Attempted & Passed */}
                      <div className="admin-exam-stats-grid">
                        <div>
                          <div className="admin-exam-stat-value">
                            <Users size={16} />
                            <span>{attempts}</span>
                          </div>
                          <span className="admin-exam-stat-label">Attempted</span>
                        </div>
                        <div>
                          <div className="admin-exam-stat-value admin-exam-stat-value-passed">
                            <CheckCircle2 size={16} />
                            <span>{passedCount}</span>
                          </div>
                          <span className="admin-exam-stat-label">Passed ({passRate}%)</span>
                        </div>
                      </div>

                      {/* Bottom Divider */}
                      <div className="admin-exam-divider" />

                      {/* Footer Actions: View Button & Trash Icon */}
                      <div className="admin-exam-card-footer">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExamId(test.id);
                          }}
                          className="admin-exam-view-btn"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTest(test.id);
                          }}
                          className="admin-exam-delete-btn"
                          title="Delete Exam"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {examTotalPages > 1 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-text">
                    Showing {filteredTests.length === 0 ? 0 : (examCurrentPage - 1) * examItemsPerPage + 1} – {Math.min(examCurrentPage * examItemsPerPage, filteredTests.length)} of {filteredTests.length} {filteredTests.length === 1 ? 'exam' : 'exams'}
                  </span>
                  <div className="admin-pagination-controls">
                    <button
                      type="button"
                      onClick={() => setExamCurrentPage(p => Math.max(1, p - 1))}
                      disabled={examCurrentPage === 1}
                      className="admin-pagination-btn"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: examTotalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setExamCurrentPage(pageNum)}
                        className={`admin-pagination-btn ${examCurrentPage === pageNum ? 'admin-pagination-btn-active' : ''}`}
                      >
                        {String(pageNum).padStart(2, '0')}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setExamCurrentPage(p => Math.min(examTotalPages, p + 1))}
                      disabled={examCurrentPage === examTotalPages}
                      className="admin-pagination-btn"
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExamsTab;
