import React from 'react';
import {
  Building2, Search, Plus, Loader2, FileSpreadsheet,
  ChevronDown, UserCheck, Users, Calendar, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const InstitutesTab = ({
  instituteSearchTerm,
  setInstituteSearchTerm,
  newInstituteName,
  setNewInstituteName,
  handleAddInstitute,
  isAddingInstitute,
  selectedInstitutes,
  setSelectedInstitutes,
  allInstitutes,
  selectedTestsForMultipleInstitutes,
  setSelectedTestsForMultipleInstitutes,
  isTestDropdownOpen,
  setIsTestDropdownOpen,
  tests,
  handleAssignTestToMultipleInstitutes,
  isAssigningTestToMultipleInstitutes,
  toggleAllInstitutes,
  isLoadingAllInstitutes,
  paginatedInstitutes,
  toggleInstituteSelection,
  handleViewAssignedTests,
  handleManageStudents,
  setSelectedInstituteForRegistration,
  setShowRegistrationControlModal,
  handleDeleteInstitute,
  instituteTotalPages,
  instituteCurrentPage,
  setInstituteCurrentPage,
}) => {
  return (
    <div className="space-y-6">
      <div className="section-header">
        <div className="section-header-left">
          <h2 className="section-title">Manage Institutes</h2>
          <p className="section-subtitle">Manage your institutes and their students</p>
        </div>

        {/* Search Institutes */}
        <div className="search-wrap relative w-full sm:w-72">
          <Search className="search-icon absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search institutes..."
            value={instituteSearchTerm}
            onChange={(e) => setInstituteSearchTerm(e.target.value)}
            className="search-input w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
      </div>

      <div className="surface-card bg-white dark:bg-[#1A1A32] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">

        {/* Add Institute Form */}
        <div className="subsurface-card bg-slate-50/90 dark:bg-[#222244] rounded-xl border border-slate-200/80 dark:border-slate-700/70 p-4 sm:p-5 mb-6">
          <label className="form-label text-sm font-bold text-slate-900 dark:text-white flex items-center mb-2.5">
            <Plus size={16} className="mr-1.5 text-[#403f75] dark:text-indigo-400" />
            Add New Institute
          </label>
          <div className="form-row flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newInstituteName}
              onChange={(e) => setNewInstituteName(e.target.value)}
              placeholder="Enter institute name"
              className="form-input flex-1 bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 placeholder-slate-400 dark:placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddInstitute();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddInstitute}
              disabled={isAddingInstitute || !newInstituteName.trim()}
              className="add-btn inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            >
              {isAddingInstitute ? (
                <>
                  <Loader2 className="animate-spin mr-1.5" size={16} />
                  <span>Adding...</span>
                </>
              ) : (
                <span>+ Add</span>
              )}
            </button>
          </div>
        </div>

        {/* Institutes List */}
        <div className="space-y-4">
          {/* Bulk Test Assignment Section */}
          {selectedInstitutes.length > 0 && (
            <div className="admin-highlight-panel mb-6 p-4 sm:p-6 bg-slate-50 dark:bg-[#232348] rounded-2xl border-2 border-[#403f75] dark:border-indigo-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <FileSpreadsheet className="mr-2 text-[#403f75] dark:text-indigo-400 shrink-0" size={22} />
                  <span>Assign Test to Selected Institutes</span>
                </h3>
                <button
                  onClick={() => setSelectedInstitutes([])}
                  className="text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white font-semibold self-end sm:self-auto cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mb-2">
                    <span className="font-bold">{selectedInstitutes.length}</span> institute{selectedInstitutes.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInstitutes.map(instId => {
                      const inst = allInstitutes.find(i => i.id === instId);
                      return inst ? (
                        <span key={instId} className="px-3 py-1 bg-white dark:bg-[#1E1E38] rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {inst.display_name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Select Test to Assign
                  </label>

                  {/* Custom Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setIsTestDropdownOpen(!isTestDropdownOpen)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white font-medium transition-all flex items-center justify-between hover:border-indigo-500 cursor-pointer"
                  >
                    <span className={selectedTestsForMultipleInstitutes.length === 0 ? 'text-slate-400 dark:text-slate-400' : 'text-slate-900 dark:text-white font-semibold'}>
                      {selectedTestsForMultipleInstitutes.length === 0
                        ? '-- Select a test --'
                        : `${selectedTestsForMultipleInstitutes.length} test${selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} selected`
                      }
                    </span>
                    <ChevronDown size={20} className={`text-slate-500 dark:text-slate-400 transition-transform ${isTestDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu with Checkboxes */}
                  {isTestDropdownOpen && (
                    <div className="admin-dropdown-menu absolute z-50 w-full mt-2 bg-white dark:bg-[#25254A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {tests.filter(test => test.status === 'published').length === 0 ? (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                          No published tests available
                        </div>
                      ) : (
                        <div className="py-2">
                          {tests.filter(test => test.status === 'published').map((test) => (
                            <label
                              key={test.id}
                              className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2E2E5A] cursor-pointer transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTestsForMultipleInstitutes.includes(test.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTestsForMultipleInstitutes([...selectedTestsForMultipleInstitutes, test.id]);
                                  } else {
                                    setSelectedTestsForMultipleInstitutes(selectedTestsForMultipleInstitutes.filter(id => id !== test.id));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                              />
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
                                {test.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTestsForMultipleInstitutes.length > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                      {selectedTestsForMultipleInstitutes.length} test{selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleAssignTestToMultipleInstitutes}
                  disabled={selectedTestsForMultipleInstitutes.length === 0 || isAssigningTestToMultipleInstitutes}
                  className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${selectedTestsForMultipleInstitutes.length > 0 && !isAssigningTestToMultipleInstitutes
                    ? 'bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-lg'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                >
                  {isAssigningTestToMultipleInstitutes && (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  )}
                  <UserCheck size={22} />
                  <span>
                    {isAssigningTestToMultipleInstitutes
                      ? 'Assigning...'
                      : `Assign ${selectedTestsForMultipleInstitutes.length} Test${selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} to ${selectedInstitutes.length} Institute${selectedInstitutes.length !== 1 ? 's' : ''}`
                    }
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Building2 size={22} className="mr-2 text-[#403f75] dark:text-indigo-400" />
                All Institutes
              </h3>
              {allInstitutes.length > 0 && (
                <label className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-[#25254A] hover:bg-slate-200 dark:hover:bg-[#2E2E5A] rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedInstitutes.length === allInstitutes.length && allInstitutes.length > 0}
                    ref={(el) => { if (el) el.indeterminate = selectedInstitutes.length > 0 && selectedInstitutes.length < allInstitutes.length; }}
                    onChange={toggleAllInstitutes}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Select All</span>
                </label>
              )}
            </div>
            {allInstitutes.length > 0 && (
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#25254A] px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {allInstitutes.length} institute{allInstitutes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoadingAllInstitutes ? (
            <div className="flex items-center justify-center py-12 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200 dark:border-slate-700">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Loading institutes...</span>
            </div>
          ) : allInstitutes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200 dark:border-slate-700">
              <Building2 className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={64} />
              <p className="text-slate-900 dark:text-white font-bold text-lg">No institutes found</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Add your first institute using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedInstitutes.map((institute) => {
                const now = new Date();
                const startTime = institute.registration_start_time ? new Date(institute.registration_start_time) : null;
                const deadline = institute.registration_deadline ? new Date(institute.registration_deadline) : null;
                const notYetOpen = startTime && now < startTime;
                const deadlinePassed = deadline && now > deadline;

                let effectiveStatus = institute.registration_status || 'open';
                let statusBadgeText = effectiveStatus;
                let statusBadgeColor = effectiveStatus === 'open'
                  ? 'admin-status-pill is-open bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : effectiveStatus === 'paused'
                    ? 'admin-status-pill is-paused bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'admin-status-pill is-closed bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';

                if (notYetOpen) {
                  statusBadgeText = 'not yet open';
                  statusBadgeColor = 'admin-status-pill is-not-yet-open bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                } else if (deadlinePassed && effectiveStatus === 'open') {
                  statusBadgeText = 'closed';
                  statusBadgeColor = 'admin-status-pill is-closed bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                }

                const isInstituteSelected = selectedInstitutes.includes(institute.id);

                return (
                  <div
                    key={institute.id}
                    className={`border rounded-2xl p-6 bg-white dark:bg-[#1E1E38] hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all ${isInstituteSelected ? 'border-[#403f75] dark:border-indigo-500 border-2 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                  >
                    <div className="flex items-start space-x-3 mb-4">
                      <label className="flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={isInstituteSelected}
                          onChange={() => toggleInstituteSelection(institute.id)}
                          className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                        />
                      </label>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                            {institute.display_name}
                          </h4>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor}`}>
                            {statusBadgeText}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <p className="flex items-center text-slate-700 dark:text-slate-200">
                            <Users size={14} className="mr-2 text-slate-400" />
                            {institute.student_count} student{institute.student_count !== 1 ? 's' : ''}
                          </p>
                          <p className="flex items-center text-slate-700 dark:text-slate-200">
                            <FileSpreadsheet size={14} className="mr-2 text-slate-400" />
                            {institute.assigned_tests_count} test{institute.assigned_tests_count !== 1 ? 's' : ''} assigned
                          </p>
                          {institute.registration_start_time && (
                            <p className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Calendar size={12} className="mr-2 text-slate-400" />
                              Start: {new Date(institute.registration_start_time).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          )}
                          {institute.registration_deadline && (
                            <p className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Calendar size={12} className="mr-2 text-slate-400" />
                              Deadline: {new Date(institute.registration_deadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => handleViewAssignedTests(institute)}
                            className="card-btn card-btn-indigo px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-[#403f75] dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-[#2E2E5A] transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet size={16} className="inline mr-1" />
                            Tests
                          </button>
                          <button
                            onClick={() => handleManageStudents(institute)}
                            className="card-btn card-btn-green px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <Users size={16} className="inline mr-1" />
                            Students
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInstituteForRegistration(institute);
                              setShowRegistrationControlModal(true);
                            }}
                            className="card-btn card-btn-indigo px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-[#403f75] dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-[#2E2E5A] transition-colors cursor-pointer"
                          >
                            <Calendar size={16} className="inline mr-1" />
                            Registration
                          </button>
                          <button
                            onClick={() => handleDeleteInstitute(institute.id, institute.display_name)}
                            className="card-btn card-btn-danger px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Institute"
                          >
                            <Trash2 size={16} className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {instituteTotalPages > 1 && allInstitutes.length > 0 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setInstituteCurrentPage(p => Math.max(1, p - 1))}
                disabled={instituteCurrentPage === 1}
                className="p-2 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#25254A] text-[#403f75] dark:text-indigo-300 transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-slate-800 dark:text-slate-200 font-bold">
                Page {instituteCurrentPage} of {instituteTotalPages}
              </span>
              <button
                onClick={() => setInstituteCurrentPage(p => Math.min(instituteTotalPages, p + 1))}
                disabled={instituteCurrentPage === instituteTotalPages}
                className="p-2 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#25254A] text-[#403f75] dark:text-indigo-300 transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutesTab;
