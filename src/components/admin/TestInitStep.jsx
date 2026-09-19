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
    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-shnoor-navy">
          {isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}
        </h2>
        {viewMode && (
          <button
            onClick={() => setViewMode(false)}
            className="px-4 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-indigo transition-colors font-medium flex items-center space-x-2"
          >
            <Pencil size={18} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Test Title */}
        <div>
          <label className="block text-sm font-bold text-shnoor-navy mb-2">Test Title *</label>
          <div className="relative">
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              disabled={viewMode}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:border-shnoor-indigo focus:ring-shnoor-indigo/20 transition-all font-medium text-shnoor-navy shadow-sm pr-10 ${
                viewMode
                  ? 'bg-shnoor-light opacity-50 cursor-not-allowed border-shnoor-light'
                  : nameAvailability.available === false
                  ? 'border-shnoor-danger bg-shnoor-dangerLight'
                  : nameAvailability.available === true
                  ? 'border-shnoor-success bg-white'
                  : 'border-shnoor-light bg-white'
              }`}
              placeholder="e.g., Java Fundamentals - Batch A"
              required
            />
            {nameAvailability.checking && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-shnoor-navy animate-spin" />
              </div>
            )}
            {!nameAvailability.checking && nameAvailability.available === true && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-shnoor-success" />
              </div>
            )}
            {!nameAvailability.checking && nameAvailability.available === false && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-5 h-5 text-shnoor-danger" />
              </div>
            )}
          </div>
          {nameAvailability.message && (
            <p
              className={`mt-2 text-sm ${
                nameAvailability.available ? 'text-shnoor-success' : 'text-shnoor-danger'
              }`}
            >
              {nameAvailability.message}
            </p>
          )}
        </div>

        {/* Job Roles Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-shnoor-navy">Job Roles & Descriptions</label>
            {!viewMode && (
              <button
                type="button"
                onClick={handleAddJobRole}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white text-shnoor-indigo hover:text-shnoor-navy rounded-lg hover:bg-shnoor-light/30 border border-shnoor-light transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                <span>Add Role</span>
              </button>
            )}
          </div>

          {jobRoles.map((role, index) => (
            <div key={index} className="p-5 border border-shnoor-light rounded-xl space-y-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-shnoor-navy">
                  Role {index + 1}{' '}
                  {index === 0 && (
                    <span className="text-shnoor-indigo ml-2 px-2 py-1 bg-shnoor-lavender rounded-md text-xs">
                      (Default)
                    </span>
                  )}
                </span>
                {!viewMode && jobRoles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveJobRole(index)}
                    className="text-shnoor-danger hover:text-shnoor-danger p-1"
                    title="Remove this role"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={role.job_role}
                  onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                  disabled={viewMode}
                  className={`w-full px-4 py-3 border-2 border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-indigo/20 focus:border-shnoor-indigo transition-all font-medium text-shnoor-navy ${
                    viewMode ? 'bg-shnoor-light opacity-50 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="e.g., Senior Software Engineer, Junior Developer"
                />
              </div>

              <div>
                <textarea
                  value={role.job_description}
                  onChange={(e) => handleJobRoleChange(index, 'job_description', e.target.value)}
                  rows={4}
                  disabled={viewMode}
                  className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y ${
                    viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter job description, requirements, responsibilities..."
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-shnoor-navy">
            Students will be able to select a role and view its description before taking the test
          </p>
        </div>

        {/* Duration, Max Attempts, Passing % */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Duration (minutes) *</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              min="1"
              disabled={viewMode}
              className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Max Attempts *</label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              min="1"
              disabled={viewMode}
              className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Passing % *</label>
            <input
              type="number"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
              disabled={viewMode}
              className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
              }`}
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        {/* Start and End DateTime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Start Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              disabled={viewMode}
              className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">End Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              disabled={viewMode}
              className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''
              }`}
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
