import React from 'react';
import {
  Pencil, Loader2, CheckCircle, AlertCircle, Plus,
  Trash2, List, Code, Eye, FileText, ArrowLeft, Upload, Save
} from 'lucide-react';

const TestInitStep = ({
  isEditMode,
  viewMode,
  setViewMode,
  testTitle,
  setTestTitle,
  nameAvailability,
  jobRoles,
  handleAddJobRole,
  handleRemoveJobRole,
  handleJobRoleChange,
  duration,
  setDuration,
  maxAttempts,
  setMaxAttempts,
  passingPercentage,
  setPassingPercentage,
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
  setEditingCodingQuestionId,
  setCurrentCodingQuestion,
  setShowCodingModal,
  setShowCodingSelector,
  codingQuestions,
  handleViewCodingQuestion,
  handleEditCodingQuestion,
  handleRemoveCodingQuestion,
  questions,
  handleStart,
  handleManualSubmit,
  isUploading
}) => {
  return (
    <div className="surface-card max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="section-title text-xl">
            {isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}
          </h2>
          <p className="section-subtitle">Configure assessment details, job roles, duration, and questions</p>
        </div>
        {viewMode && (
          <button
            onClick={() => setViewMode(false)}
            className="btn-secondary"
          >
            <Pencil size={15} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Test Title */}
        <div>
          <label className="form-label">Test Title <span className="required">*</span></label>
          <div className="relative">
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              disabled={viewMode}
              className={`form-input pr-10 ${
                viewMode
                  ? 'opacity-50 cursor-not-allowed bg-slate-50'
                  : nameAvailability.available === false
                  ? 'border-red-400 bg-red-50/20'
                  : nameAvailability.available === true
                  ? 'border-emerald-400'
                  : ''
              }`}
              placeholder="e.g., Java Fundamentals - Batch A"
              required
            />
            {nameAvailability.checking && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            )}
            {!nameAvailability.checking && nameAvailability.available === true && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            {!nameAvailability.checking && nameAvailability.available === false && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          {nameAvailability.message && (
            <p
              className={`mt-1.5 text-xs font-medium ${
                nameAvailability.available ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {nameAvailability.message}
            </p>
          )}
        </div>

        {/* Job Roles Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="form-label mb-0">Job Roles &amp; Descriptions</label>
            {!viewMode && (
              <button
                type="button"
                onClick={handleAddJobRole}
                className="btn-secondary !py-1 !px-2.5 text-xs"
              >
                <Plus size={14} />
                <span>Add Role</span>
              </button>
            )}
          </div>

          {jobRoles.map((role, index) => (
            <div key={index} className="subsurface-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800">
                    Role {index + 1}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-md text-[11px] font-semibold">
                      Default
                    </span>
                  )}
                </div>
                {!viewMode && jobRoles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveJobRole(index)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Remove this role"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={role.job_role}
                  onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                  disabled={viewMode}
                  className="form-input"
                  placeholder="e.g., Senior Software Engineer, Junior Developer"
                />
              </div>

              <div>
                <textarea
                  value={role.job_description}
                  onChange={(e) => handleJobRoleChange(index, 'job_description', e.target.value)}
                  rows={4}
                  disabled={viewMode}
                  className="form-textarea resize-y"
                  placeholder="Enter job description, requirements, responsibilities..."
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-500">
            Students will be able to select a role and view its description before taking the test
          </p>
        </div>

        {/* Duration, Max Attempts, Passing % */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="form-label">Duration (minutes) <span className="required">*</span></label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              min="1"
              disabled={viewMode}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">Max Attempts <span className="required">*</span></label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              min="1"
              disabled={viewMode}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">Passing % <span className="required">*</span></label>
            <input
              type="number"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
              disabled={viewMode}
              className="form-input"
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        {/* Start and End DateTime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Start Date &amp; Time (Optional)</label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              disabled={viewMode}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">End Date &amp; Time (Optional)</label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              disabled={viewMode}
              className="form-input"
            />
          </div>
        </div>

        {/* Add Coding Question Buttons */}
        {!viewMode && (
          <div className="pt-4 border-t border-shnoor-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingCodingQuestionId(null);
                  setCurrentCodingQuestion({
                    title: '',
                    description: '',
                    publicTestCases: [{ input: '', output: '', explanation: '' }],
                    hiddenTestCases: [{ input: '', output: '' }],
                    timeLimit: 2,
                    memoryLimit: 256,
                    marks: 10
                  });
                  setShowCodingModal(true);
                }}
                className="py-3 bg-white border-2 border-shnoor-mist hover:border-shnoor-indigo text-shnoor-navy hover:text-shnoor-indigo font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Create New Coding Question</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCodingSelector(true)}
                className="py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <List size={20} />
                <span>Select from Question Bank</span>
              </button>
            </div>
          </div>
        )}

        {/* Coding Questions List */}
        {codingQuestions.length > 0 && (
          <div className="pt-4 space-y-3">
            <h4 className="font-semibold text-shnoor-navy mb-3">Coding Questions ({codingQuestions.length})</h4>
            {codingQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white border-2 border-shnoor-mist rounded-lg p-4 hover:border-shnoor-mist transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-shnoor-navy" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-shnoor-navy">Coding Question {idx + 1}</h4>
                      <p className="text-sm text-shnoor-navy">{q.title}</p>
                      <p className="text-xs text-shnoor-indigo mt-1">Marks: {q.marks || 10}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleViewCodingQuestion(q)}
                      className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy rounded-lg transition-colors"
                      title="View question"
                    >
                      <Eye size={18} />
                    </button>
                    {!viewMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditCodingQuestion(q)}
                          className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-indigo rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCodingQuestion(q.id)}
                          className="p-2 bg-shnoor-dangerLight hover:bg-shnoor-dangerLight text-shnoor-danger rounded-lg transition-colors"
                          title="Delete question"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditMode ? (
          /* Edit Mode: Show options to edit manually or upload new file */
          <div className="pt-6">
            <div className="bg-shnoor-lavender border-2 border-shnoor-mist rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-shnoor-indigo rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-shnoor-navy">Current Questions</h3>
                  <p className="text-sm text-shnoor-navy">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} loaded
                  </p>
                </div>
              </div>
              {!viewMode && (
                <p className="text-sm text-shnoor-navy">
                  Choose how you want to update the questions for this test.
                </p>
              )}
            </div>

            {!viewMode && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handleStart('manual')}
                    className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo hover:shadow-lg group bg-white"
                  >
                    <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                      <FileText className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                    </div>
                    <h3 className="font-bold text-shnoor-navy mb-2">Edit Questions Manually</h3>
                    <p className="text-sm text-shnoor-navy mb-3">
                      Edit existing questions, add new ones, or remove questions individually.
                    </p>
                    <div className="flex items-center text-xs text-shnoor-indigo font-medium">
                      <span>
                        Edit {questions.length} question{questions.length !== 1 ? 's' : ''}
                      </span>
                      <ArrowLeft size={14} className="ml-1 rotate-180" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStart('bulk')}
                    className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-danger hover:shadow-lg group bg-white"
                  >
                    <div className="w-12 h-12 bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-danger transition-colors">
                      <Upload className="w-6 h-6 text-shnoor-danger group-hover:text-white" />
                    </div>
                    <h3 className="font-bold text-shnoor-navy mb-2">Upload New Questions File</h3>
                    <p className="text-sm text-shnoor-navy mb-3">
                      Replace all existing questions by uploading a new CSV/Excel file.
                    </p>
                    <div className="flex items-center text-xs text-shnoor-danger font-medium">
                      <AlertCircle size={14} className="mr-1" />
                      <span>
                        Will replace {questions.length} question{questions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="bg-shnoor-warningLight border-2 border-shnoor-warningLight rounded-xl p-4 flex items-start space-x-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-shnoor-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-shnoor-warning">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Review test details above before proceeding</li>
                      <li>
                        Uploading a new file will <strong>delete all existing questions</strong>
                      </li>
                      <li>Changes will be saved when you click "Save Changes"</li>
                    </ul>
                  </div>
                </div>

                {/* Save Changes and Cancel Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isUploading}
                    className="flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode(true)}
                    disabled={isUploading}
                    className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Create Mode: Show manual and bulk upload options */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => handleStart('manual')}
              className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${
                !testTitle || nameAvailability.available === false || nameAvailability.checking
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
              }`}
              disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
            >
              <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                <Plus className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
              </div>
              <h3 className="font-bold text-shnoor-navy mb-1">Manual Entry</h3>
              <p className="text-sm text-shnoor-navy">Add questions one by one with a simple form interface.</p>
            </button>

            <button
              type="button"
              onClick={() => handleStart('bulk')}
              className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${
                !testTitle || nameAvailability.available === false || nameAvailability.checking
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
              }`}
              disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
            >
              <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                <Upload className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
              </div>
              <h3 className="font-bold text-shnoor-navy mb-1">Bulk Upload</h3>
              <p className="text-sm text-shnoor-navy">Upload an Excel or CSV file containing multiple questions.</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestInitStep;
