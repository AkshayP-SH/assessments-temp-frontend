import React, { useMemo } from 'react';
import {
  ArrowLeft, FileSpreadsheet, Download, CheckSquare, ChevronDown,
  CheckCircle, XCircle, X, Users, MessageSquare, Filter, Video,
  ChevronLeft, ChevronRight, Loader2, TrendingUp, BarChart3, Star
} from 'lucide-react';

const ResultsTab = React.memo(({
  selectedExamDetails,
  selectedExamStudents,
  onBack,
  showQuickSelectMenu,
  setShowQuickSelectMenu,
  statusFilter,
  setStatusFilter,
  selectedCandidates,
  setSelectedCandidates,
  exportToExcel,
  handleDownloadShortlistedPDF,
  detailViewTab,
  setDetailViewTab,
  getPassingPercentage,
  resultsCurrentPage,
  setResultsCurrentPage,
  resultsRowsPerPage,
  setResultsRowsPerPage,
  onScheduleInterview,
  loadingFeedback,
  feedbackData,
  feedbackStats,
}) => {
  const filteredStudents = useMemo(() => {
    return selectedExamStudents.filter(s => {
      if (statusFilter === 'all') return true;
      const percentage = (Number(s.score) / Number(s.total) * 100);
      const passingPercentage = getPassingPercentage ? getPassingPercentage(s) : (s.passingPercentage || selectedExamDetails?.passingPercentage || 50);
      const isPassed = percentage >= passingPercentage;
      if (statusFilter === 'pass') return isPassed;
      if (statusFilter === 'fail') return !isPassed;
      return true;
    });
  }, [selectedExamStudents, statusFilter, getPassingPercentage, selectedExamDetails]);

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Link */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#403f75] hover:text-[#2d2c55] dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer group"
          title="Back to Exams"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Exams</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">{selectedExamDetails?.name || 'Assessment Results'}</h2>
          <div className="section-subtitle flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-slate-400" />
              {selectedExamDetails?.questions || 0} Questions
            </span>
            <span>•</span>
            <span>Created on {selectedExamDetails?.date || 'N/A'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Select Dropdown */}
          {selectedExamStudents.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQuickSelectMenu(!showQuickSelectMenu)}
                className="btn-secondary"
              >
                <CheckSquare size={16} />
                <span>Quick Select</span>
                <ChevronDown size={14} className={`transition-transform ${showQuickSelectMenu ? 'rotate-180' : ''}`} />
              </button>
              {showQuickSelectMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[9999]"
                    onClick={() => setShowQuickSelectMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-[10000] overflow-hidden py-1">
                    <button
                      onClick={() => {
                        const filteredStudents = selectedExamStudents.filter(s => {
                          if (statusFilter === 'all') return true;
                          const percentage = (Number(s.score) / Number(s.total) * 100);
                          const passingPercentage = s.passingPercentage || selectedExamDetails?.passingPercentage || 50;
                          const isPassed = percentage >= passingPercentage;
                          if (statusFilter === 'pass') return isPassed;
                          if (statusFilter === 'fail') return !isPassed;
                          return true;
                        });
                        const ids = filteredStudents.map(s => s.student_id || s.id);
                        setSelectedCandidates(ids);
                        setShowQuickSelectMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-sm text-slate-700 font-medium"
                    >
                      <CheckCircle size={15} className="text-[#44448E]" />
                      <span>Select All Visible</span>
                    </button>
                    <button
                      onClick={() => {
                        const shortlistedStudents = selectedExamStudents.filter(s => {
                          const percentage = (Number(s.score) / Number(s.total) * 100);
                          const passingPercentage = s.passingPercentage || selectedExamDetails?.passingPercentage || 50;
                          return percentage >= passingPercentage && !s.flagged;
                        }).map(s => s.student_id || s.id);
                        setSelectedCandidates(shortlistedStudents);
                        setShowQuickSelectMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2.5 text-sm text-emerald-700 font-medium"
                    >
                      <CheckCircle size={15} className="text-emerald-600" />
                      <span>Select Shortlisted Students</span>
                    </button>
                    <button
                      onClick={() => {
                        const failedStudents = selectedExamStudents.filter(s => {
                          const percentage = (Number(s.score) / Number(s.total) * 100);
                          const passingPercentage = s.passingPercentage || selectedExamDetails?.passingPercentage || 50;
                          return percentage < passingPercentage;
                        }).map(s => s.student_id || s.id);
                        setSelectedCandidates(failedStudents);
                        setShowQuickSelectMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-rose-50 transition-colors flex items-center gap-2.5 text-sm text-rose-700 font-medium"
                    >
                      <XCircle size={15} className="text-rose-600" />
                      <span>Select All Failed</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setSelectedCandidates([]);
                        setShowQuickSelectMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-sm text-slate-600 font-medium"
                    >
                      <X size={15} className="text-slate-400" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={exportToExcel}
            disabled={selectedExamStudents.length === 0}
            className="btn-secondary"
            title={selectedExamStudents.length === 0 ? 'No results to export' : selectedCandidates.length > 0 ? `Export Excel (${selectedCandidates.length} selected)` : 'Export All to Excel'}
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel {selectedCandidates.length > 0 && `(${selectedCandidates.length})`}</span>
          </button>
          <button
            onClick={handleDownloadShortlistedPDF}
            disabled={selectedCandidates.length === 0}
            className="btn-secondary"
            title={selectedCandidates.length === 0 ? 'Select candidates to download PDF' : `Download PDF (${selectedCandidates.length} selected)`}
          >
            <Download size={16} />
            <span>Export PDF {selectedCandidates.length > 0 && `(${selectedCandidates.length})`}</span>
          </button>
        </div>
      </div>

      {/* Results / Feedback Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDetailViewTab('results')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            detailViewTab === 'results'
              ? 'bg-gradient-to-r from-[#403f75] to-[#57569b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users size={16} />
          <span>Results</span>
        </button>
        <button
          onClick={() => setDetailViewTab('feedback')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            detailViewTab === 'feedback'
              ? 'bg-gradient-to-r from-[#403f75] to-[#57569b] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={16} />
          <span>Feedback</span>
        </button>
      </div>

      {/* Compact Statistics Bar (when attempts exist) */}
      {selectedExamStudents.length > 0 && (() => {
        const scores = selectedExamStudents.map(s => Number(s.score) || 0);
        const totals = selectedExamStudents.map(s => Number(s.total) || 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const maxTotal = totals.length > 0 ? Math.max(...totals) : 0;
        const passedCount = selectedExamStudents.filter(s =>
          (Number(s.score) / Number(s.total) * 100) >= (s.passingPercentage || selectedExamDetails?.passingPercentage || 50)
        ).length;
        const passRate = selectedExamStudents.length > 0 ? (passedCount / selectedExamStudents.length) * 100 : 0;
        const flaggedCount = selectedExamStudents.filter(s => s.flagged === true).length;

        return (
          <div className="surface-card p-5 card-3d-lift shimmer-hover border-glow-hover animate-entry-3d transform-style-3d">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">Total Attempts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white layer-3d-float">{selectedExamStudents.length}</p>
              </div>
              <div className="text-center md:border-l md:border-slate-200 dark:md:border-slate-800">
                <p className="text-xs text-slate-500 font-medium mb-1">Average Score</p>
                <p className="text-2xl font-bold text-[#403f75] dark:text-[#a5a4e8] layer-3d-float">{avgScore.toFixed(1)}/{maxTotal}</p>
              </div>
              <div className="text-center md:border-l md:border-slate-200 dark:md:border-slate-800">
                <p className="text-xs text-slate-500 font-medium mb-1">Highest Score</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 layer-3d-float">{highestScore}/{maxTotal}</p>
              </div>
              <div className="text-center md:border-l md:border-slate-200 dark:md:border-slate-800">
                <p className="text-xs text-slate-500 font-medium mb-1">Lowest Score</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 layer-3d-float">{lowestScore}/{maxTotal}</p>
              </div>
              <div className="text-center md:border-l md:border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1">Pass Rate</p>
                <p className="text-2xl font-bold text-emerald-600 layer-3d-float">{passRate.toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-0.5">({passedCount}/{selectedExamStudents.length})</p>
              </div>
              <div className="text-center md:border-l md:border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1">Flagged</p>
                <p className="text-2xl font-bold text-rose-600 layer-3d-float">{flaggedCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">(3+ violations)</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Results Tab Content */}
      {detailViewTab === 'results' && (
        selectedExamStudents.length === 0 ? (
          <div className="surface-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <h3 className="empty-state-title">No students have attempted this exam yet</h3>
              <p className="empty-state-subtitle">
                Once candidates take this assessment, their submission details, proctoring metrics, and performance analytics will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Status Filter Tabs */}
            {(() => {
              const passedCount = selectedExamStudents.filter(s =>
                (Number(s.score) / Number(s.total) * 100) >= (s.passingPercentage || selectedExamDetails?.passingPercentage || 50)
              ).length;
              const failedCount = selectedExamStudents.length - passedCount;
              const filteredCount = filteredStudents.length;

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                        statusFilter === 'all'
                          ? 'bg-[#44448E] text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Filter size={14} />
                      <span>All</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedExamStudents.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('pass')}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                        statusFilter === 'pass'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle size={14} />
                      <span>Passed</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        statusFilter === 'pass' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {passedCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('fail')}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                        statusFilter === 'fail'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <XCircle size={14} />
                      <span>Failed</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        statusFilter === 'fail' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {failedCount}
                      </span>
                    </button>
                  </div>

                  {/* Selection Indicator */}
                  {selectedCandidates.length > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-[#44448E] px-3 py-1.5 rounded-lg text-sm shrink-0">
                      <CheckSquare size={14} />
                      <span className="font-semibold">{selectedCandidates.length}</span>
                      <span className="text-slate-600">of {filteredCount} selected</span>
                      <button
                        onClick={() => setSelectedCandidates([])}
                        className="ml-1 p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 transition-colors"
                        title="Clear selection"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="overflow-x-auto rounded-xl border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
              <table className="w-full">
                <thead className="bg-shnoor-indigo text-white">
                  <tr>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={(() => {
                          return filteredStudents.length > 0 && filteredStudents.every(s => selectedCandidates.includes(s.student_id || s.id));
                        })()}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const filteredIds = filteredStudents.map(s => s.student_id || s.id);
                            setSelectedCandidates(prev => [...new Set([...prev, ...filteredIds])]);
                          } else {
                            const filteredIds = filteredStudents.map(s => s.student_id || s.id);
                            setSelectedCandidates(prev => prev.filter(id => !filteredIds.includes(id)));
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                        title="Select All Visible"
                      />
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date Attempted</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Shortlisted</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">No Face</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Multi Faces</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Noise</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Voice</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Total</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Flagged</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E7EB]">
                  {(() => {
                    const startIndex = (resultsCurrentPage - 1) * resultsRowsPerPage;
                    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + resultsRowsPerPage);

                      return paginatedStudents.length > 0 ? (
                        paginatedStudents.map((student, idx) => {
                          const percentage = (student.score / student.total * 100);
                          const passingPercentage = getPassingPercentage(student);
                          const isPassed = percentage >= passingPercentage;
                          const studentIdentifier = student.student_id || student.id;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCandidates.includes(studentIdentifier)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCandidates(prev => [...prev, studentIdentifier]);
                                    } else {
                                      setSelectedCandidates(prev => prev.filter(id => id !== studentIdentifier));
                                    }
                                  }}
                                  className="w-4 h-4 rounded cursor-pointer accent-[#44448E]"
                                />
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-900">{student.id}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-800">{student.name}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">{student.email || 'N/A'}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500">{student.date}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`font-bold ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {student.score}
                                  </span>
                                  <span className="text-slate-400 text-xs ml-1">/ {student.total}</span>
                                  <span className="text-slate-400 text-xs ml-2">({percentage.toFixed(1)}%)</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full border ${isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                  {isPassed ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full border ${isPassed && !student.flagged
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                  {isPassed && !student.flagged ? 'Shortlisted' : 'Not Shortlisted'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center text-sm text-slate-700">{student.noFace || 0}</td>
                              <td className="px-4 py-3.5 text-center text-sm text-slate-700">{student.multipleFaces || 0}</td>
                              <td className="px-4 py-3.5 text-center text-sm text-slate-700">{student.phoneDetected || 0}</td>
                              <td className="px-4 py-3.5 text-center text-sm text-slate-700">{student.loudNoise || 0}</td>
                              <td className="px-4 py-3.5 text-center text-sm text-slate-700">{student.voiceDetected || 0}</td>
                              <td className="px-4 py-3.5 text-center text-sm font-bold text-slate-900">{student.totalViolations || 0}</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full border ${student.flagged
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                  {student.flagged ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <button
                                  onClick={() => {
                                    const resolvedStudentId = student.student_id || student.id || null;
                                    onScheduleInterview({
                                      id: resolvedStudentId,
                                      name: student.name,
                                      email: student.email
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#44448E] hover:bg-[#383878] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                                  title="Schedule Interview"
                                >
                                  <Video size={13} />
                                  <span>Interview</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="16" className="px-6 py-12 text-center text-slate-500 font-medium">
                            {statusFilter !== 'all'
                              ? `No ${statusFilter === 'pass' ? 'passed' : 'failed'} students found.`
                              : 'No students have attempted this exam yet.'
                            }
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            {/* Pagination */}
            {(() => {
                const filteredStudents = selectedExamStudents.filter(s => {
                  if (statusFilter === 'all') return true;
                  const percentage = (Number(s.score) / Number(s.total) * 100);
                  const passingPercentage = getPassingPercentage(s);
                  const isPassed = percentage >= passingPercentage;
                  if (statusFilter === 'pass') return isPassed;
                  if (statusFilter === 'fail') return !isPassed;
                  return true;
                });
                if (filteredStudents.length === 0) return null;

                const totalPages = Math.ceil(filteredStudents.length / resultsRowsPerPage) || 1;
                const startIndex = (resultsCurrentPage - 1) * resultsRowsPerPage;
                const endIndex = Math.min(startIndex + resultsRowsPerPage, filteredStudents.length);

                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                      Showing {startIndex + 1} - {endIndex} of {filteredStudents.length} candidate attempts
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                          value={resultsRowsPerPage}
                          onChange={(e) => {
                            setResultsRowsPerPage(Number(e.target.value));
                            setResultsCurrentPage(1);
                          }}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-[#44448E] cursor-pointer"
                        >
                          {[10, 20, 40, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setResultsCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={resultsCurrentPage === 1}
                          className={`p-1.5 rounded border border-slate-200 transition-colors ${
                            resultsCurrentPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-white bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="px-2 font-medium">Page {resultsCurrentPage} of {totalPages}</span>
                        <button
                          onClick={() => setResultsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={resultsCurrentPage === totalPages}
                          className={`p-1.5 rounded border border-slate-200 transition-colors ${
                            resultsCurrentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-white bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </>
        )
      )}

      {/* Feedback Tab Content */}
      {detailViewTab === 'feedback' && (
        <div>
          {loadingFeedback ? (
            <div className="surface-card">
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-[#44448E] mr-2" size={24} />
                <span className="text-slate-600 text-sm font-medium">Loading feedback...</span>
              </div>
            </div>
          ) : feedbackData.length === 0 ? (
            <div className="surface-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <MessageSquare size={28} />
                </div>
                <h3 className="empty-state-title">No feedback submitted yet</h3>
                <p className="empty-state-subtitle">
                  Candidate feedback and rating reviews will appear here once submitted after test completion.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Feedback Statistics */}
              {feedbackStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="surface-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp size={20} className="text-[#44448E]" />
                      <span className="text-2xl font-bold text-[#44448E]">
                        {feedbackStats.averageRating}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold">Average Rating</p>
                    <p className="text-xs text-slate-500">{feedbackStats.totalFeedbacks} responses</p>
                  </div>

                  <div className="surface-card p-4">
                    <BarChart3 size={20} className="text-emerald-600 mb-2" />
                    <p className="text-sm text-slate-800 font-semibold mb-2">Difficulty</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Easy:</span>
                        <span className="font-semibold text-emerald-600">{feedbackStats.difficultyBreakdown.Easy}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Medium:</span>
                        <span className="font-semibold text-amber-600">{feedbackStats.difficultyBreakdown.Medium}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Hard:</span>
                        <span className="font-semibold text-rose-600">{feedbackStats.difficultyBreakdown.Hard}</span>
                      </div>
                    </div>
                  </div>

                  <div className="surface-card p-4">
                    <Star size={20} className="text-amber-500 mb-2" />
                    <p className="text-sm text-slate-800 font-semibold mb-2">Rating Distribution</p>
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="flex items-center text-xs">
                          <span className="text-slate-500 w-8">{rating}★</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 mx-2">
                            <div
                              className="bg-amber-400 h-2 rounded-full"
                              style={{
                                width: `${feedbackStats.totalFeedbacks > 0
                                  ? (feedbackStats.ratingBreakdown[rating] / feedbackStats.totalFeedbacks) * 100
                                  : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-700 w-6">{feedbackStats.ratingBreakdown[rating]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Feedback Cards */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Student Feedback</h3>
                {feedbackData.map((feedback, idx) => (
                  <div key={idx} className="surface-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{feedback.student_name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-500">{feedback.student_email}</p>
                      </div>
                      <div className="text-right">
                        {feedback.rating && (
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {feedback.difficulty && (
                      <div className="mb-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${feedback.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          feedback.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                          Difficulty: {feedback.difficulty}
                        </span>
                      </div>
                    )}

                    {feedback.feedback_text && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{feedback.feedback_text}</p>
                      </div>
                    )}

                    {!feedback.rating && !feedback.difficulty && !feedback.feedback_text && (
                      <p className="text-xs text-slate-400 italic">No detailed feedback provided</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ResultsTab;
