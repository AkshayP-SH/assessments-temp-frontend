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
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light overflow-hidden">
      <div className="p-8">
        <button
          onClick={onBack}
          className="flex items-center text-shnoor-indigoMedium hover:text-shnoor-indigo mb-8 transition-colors group"
        >
          <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Exams List</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 sm:mb-8 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-shnoor-navy mb-2">{selectedExamDetails?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:space-x-4 text-xs sm:text-sm text-shnoor-indigoMedium">
              <span className="flex items-center">
                <FileSpreadsheet size={16} className="mr-1" />
                {selectedExamDetails?.questions} Questions
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Created on {selectedExamDetails?.date}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto mt-4 md:mt-0">
            {/* Quick Select Dropdown */}
            {selectedExamStudents.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowQuickSelectMenu(!showQuickSelectMenu)}
                  className="w-full flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5"
                >
                  <CheckSquare size={20} />
                  <span>Quick Select</span>
                  <ChevronDown size={16} className={`transition-transform ${showQuickSelectMenu ? 'rotate-180' : ''}`} />
                </button>
                {showQuickSelectMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[9999]"
                      onClick={() => setShowQuickSelectMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_20px_60px_rgba(14,14,39,0.15)] border border-shnoor-light z-[10000] overflow-hidden">
                      <div className="py-2">
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
                          className="w-full px-4 py-3 text-left hover:bg-shnoor-lavender transition-colors flex items-center space-x-3 text-sm"
                        >
                          <CheckCircle size={16} className="text-shnoor-indigo" />
                          <span className="font-medium text-shnoor-navy">Select All Visible</span>
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
                          className="w-full px-4 py-3 text-left hover:bg-shnoor-successLight transition-colors flex items-center space-x-3 text-sm"
                        >
                          <CheckCircle size={16} className="text-shnoor-success" />
                          <span className="font-medium text-shnoor-navy">Select Shortlisted Students</span>
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
                          className="w-full px-4 py-3 text-left hover:bg-shnoor-dangerLight transition-colors flex items-center space-x-3 text-sm"
                        >
                          <XCircle size={16} className="text-shnoor-danger" />
                          <span className="font-medium text-shnoor-navy">Select All Failed</span>
                        </button>
                        <div className="border-t border-shnoor-light my-1"></div>
                        <button
                          onClick={() => {
                            setSelectedCandidates([]);
                            setShowQuickSelectMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-shnoor-lavender transition-colors flex items-center space-x-3 text-sm"
                        >
                          <X size={16} className="text-shnoor-indigoMedium" />
                          <span className="font-medium text-shnoor-navy">Clear All</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={exportToExcel}
              disabled={selectedExamStudents.length === 0}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${selectedExamStudents.length === 0
                ? 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                : 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5'
                }`}
              title={selectedExamStudents.length === 0 ? 'No results to export' : selectedCandidates.length > 0 ? `Export Excel (${selectedCandidates.length} selected)` : 'Export All to Excel'}
            >
              <FileSpreadsheet size={18} className="sm:size-5" />
              <span>Export Excel {selectedCandidates.length > 0 && `(${selectedCandidates.length})`}</span>
            </button>
            <button
              onClick={handleDownloadShortlistedPDF}
              disabled={selectedCandidates.length === 0}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${selectedCandidates.length === 0
                ? 'bg-shnoor-light text-shnoor-soft cursor-not-allowed opacity-50'
                : 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5'
                }`}
              title={selectedCandidates.length === 0 ? 'Select candidates to download PDF' : `Download PDF (${selectedCandidates.length} selected)`}
            >
              <Download size={20} />
              <span>Export PDF {selectedCandidates.length > 0 && `(${selectedCandidates.length})`}</span>
            </button>
          </div>
        </div>

        {/* Results / Feedback Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setDetailViewTab('results')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${detailViewTab === 'results'
              ? 'bg-shnoor-indigo text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
              : 'bg-shnoor-lavender opacity-80 text-shnoor-indigo hover:bg-shnoor-light'
              }`}
          >
            <Users size={18} className="inline mr-2" />
            Results
          </button>
          <button
            onClick={() => setDetailViewTab('feedback')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${detailViewTab === 'feedback'
              ? 'bg-shnoor-indigo text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
              : 'bg-shnoor-lavender opacity-80 text-shnoor-indigo hover:bg-shnoor-light'
              }`}
          >
            <MessageSquare size={18} className="inline mr-2" />
            Feedback
          </button>
        </div>

        {/* Compact Statistics Bar */}
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
            <div className="bg-white border border-shnoor-light rounded-lg p-4 mb-6 shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Total Attempts</p>
                  <p className="text-2xl font-bold text-shnoor-navy">{selectedExamStudents.length}</p>
                </div>
                <div className="text-center border-l border-shnoor-light">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-shnoor-indigo">{avgScore.toFixed(1)}/{maxTotal}</p>
                </div>
                <div className="text-center border-l border-shnoor-light">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Highest Score</p>
                  <p className="text-2xl font-bold text-shnoor-success">{highestScore}/{maxTotal}</p>
                </div>
                <div className="text-center border-l border-shnoor-light">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Lowest Score</p>
                  <p className="text-2xl font-bold text-shnoor-warning">{lowestScore}/{maxTotal}</p>
                </div>
                <div className="text-center border-l border-shnoor-light">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Pass Rate</p>
                  <p className="text-2xl font-bold text-shnoor-success">{passRate.toFixed(0)}%</p>
                  <p className="text-xs text-shnoor-soft mt-0.5">({passedCount}/{selectedExamStudents.length})</p>
                </div>
                <div className="text-center border-l border-shnoor-light">
                  <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Flagged</p>
                  <p className="text-2xl font-bold text-shnoor-danger">{flaggedCount}</p>
                  <p className="text-xs text-shnoor-soft mt-0.5">(3+ high violations)</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Results Tab Content */}
        {detailViewTab === 'results' && (
          <>
            {/* Status Filter Tabs */}
            {selectedExamStudents.length > 0 && (() => {
              const passedCount = selectedExamStudents.filter(s =>
                (Number(s.score) / Number(s.total) * 100) >= (s.passingPercentage || selectedExamDetails?.passingPercentage || 50)
              ).length;
              const failedCount = selectedExamStudents.length - passedCount;
              const filteredCount = filteredStudents.length;

              return (
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                  <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-2 xl:pb-0 w-max xl:w-full !max-w-none">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base whitespace-nowrap font-medium transition-all flex items-center space-x-2 shrink-0 ${statusFilter === 'all'
                        ? 'bg-shnoor-indigo text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
                        : 'bg-shnoor-lavender opacity-80 text-shnoor-indigo hover:bg-shnoor-light'
                        }`}
                    >
                      <Filter size={18} className="sm:size-5" />
                      <span>All</span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === 'all'
                        ? 'bg-white bg-opacity-20'
                        : 'bg-shnoor-indigo bg-opacity-20'
                        }`}>
                        {selectedExamStudents.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('pass')}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base whitespace-nowrap font-medium transition-all flex items-center space-x-2 shrink-0 ${statusFilter === 'pass'
                        ? 'bg-shnoor-success text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
                        : 'bg-shnoor-successLight opacity-80 text-shnoor-success hover:bg-green-100'
                        }`}
                    >
                      <CheckCircle size={18} className="sm:size-5" />
                      <span>Passed</span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === 'pass'
                        ? 'bg-white bg-opacity-20'
                        : 'bg-shnoor-success bg-opacity-20'
                        }`}>
                        {passedCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('fail')}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base whitespace-nowrap font-medium transition-all flex items-center space-x-2 shrink-0 ${statusFilter === 'fail'
                        ? 'bg-shnoor-danger text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
                        : 'bg-shnoor-dangerLight opacity-80 text-shnoor-danger hover:bg-red-100'
                        }`}
                    >
                      <XCircle size={18} className="sm:size-5" />
                      <span>Failed</span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === 'fail'
                        ? 'bg-white bg-opacity-20'
                        : 'bg-shnoor-danger bg-opacity-20'
                        }`}>
                        {failedCount}
                      </span>
                    </button>
                  </div>

                  {/* Selection Indicator */}
                  {selectedCandidates.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-shnoor-lavender text-shnoor-indigo px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                        <CheckSquare size={16} />
                        <span className="text-sm">
                          <span className="font-bold">{selectedCandidates.length}</span>
                          <span className="text-shnoor-indigoMedium"> of {filteredCount} selected</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCandidates([])}
                        className="p-2 rounded-lg text-shnoor-indigoMedium hover:bg-shnoor-dangerLight hover:text-shnoor-danger transition-all"
                        title="Clear selection"
                      >
                        <X size={18} />
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
                          <tr key={idx} className="hover:bg-shnoor-lavender">
                            <td className="px-4 py-4 text-center">
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
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-shnoor-navy">{student.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-navy">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-indigoMedium">{student.email || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-indigoMedium">{student.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`font-bold ${isPassed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                                  {student.score}
                                </span>
                                <span className="text-shnoor-indigoMedium text-xs ml-1">/ {student.total}</span>
                                <span className="text-shnoor-indigoMedium text-xs ml-2">({percentage.toFixed(1)}%)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPassed
                                ? 'bg-shnoor-successLight text-shnoor-success'
                                : 'bg-shnoor-dangerLight text-shnoor-danger'
                                }`}>
                                {isPassed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPassed && !student.flagged
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {isPassed && !student.flagged ? 'Shortlisted' : 'Not Shortlisted'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.noFace || 0}</td>
                            <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.multipleFaces || 0}</td>
                            <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.phoneDetected || 0}</td>
                            <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.loudNoise || 0}</td>
                            <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.voiceDetected || 0}</td>
                            <td className="px-4 py-4 text-center text-sm font-semibold text-shnoor-navy">{student.totalViolations || 0}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.flagged
                                ? 'bg-shnoor-dangerLight text-shnoor-danger'
                                : 'bg-shnoor-lavender opacity-80 text-shnoor-indigoMedium'
                                }`}>
                                {student.flagged ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => {
                                  const resolvedStudentId = student.student_id || student.id || null;
                                  onScheduleInterview({
                                    id: resolvedStudentId,
                                    name: student.name,
                                    email: student.email
                                  });
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-shnoor-indigo hover:bg-shnoor-navy text-white text-xs font-medium rounded-lg transition-colors"
                                title="Schedule Interview"
                              >
                                <Video size={14} className="mr-1" />
                                Interview
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="16" className="px-6 py-12 text-center text-shnoor-indigoMedium">
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
              if (filteredStudents.length === 0) return null;

              const totalPages = Math.ceil(filteredStudents.length / resultsRowsPerPage);
              const startIndex = (resultsCurrentPage - 1) * resultsRowsPerPage;
              const endIndex = Math.min(startIndex + resultsRowsPerPage, filteredStudents.length);

              return (
                <div className="flex items-center justify-end px-4 py-3 bg-white border border-shnoor-light mt-4 rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                  <div className="flex items-center space-x-6 text-sm text-shnoor-indigoMedium">
                    <div className="flex items-center space-x-2">
                      <span>Rows per page:</span>
                      <select
                        value={resultsRowsPerPage}
                        onChange={(e) => {
                          setResultsRowsPerPage(Number(e.target.value));
                          setResultsCurrentPage(1);
                        }}
                        className="bg-transparent border-none text-shnoor-navy font-medium focus:ring-0 cursor-pointer p-0 pr-4"
                      >
                        {[10, 20, 40, 50, 100].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <span>
                      {startIndex + 1} - {endIndex} of {filteredStudents.length}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setResultsCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={resultsCurrentPage === 1}
                        className={`p-1 rounded transition-colors ${resultsCurrentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-shnoor-lavender text-shnoor-navy'}`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setResultsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={resultsCurrentPage === totalPages}
                        className={`p-1 rounded transition-colors ${resultsCurrentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-shnoor-lavender text-shnoor-navy'}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Feedback Tab Content */}
        {detailViewTab === 'feedback' && (
          <div>
            {loadingFeedback ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-shnoor-indigo" size={48} />
              </div>
            ) : feedbackData.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-shnoor-light">
                <MessageSquare size={48} className="mx-auto text-shnoor-mist mb-3" />
                <p className="text-shnoor-indigoMedium text-lg">No feedback submitted yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Feedback Statistics */}
                {feedbackStats && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-shnoor-mist to-shnoor-mist border border-shnoor-light rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp size={20} className="text-shnoor-indigo" />
                        <span className="text-2xl font-bold text-shnoor-indigo">
                          {feedbackStats.averageRating}
                        </span>
                      </div>
                      <p className="text-sm text-shnoor-indigo font-medium">Average Rating</p>
                      <p className="text-xs text-shnoor-indigoMedium">{feedbackStats.totalFeedbacks} responses</p>
                    </div>

                    <div className="bg-gradient-to-br from-shnoor-successLight to-shnoor-successLight border border-shnoor-successLight rounded-lg p-4">
                      <BarChart3 size={20} className="text-shnoor-success mb-2" />
                      <p className="text-sm text-shnoor-indigo font-medium mb-2">Difficulty</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-shnoor-indigoMedium">Easy:</span>
                          <span className="font-medium text-shnoor-success">{feedbackStats.difficultyBreakdown.Easy}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-shnoor-indigoMedium">Medium:</span>
                          <span className="font-medium text-shnoor-warning">{feedbackStats.difficultyBreakdown.Medium}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-shnoor-indigoMedium">Hard:</span>
                          <span className="font-medium text-shnoor-danger">{feedbackStats.difficultyBreakdown.Hard}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-shnoor-warningLight to-shnoor-warningLight border border-shnoor-warningLight rounded-lg p-4">
                      <Star size={20} className="text-shnoor-warning mb-2" />
                      <p className="text-sm text-shnoor-indigo font-medium mb-2">Rating Distribution</p>
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} className="flex items-center text-xs">
                            <span className="text-shnoor-indigoMedium w-8">{rating}★</span>
                            <div className="flex-1 bg-shnoor-light rounded-full h-2 mx-2">
                              <div
                                className="bg-shnoor-warning h-2 rounded-full"
                                style={{
                                  width: `${feedbackStats.totalFeedbacks > 0
                                    ? (feedbackStats.ratingBreakdown[rating] / feedbackStats.totalFeedbacks) * 100
                                    : 0}%`
                                }}
                              ></div>
                            </div>
                            <span className="font-medium text-shnoor-indigo w-6">{feedbackStats.ratingBreakdown[rating]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Feedback Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-shnoor-navy mb-4">Student Feedback</h3>
                  {feedbackData.map((feedback, idx) => (
                    <div key={idx} className="border border-shnoor-light rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-shnoor-navy">{feedback.student_name || 'Anonymous'}</p>
                          <p className="text-sm text-shnoor-indigoMedium">{feedback.student_email}</p>
                        </div>
                        <div className="text-right">
                          {feedback.rating && (
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={star <= feedback.rating ? 'fill-shnoor-warning text-shnoor-warning' : 'text-shnoor-mist'}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-shnoor-indigoMedium mt-1">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {feedback.difficulty && (
                        <div className="mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${feedback.difficulty === 'Easy' ? 'bg-shnoor-successLight text-shnoor-success' :
                            feedback.difficulty === 'Medium' ? 'bg-shnoor-warningLight text-shnoor-warning' :
                              'bg-shnoor-dangerLight text-shnoor-danger'
                            }`}>
                            Difficulty: {feedback.difficulty}
                          </span>
                        </div>
                      )}

                      {feedback.feedback_text && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm text-shnoor-indigo whitespace-pre-wrap">{feedback.feedback_text}</p>
                        </div>
                      )}

                      {!feedback.rating && !feedback.difficulty && !feedback.feedback_text && (
                        <p className="text-sm text-shnoor-soft italic">No detailed feedback provided</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ResultsTab;
