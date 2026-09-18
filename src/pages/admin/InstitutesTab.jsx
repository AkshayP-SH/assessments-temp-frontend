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
      <div className="admin-surface-card bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-4 sm:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-shnoor-navy mb-2 flex items-center">
              <Building2 className="mr-2 sm:mr-3 text-shnoor-indigo h-6 w-6 sm:h-8 sm:w-8" />
              Manage Institutes
            </h2>
            <p className="text-sm sm:text-base text-shnoor-indigoMedium ml-8 sm:ml-11">Add, view, and manage institutes and their students</p>
          </div>

          {/* Search Institutes */}
          <div className="mt-4 sm:mt-0 relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shnoor-indigoMedium" size={18} />
            <input
              type="text"
              placeholder="Search institutes..."
              value={instituteSearchTerm}
              onChange={(e) => setInstituteSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-shnoor-light rounded-xl focus:ring-2 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all shadow-[0_4px_15px_rgba(14,14,39,0.04)]"
            />
          </div>
        </div>

        {/* Add Institute Form */}
        <div className="admin-subsurface-card mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-2xl border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
          <label className="text-sm font-bold text-shnoor-navy mb-3 flex items-center">
            <Plus size={18} className="mr-2 text-shnoor-indigo" />
            Add New Institute
          </label>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <input
              type="text"
              value={newInstituteName}
              onChange={(e) => setNewInstituteName(e.target.value)}
              placeholder="Enter institute name"
              className="flex-1 px-5 py-4 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium shadow-[0_8px_30px_rgba(14,14,39,0.06)]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddInstitute();
                }
              }}
            />
            <button
              onClick={handleAddInstitute}
              disabled={isAddingInstitute || !newInstituteName.trim()}
              className={`w-full sm:w-auto px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${!isAddingInstitute && newInstituteName.trim()
                ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5'
                : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                }`}
            >
              {isAddingInstitute && (
                <Loader2 className="animate-spin" size={20} />
              )}
              <Plus size={20} />
              <span>{isAddingInstitute ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Institutes List */}
        <div className="space-y-4">
          {/* Bulk Test Assignment Section */}
          {selectedInstitutes.length > 0 && (
            <div className="admin-highlight-panel mb-6 p-4 sm:p-6 bg-shnoor-lavender rounded-2xl border-2 border-shnoor-indigo">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-bold text-shnoor-navy flex items-center">
                  <FileSpreadsheet className="mr-2 text-shnoor-indigo shrink-0" size={22} />
                  <span>Assign Test to Selected Institutes</span>
                </h3>
                <button
                  onClick={() => setSelectedInstitutes([])}
                  className="text-sm text-shnoor-indigoMedium hover:text-shnoor-navy font-medium self-end sm:self-auto"
                >
                  Clear Selection
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-shnoor-navy mb-2">
                    <span className="font-bold">{selectedInstitutes.length}</span> institute{selectedInstitutes.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInstitutes.map(instId => {
                      const inst = allInstitutes.find(i => i.id === instId);
                      return inst ? (
                        <span key={instId} className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-shnoor-navy border border-shnoor-light">
                          {inst.display_name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-shnoor-navy mb-2">
                    Select Test to Assign
                  </label>

                  {/* Custom Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setIsTestDropdownOpen(!isTestDropdownOpen)}
                    className="w-full px-4 py-3 border border-shnoor-light rounded-xl bg-white text-shnoor-navy font-medium transition-all flex items-center justify-between hover:border-shnoor-indigo focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo"
                  >
                    <span className={selectedTestsForMultipleInstitutes.length === 0 ? 'text-shnoor-indigoMedium' : 'text-shnoor-navy'}>
                      {selectedTestsForMultipleInstitutes.length === 0
                        ? '-- Select a test --'
                        : `${selectedTestsForMultipleInstitutes.length} test${selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} selected`
                      }
                    </span>
                    <ChevronDown size={20} className={`transition-transform ${isTestDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu with Checkboxes */}
                  {isTestDropdownOpen && (
                    <div className="admin-dropdown-menu absolute z-50 w-full mt-2 bg-white border border-shnoor-light rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {tests.filter(test => test.status === 'published').length === 0 ? (
                        <div className="p-4 text-center text-shnoor-indigoMedium text-sm">
                          No published tests available
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
                                checked={selectedTestsForMultipleInstitutes.includes(test.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTestsForMultipleInstitutes([...selectedTestsForMultipleInstitutes, test.id]);
                                  } else {
                                    setSelectedTestsForMultipleInstitutes(selectedTestsForMultipleInstitutes.filter(id => id !== test.id));
                                  }
                                }}
                                className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                              />
                              <span className="text-sm font-medium text-shnoor-navy flex-1">
                                {test.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTestsForMultipleInstitutes.length > 0 && (
                    <p className="text-xs text-shnoor-indigo mt-2 font-medium">
                      {selectedTestsForMultipleInstitutes.length} test{selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleAssignTestToMultipleInstitutes}
                  disabled={selectedTestsForMultipleInstitutes.length === 0 || isAssigningTestToMultipleInstitutes}
                  className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${selectedTestsForMultipleInstitutes.length > 0 && !isAssigningTestToMultipleInstitutes
                    ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
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
              <h3 className="text-xl font-bold text-shnoor-navy flex items-center">
                <Building2 size={22} className="mr-2 text-shnoor-indigo" />
                All Institutes
              </h3>
              {allInstitutes.length > 0 && (
                <label className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 bg-shnoor-lavender hover:bg-shnoor-light rounded-lg transition-colors border border-shnoor-light">
                  <input
                    type="checkbox"
                    checked={selectedInstitutes.length === allInstitutes.length && allInstitutes.length > 0}
                    ref={(el) => { if (el) el.indeterminate = selectedInstitutes.length > 0 && selectedInstitutes.length < allInstitutes.length; }}
                    onChange={toggleAllInstitutes}
                    className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                  />
                  <span className="text-sm font-bold text-shnoor-navy whitespace-nowrap">Select All</span>
                </label>
              )}
            </div>
            {allInstitutes.length > 0 && (
              <span className="text-sm text-shnoor-indigoMedium bg-shnoor-lavender px-3 py-1 rounded-full border border-shnoor-light">
                {allInstitutes.length} institute{allInstitutes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoadingAllInstitutes ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-shnoor-light">
              <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
              <span className="ml-3 text-shnoor-indigoMedium font-medium">Loading institutes...</span>
            </div>
          ) : allInstitutes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-shnoor-light">
              <Building2 className="mx-auto mb-4 text-shnoor-mist" size={64} />
              <p className="text-shnoor-navy font-medium text-lg">No institutes found</p>
              <p className="text-shnoor-indigoMedium text-sm mt-2">Add your first institute using the form above</p>
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
                  ? 'admin-status-pill is-open'
                  : effectiveStatus === 'paused'
                    ? 'admin-status-pill is-paused'
                    : 'admin-status-pill is-closed';

                if (notYetOpen) {
                  statusBadgeText = 'not yet open';
                  statusBadgeColor = 'admin-status-pill is-not-yet-open';
                } else if (deadlinePassed && effectiveStatus === 'open') {
                  statusBadgeText = 'closed';
                  statusBadgeColor = 'admin-status-pill is-closed';
                }

                const isInstituteSelected = selectedInstitutes.includes(institute.id);

                return (
                  <div
                    key={institute.id}
                    className={`border rounded-2xl p-6 bg-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transition-all ${isInstituteSelected ? 'border-shnoor-indigo border-2 bg-shnoor-indigo/5' : 'border-shnoor-light'
                      }`}
                  >
                    <div className="flex items-start space-x-3 mb-4">
                      <label className="flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={isInstituteSelected}
                          onChange={() => toggleInstituteSelection(institute.id)}
                          className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                        />
                      </label>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-shnoor-navy">
                            {institute.display_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeColor}`}>
                            {statusBadgeText}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-shnoor-indigoMedium">
                          <p className="flex items-center">
                            <Users size={14} className="mr-2" />
                            {institute.student_count} student{institute.student_count !== 1 ? 's' : ''}
                          </p>
                          <p className="flex items-center">
                            <FileSpreadsheet size={14} className="mr-2" />
                            {institute.assigned_tests_count} test{institute.assigned_tests_count !== 1 ? 's' : ''} assigned
                          </p>
                          {institute.registration_start_time && (
                            <p className="flex items-center text-xs text-shnoor-indigoMedium">
                              <Calendar size={12} className="mr-2" />
                              Start: {new Date(institute.registration_start_time).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          )}
                          {institute.registration_deadline && (
                            <p className="flex items-center text-xs text-shnoor-indigoMedium">
                              <Calendar size={12} className="mr-2" />
                              Deadline: {new Date(institute.registration_deadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => handleViewAssignedTests(institute)}
                            className="py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <FileSpreadsheet size={16} className="inline mr-1" />
                            Tests
                          </button>
                          <button
                            onClick={() => handleManageStudents(institute)}
                            className="py-2 px-3 bg-shnoor-successLight text-shnoor-success hover:bg-shnoor-success hover:text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Users size={16} className="inline mr-1" />
                            Students
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInstituteForRegistration(institute);
                              setShowRegistrationControlModal(true);
                            }}
                            className="py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Calendar size={16} className="inline mr-1" />
                            Registration
                          </button>
                          <button
                            onClick={() => handleDeleteInstitute(institute.id, institute.display_name)}
                            className="py-2 px-3 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors text-sm font-medium"
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
                className="p-2 bg-white border border-shnoor-light rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-shnoor-lavender transition-colors"
              >
                <ChevronLeft size={20} className="text-shnoor-indigo" />
              </button>
              <span className="text-sm text-shnoor-navy font-medium">
                Page {instituteCurrentPage} of {instituteTotalPages}
              </span>
              <button
                onClick={() => setInstituteCurrentPage(p => Math.min(instituteTotalPages, p + 1))}
                disabled={instituteCurrentPage === instituteTotalPages}
                className="p-2 bg-white border border-shnoor-light rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-shnoor-lavender transition-colors"
              >
                <ChevronRight size={20} className="text-shnoor-indigo" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutesTab;
