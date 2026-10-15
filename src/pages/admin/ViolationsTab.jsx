import { formatDateTime } from '../../utils/dateTime';
import React from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Select from 'react-select';

const ViolationsTab = ({
  tests = [],
  selectedTestForViolations,
  setSelectedTestForViolations,
  violationsByStudent = [],
  flaggedStudents = [],
  isLoadingViolations = false,
  exportViolationsToExcel
}) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-header-left">
          <h2 className="section-title">Violations</h2>
          <p className="section-subtitle">Monitor detected suspicious activities during exams</p>
        </div>
        {selectedTestForViolations && violationsByStudent.length > 0 && (
          <button
            onClick={exportViolationsToExcel}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
            title="Export Violations Report"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* Test Selector & Violations Card */}
      <div className="surface-card p-6 sm:p-8">
        {/* Test Selector */}
        <div className="mb-6 max-w-2xl">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2.5">
            Select Test to View Violations
          </label>
          <Select
            options={tests.map((test) => ({
              value: test.id,
              label: `${test.name} (${test.attempts} attempts)`
            }))}
            value={selectedTestForViolations ? {
              value: selectedTestForViolations,
              label: tests.find(t => t.id === selectedTestForViolations)
                ? `${tests.find(t => t.id === selectedTestForViolations).name} (${tests.find(t => t.id === selectedTestForViolations).attempts} attempts)`
                : 'Select a test...'
            } : null}
            onChange={(selectedOption) => setSelectedTestForViolations(selectedOption ? selectedOption.value : '')}
            placeholder="Select a test..."
            isSearchable={true}
            isClearable={true}
            className="basic-single"
            classNamePrefix="select"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '44px',
                borderRadius: '0.75rem',
                backgroundColor: 'rgb(var(--theme-card))',
                borderColor: state.isFocused ? '#403f75' : 'rgb(var(--theme-shell-stroke))',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(64, 63, 117, 0.15)' : 'none',
                padding: '2px 4px',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#403f75'
                }
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '2px 8px',
                gap: '4px',
              }),
              singleValue: (base) => ({
                ...base,
                color: 'rgb(var(--theme-text))',
              }),
              input: (base) => ({
                ...base,
                color: 'rgb(var(--theme-text))',
                margin: '0 4px',
                padding: 0,
              }),
              placeholder: (base) => ({
                ...base,
                color: 'rgb(var(--theme-text-muted))',
                fontSize: '0.875rem',
                marginLeft: '4px',
                marginRight: '4px',
              }),
              menu: (base) => ({
                ...base,
                maxHeight: '300px',
                backgroundColor: 'rgb(var(--theme-card))',
                border: '1px solid rgb(var(--theme-border))',
                zIndex: 9999,
              }),
              menuList: (base) => ({
                ...base,
                maxHeight: '300px',
                overflowY: 'auto',
                '::-webkit-scrollbar': {
                  width: '8px',
                },
                '::-webkit-scrollbar-track': {
                  background: 'rgb(var(--theme-panel))',
                  borderRadius: '10px',
                },
                '::-webkit-scrollbar-thumb': {
                  background: 'rgb(var(--theme-border))',
                  borderRadius: '10px',
                },
                '::-webkit-scrollbar-thumb:hover': {
                  background: 'rgb(var(--theme-accent))',
                },
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? 'rgb(var(--theme-accent))'
                  : state.isFocused
                    ? 'rgb(var(--theme-panel))'
                    : 'rgb(var(--theme-card))',
                color: state.isSelected ? 'white' : 'rgb(var(--theme-text))',
                cursor: 'pointer',
                padding: '10px 12px',
              }),
            }}
            menuPortalTarget={document.body}
          />
        </div>

        {selectedTestForViolations && (
          <>
            {/* Flagged Students */}
            {flaggedStudents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-shnoor-navy mb-4 flex items-center">
                  <AlertCircle className="mr-2 text-shnoor-indigo" size={20} />
                  Flagged Students (3+ High Severity Violations)
                </h3>
                <div className="space-y-3">
                  {flaggedStudents.map((student) => (
                    <div
                      key={student.student_id}
                      className="p-4 bg-shnoor-lavender border border-shnoor-light rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-shnoor-navy">{student.student_name}</h4>
                          <p className="text-sm text-shnoor-indigoMedium">{student.student_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-shnoor-indigo">{student.total_violations}</p>
                          <p className="text-xs text-shnoor-indigoMedium">Total Violations</p>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-4 text-sm">
                        <span className="px-3 py-1 bg-shnoor-indigo text-white rounded-full font-medium">
                          High: {student.high_severity_count}
                        </span>
                        <span className="px-3 py-1 bg-shnoor-indigoMedium text-white rounded-full font-medium">
                          Medium: {student.medium_severity_count}
                        </span>
                        <span className="text-shnoor-indigoMedium">
                          Last: {formatDateTime(student.last_violation)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Violations Table */}
            {isLoadingViolations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                <span className="ml-3 text-shnoor-indigoMedium">Loading violations...</span>
              </div>
            ) : violationsByStudent.length === 0 ? (
              <div className="text-center py-12 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                <CheckCircle className="mx-auto mb-2 text-shnoor-indigo" size={48} />
                <p className="text-shnoor-navy font-medium">No violations detected</p>
                <p className="text-sm text-shnoor-indigoMedium mt-1">All students followed exam guidelines</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <h3 className="text-lg font-bold text-shnoor-navy mb-4">
                  Student Violations Summary
                </h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-shnoor-lavender border-b-2 border-shnoor-light">
                      <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Student ID</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Phone</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">No Face</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Multiple Faces</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Phone Detected</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Loud Noise</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Voice Detected</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationsByStudent.map((student) => (
                      <tr
                        key={student.student_id}
                        className={`border-b border-shnoor-light hover:bg-shnoor-lavender transition-colors ${student.total_violations >= 5 ? 'bg-shnoor-lavender/50' : ''
                          }`}
                      >
                        <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-shnoor-navy">{student.student_name}</td>
                        <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_email}</td>
                        <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.no_face_count > 0
                                ? 'bg-shnoor-indigo/10 text-shnoor-indigo'
                                : 'bg-shnoor-lavender text-shnoor-soft'
                              }`}
                          >
                            {student.no_face_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.multiple_faces_count > 0
                                ? 'bg-shnoor-indigo/10 text-shnoor-indigo'
                                : 'bg-shnoor-lavender text-shnoor-soft'
                              }`}
                          >
                            {student.multiple_faces_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.phone_detected_count > 0
                                ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium'
                                : 'bg-shnoor-lavender text-shnoor-soft'
                              }`}
                          >
                            {student.phone_detected_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.loud_noise_count > 0
                                ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium'
                                : 'bg-shnoor-lavender text-shnoor-soft'
                              }`}
                          >
                            {student.loud_noise_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.voice_detected_count > 0
                                ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium'
                                : 'bg-shnoor-lavender text-shnoor-soft'
                              }`}
                          >
                            {student.voice_detected_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.total_violations >= 5
                                ? 'bg-shnoor-indigo text-white'
                                : student.total_violations >= 3
                                  ? 'bg-shnoor-indigoMedium text-white'
                                  : 'bg-shnoor-lavender text-shnoor-indigo'
                              }`}
                          >
                            {student.total_violations}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViolationsTab;
