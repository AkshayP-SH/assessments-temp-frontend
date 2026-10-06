import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  FileSpreadsheet, Plus, Trash2, CheckCircle2,
  MoreVertical, Eye, Copy, Users, ChevronLeft, ChevronRight,
  FileText, BookOpen, Edit2, BarChart2, AlertCircle, Loader2, X, Clock, Calendar
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
  const [testToDelete, setTestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleWindowClick = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openMenuId, setOpenMenuId]);

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      setIsDeleting(true);
      await handleDeleteTest(testToDelete.id);
      setTestToDelete(null);
    } catch (error) {
      console.error('Error deleting test:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="section-header mb-6">
        <div className="section-header-left">
          <h2 className="section-title">Exams</h2>
          <p className="section-subtitle">Manage all your exams and view results</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateTest(true)}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] active:scale-98 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} />
          <span>Create Test</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#403f75] border-t-transparent"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300 font-semibold text-sm">Loading exams...</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs text-slate-500 dark:text-slate-400">
          <FileSpreadsheet className="mx-auto mb-3 text-slate-400" size={48} />
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100">No exams found</p>
          <p className="text-sm mt-1">Click "Create Test" to add your first exam</p>
        </div>
      ) : (
        <>
          {/* Search, Filter and Bulk Controls */}
          <div className="mb-5 space-y-3">
            <Suspense fallback={<div className="h-12 bg-white dark:bg-[#1E1E38] rounded-xl animate-pulse" />}>
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

            {/* Quick Bulk Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#1E1E38]/90 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedTests.length > 0 && selectedTests.length < filteredTests.length;
                  }}
                  onChange={toggleAllTests}
                  className="w-4 h-4 text-[#403f75] border-slate-300 rounded focus:ring-2 focus:ring-[#403f75] cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Select All {selectedTests.length > 0 && <span className="text-[#403f75] font-bold">({selectedTests.length} selected)</span>}
                </span>
              </label>

              {selectedTests.length > 0 ? (
                <button
                  type="button"
                  onClick={handleBulkDeleteTests}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete ({selectedTests.length})</span>
                </button>
              ) : (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Showing {filteredTests.length} {filteredTests.length === 1 ? 'exam' : 'exams'}
                </span>
              )}
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs text-slate-500">
              <FileSpreadsheet className="mx-auto mb-3 text-slate-400" size={44} />
              <p className="font-bold text-base text-slate-800 dark:text-slate-100">No exams match your search or filter</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your keywords or clearing filters</p>
            </div>
          ) : (
            <>
              {/* Modern Admin Exam Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {paginatedTests.map((test) => {
                  const attempts = test.attempts || 0;
                  const passedCount = test.passedCount ?? test.passed_count ?? test.passed ?? 0;
                  const passRate = test.passRate ?? (attempts > 0 ? Math.round((passedCount / attempts) * 100) : 0);
                  const formattedDate = test.date || (test.created_at ? new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 18, 2026');
                  const isPublished = test.status === 'published';

                  // Card top accent indicator and border in uniform blue/indigo
                  const topAccentGradient = 'from-[#403f75] via-indigo-500 to-[#57569b]';
                  const cardBorder = 'border border-indigo-100/90 dark:border-slate-800 hover:border-[#403f75]/60 dark:hover:border-indigo-500/50';

                  return (
                    <div
                      key={test.id}
                      className={`bg-white dark:bg-[#1A1A32] ${cardBorder} rounded-2xl shadow-[0_2px_12px_rgba(14,14,39,0.04)] hover:shadow-[0_12px_28px_rgba(64,63,117,0.12)] transition-all duration-200 flex flex-col justify-between group relative min-h-[310px] h-full overflow-hidden`}
                    >
                      {/* Top color accent strip (3-4px) */}
                      <div className={`h-[3.5px] w-full bg-gradient-to-r ${topAccentGradient}`} />

                      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                        {/* Top Header Row */}
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-3.5">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedTests.includes(test.id)}
                                onChange={() => toggleTestSelection(test.id)}
                                className="w-4 h-4 text-[#403f75] border-slate-300 rounded focus:ring-2 focus:ring-[#403f75] cursor-pointer"
                                title="Select exam"
                              />
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#403f75] dark:text-indigo-300 flex items-center justify-center flex-shrink-0 border border-indigo-100/80 dark:border-indigo-900/60 shadow-2xs">
                                <FileSpreadsheet size={18} />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isPublished
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60'
                                  }`}
                              >
                                <CheckCircle2 size={13} className={isPublished ? 'text-emerald-600' : 'text-amber-500'} />
                                <span>{isPublished ? 'Published' : test.status === 'archived' ? 'Archived' : 'Draft'}</span>
                              </span>

                              {/* 3 Dots Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === test.id ? null : test.id);
                                  }}
                                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                  title="More options"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {openMenuId === test.id && (
                                  <div
                                    className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#252548] rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isPublished && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleViewTestDetails(test);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                      >
                                        <FileText size={14} className="text-slate-400" />
                                        <span>View Details</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handlePreviewQuestions(test);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Eye size={14} className="text-slate-400" />
                                      <span>Preview Questions</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleOpenCloneModal(test);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy size={14} className="text-slate-400" />
                                      <span>Clone Test</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleViewTestHistory(test);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                                    >
                                      <BookOpen size={14} className="text-slate-400" />
                                      <span>Test History</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Title & Metadata */}
                          <div className="space-y-2">
                            <h3
                              className="font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug break-words group-hover:text-[#403f75] dark:group-hover:text-indigo-300 transition-colors"
                              title={test.name}
                            >
                              {test.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 pt-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 text-[#403f75] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                                <FileText size={13} className="text-[#403f75] dark:text-indigo-400 flex-shrink-0" />
                                <span>{test.questions || test.total_questions || 0} Questions</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                <Clock size={13} className="text-slate-500 flex-shrink-0" />
                                <span>{test.duration || 60} mins</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1 flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                              <span>Created: {formattedDate}</span>
                            </p>
                          </div>
                        </div>

                        {/* Stats Section */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="grid grid-cols-2 gap-2.5 bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-3 sm:p-3.5 border border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-[#403f75] dark:text-indigo-400 shadow-2xs flex-shrink-0">
                                <Users size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">{attempts}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Attempted</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs flex-shrink-0">
                                <CheckCircle2 size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight truncate">{passedCount} ({passRate}%)</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Passed</p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center gap-2.5 mt-3.5 sm:mt-4 h-10 sm:h-11">
                            {isPublished ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExamId(test.id);
                                }}
                                className="h-full flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[#403f75]/20 cursor-pointer"
                              >
                                <BarChart2 size={15} />
                                <span>Results</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTest(test);
                                    setShowCreateTest(true);
                                  }}
                                  className="h-full flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-[#1E1E38] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-[#403f75] dark:hover:text-indigo-300 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer border border-slate-200/90 dark:border-slate-700 hover:border-indigo-200/80 shadow-2xs"
                                >
                                  <Edit2 size={14} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublish(test.id, test.status);
                                  }}
                                  className="btn-publish h-full flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[#403f75]/20 cursor-pointer"
                                >
                                  <CheckCircle2 size={14} className="text-white" />
                                  <span>Publish</span>
                                </button>
                              </>
                            )}

                            {/* Delete Button with high-visibility hover state */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTestToDelete(test);
                              }}
                              className="h-full w-10 sm:w-11 rounded-xl text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/60 border border-slate-200/80 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs group/del active:scale-95 flex-shrink-0"
                              title="Delete Exam"
                              aria-label={`Delete ${test.name}`}
                            >
                              <Trash2 size={16} className="transition-transform group-hover/del:scale-110 text-slate-400 group-hover/del:text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              })}
              </div>

              {/* Pagination */}
              {examTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2 py-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {filteredTests.length === 0 ? 0 : (examCurrentPage - 1) * examItemsPerPage + 1} – {Math.min(examCurrentPage * examItemsPerPage, filteredTests.length)} of {filteredTests.length} exams
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExamCurrentPage(p => Math.max(1, p - 1))}
                      disabled={examCurrentPage === 1}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] hover:bg-slate-50 dark:hover:bg-[#25254A] text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: examTotalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setExamCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg border text-xs font-bold cursor-pointer transition-all ${examCurrentPage === pageNum
                          ? 'bg-[#403f75] dark:bg-indigo-600 text-white border-[#403f75] dark:border-indigo-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] hover:bg-slate-50 dark:hover:bg-[#25254A] text-slate-700 dark:text-slate-200'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setExamCurrentPage(p => Math.min(examTotalPages, p + 1))}
                      disabled={examCurrentPage === examTotalPages}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] hover:bg-slate-50 dark:hover:bg-[#25254A] text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {testToDelete && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setTestToDelete(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 border border-red-100 dark:border-red-900/60 shadow-xs">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    Delete Exam
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white break-words">"{testToDelete.name}"</span>?
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-3 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/60 leading-relaxed">
                    This action cannot be undone. All questions, student attempts, and results for this exam will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTestToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTest}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 cursor-pointer disabled:opacity-50 min-w-[120px]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Exam</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsTab;


