import React, { Suspense, lazy } from 'react';
import {
  FileSpreadsheet, Plus, Trash2, CheckCircle, XCircle,
  MoreVertical, Eye, AlertCircle, Copy, Users, ChevronLeft, ChevronRight
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
  handleOpenCloneModal,
  handleViewTestDetails,
  setEditingTest,
  setShowCreateTest,
  handleTogglePublish,
  handleDeleteTest,
  setSelectedExamId,
  examCurrentPage,
  setExamCurrentPage,
  examTotalPages,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-start sm:items-center space-x-3">
            <div>
              <h2 className="text-2xl font-bold text-shnoor-navy flex items-center">
                <FileSpreadsheet className="mr-2 text-shnoor-indigo sm:size-7" size={24} />
                Exams
              </h2>
              <p className="text-xs sm:text-sm text-shnoor-indigoMedium mt-1">Manage all your exams and view results</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateTest(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg transition-colors shadow-[0_8px_30px_rgba(14,14,39,0.06)] font-semibold"
          >
            <Plus size={20} />
            <span>Create Test</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
            <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 text-shnoor-indigoMedium">
            <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
            <p className="font-medium">No exams found</p>
            <p className="text-sm mt-1">Click "Create Test" to add your first exam</p>
          </div>
        ) : (
          <>
            <Suspense fallback={<div className="h-12 bg-shnoor-lavender rounded-xl animate-pulse mb-4" />}>
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
              <div className="text-center py-12 text-shnoor-indigoMedium">
                <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
                <p className="font-medium">No exams match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {/* Bulk Actions Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-4 bg-white rounded-xl border border-shnoor-light space-y-3 sm:space-y-0">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                      onChange={toggleAllTests}
                      className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                    />
                    <span className="text-sm font-bold text-shnoor-indigo">
                      {selectedTests.length > 0 ? `${selectedTests.length} selected` : 'Select All'}
                    </span>
                  </label>
                  {selectedTests.length > 0 && (
                    <button
                      onClick={handleBulkDeleteTests}
                      className="w-full sm:w-auto px-4 py-2 bg-shnoor-danger hover:bg-shnoor-danger text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-white border border-shnoor-light rounded-xl p-6 hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] hover:border-shnoor-indigo transition-all group relative min-h-[400px] flex flex-col"
                    >
                      {/* Checkbox for selection */}
                      <div className="absolute top-4 left-4 z-10">
                        <label onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTests.includes(test.id)}
                            onChange={() => toggleTestSelection(test.id)}
                            className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Status Badge and 3-Dot Menu */}
                      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                        {test.status === 'published' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-successLight text-shnoor-success">
                            <CheckCircle size={12} className="mr-1" />
                            Published
                          </span>
                        ) : test.status === 'archived' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-dangerLight text-shnoor-danger">
                            <XCircle size={12} className="mr-1" />
                            Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-lavender opacity-80 text-shnoor-navy">
                            Draft
                          </span>
                        )}

                        {/* 3-Dot Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === test.id ? null : test.id);
                            }}
                            className="p-1.5 bg-shnoor-lavender opacity-80 hover:bg-shnoor-light text-shnoor-indigoMedium hover:text-shnoor-navy rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === test.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-shnoor-light rounded-lg shadow-[0_8px_30px_rgba(14,14,39,0.06)] z-50">
                              {test.status === 'draft' ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewQuestions(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors"
                                  >
                                    <Eye size={14} />
                                    <span>Preview Questions</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTestHistory(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                  >
                                    <AlertCircle size={14} />
                                    <span>Test History</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCloneModal(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                  >
                                    <Copy size={14} />
                                    <span>Clone Test</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTestDetails(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors"
                                  >
                                    <Eye size={14} />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewQuestions(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                  >
                                    <FileSpreadsheet size={14} />
                                    <span>Preview Questions</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTestHistory(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                  >
                                    <AlertCircle size={14} />
                                    <span>Test History</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCloneModal(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                  >
                                    <Copy size={14} />
                                    <span>Clone Test</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Header with Icon */}
                      <div className="mt-10 mb-4">
                        <div className="h-12 w-12 bg-shnoor-lavender rounded-lg flex items-center justify-center text-shnoor-indigo font-bold text-xl group-hover:bg-shnoor-indigo group-hover:text-white transition-colors">
                          {test.name.charAt(0)}
                        </div>
                      </div>

                      {/* Exam Title */}
                      <h3 className="font-bold text-shnoor-navy text-base md:text-lg mb-3 line-clamp-2 group-hover:text-shnoor-indigo transition-colors pr-2">
                        {test.name}
                      </h3>

                      {/* Exam Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-shnoor-indigoMedium flex-wrap">
                          <FileSpreadsheet size={16} className="mr-2 flex-shrink-0" />
                          <span className="break-words">{test.questions} Questions • {test.duration} mins</span>
                        </div>
                        <div className="flex items-center text-xs text-shnoor-indigoMedium">
                          <span>Created: {test.date}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-shnoor-light mb-4">
                        <div className="text-center p-2">
                          <div className="flex items-center justify-center mb-1">
                            <Users size={16} className="text-shnoor-indigoMedium mr-1 flex-shrink-0" />
                            <span className="text-lg font-bold text-shnoor-navy">{test.attempts}</span>
                          </div>
                          <p className="text-xs text-shnoor-indigoMedium">Attempted</p>
                        </div>
                        <div className="text-center p-2">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircle size={16} className="text-shnoor-success mr-1 flex-shrink-0" />
                            <span className="text-lg font-bold text-shnoor-success">{test.passedCount || 0}</span>
                          </div>
                          <p className="text-xs text-shnoor-indigoMedium">Passed ({test.passRate || 0}%)</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 pt-4 border-t border-shnoor-light mt-auto">
                        {test.status === 'draft' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTest(test);
                                setShowCreateTest(true);
                              }}
                              className="flex-1 py-2.5 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-navy hover:text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                              title="View Test"
                            >
                              <Eye size={18} className="mr-1 flex-shrink-0" />
                              <span className="truncate">View</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublish(test.id, test.status);
                              }}
                              className="flex-1 py-2.5 px-3 bg-shnoor-successLight text-shnoor-success hover:bg-shnoor-success hover:text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                              title="Publish Test"
                            >
                              <CheckCircle size={18} className="mr-1 flex-shrink-0" />
                              <span className="truncate">Publish</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTest(test.id);
                              }}
                              className="p-2.5 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Delete Test"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExamId(test.id);
                              }}
                              className="flex-1 py-2.5 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                              title="View Results"
                            >
                              <Eye size={18} className="mr-1 flex-shrink-0" />
                              <span className="truncate">View</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTest(test.id);
                              }}
                              className="p-2.5 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Delete Test"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {examTotalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                      onClick={() => setExamCurrentPage(p => Math.max(1, p - 1))}
                      disabled={examCurrentPage === 1}
                      className="p-2 bg-white border border-shnoor-light rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-shnoor-lavender transition-colors"
                    >
                      <ChevronLeft size={20} className="text-shnoor-indigo" />
                    </button>
                    <span className="text-sm text-shnoor-navy font-medium">
                      Page {examCurrentPage} of {examTotalPages}
                    </span>
                    <button
                      onClick={() => setExamCurrentPage(p => Math.min(examTotalPages, p + 1))}
                      disabled={examCurrentPage === examTotalPages}
                      className="p-2 bg-white border border-shnoor-light rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-shnoor-lavender transition-colors"
                    >
                      <ChevronRight size={20} className="text-shnoor-indigo" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExamsTab;
