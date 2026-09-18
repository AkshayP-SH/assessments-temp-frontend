import React from 'react';
import { X, Loader2, Plus, Trash2, Pencil } from 'lucide-react';

const JobModal = ({
  selectedJobTest,
  jobRoles,
  selectedJobRoleIndex,
  setSelectedJobRoleIndex,
  isEditingJob,
  setIsEditingJob,
  isSavingJob,
  isLoadingJobRoles,
  handleJobRoleChange,
  handleAddJobRole,
  handleRemoveJobRole,
  handleSaveJobRoles,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">{selectedJobTest?.name}</h3>
            <p className="text-shnoor-lavender text-sm mt-1">Job Role & Description</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoadingJobRoles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
              <span className="ml-3 text-shnoor-indigoMedium">Loading job roles...</span>
            </div>
          ) : (
            <>
              {!isEditingJob && jobRoles.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-shnoor-navy mb-2">
                    Select Job Role
                  </label>
                  <select
                    value={selectedJobRoleIndex}
                    onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
                  >
                    {jobRoles.map((role, index) => (
                      <option key={index} value={index}>
                        {role.jobRole}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isEditingJob ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-shnoor-navy">
                      Job Roles & Descriptions
                    </label>
                    <button
                      type="button"
                      onClick={handleAddJobRole}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-lavender transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      <span>Add Role</span>
                    </button>
                  </div>

                  {jobRoles.map((role, index) => (
                    <div key={index} className="p-4 border border-shnoor-light rounded-lg space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-shnoor-indigo">
                          Role {index + 1} {index === 0 && <span className="text-shnoor-indigo">(Default)</span>}
                        </span>
                        {jobRoles.length > 1 && (
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
                          value={role.jobRole}
                          onChange={(e) => handleJobRoleChange(index, 'jobRole', e.target.value)}
                          className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
                          placeholder="e.g., Senior Software Engineer"
                        />
                      </div>

                      <div>
                        <textarea
                          value={role.jobDescription}
                          onChange={(e) => handleJobRoleChange(index, 'jobDescription', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy resize-none"
                          placeholder="Enter job description, requirements, responsibilities..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-shnoor-navy mb-2">
                      Job Role
                    </label>
                    <div className="px-4 py-3 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                      <p className="text-shnoor-navy font-semibold">
                        {jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-shnoor-navy mb-2">
                      Job Description
                    </label>
                    <div className="px-4 py-3 bg-shnoor-lavender rounded-xl border border-shnoor-light max-h-96 overflow-y-auto">
                      <p className="text-shnoor-indigoMedium whitespace-pre-wrap">
                        {jobRoles[selectedJobRoleIndex]?.jobDescription || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-shnoor-light flex justify-end space-x-3">
          {isEditingJob ? (
            <>
              <button
                onClick={() => setIsEditingJob(false)}
                className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                disabled={isSavingJob}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveJobRoles}
                disabled={isSavingJob}
                className="px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSavingJob && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                <span>{isSavingJob ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setIsEditingJob(true)}
                className="px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                title="Edit Roles"
              >
                <Pencil size={18} />
                <span>Edit</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobModal;
