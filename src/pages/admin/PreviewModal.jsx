import React from 'react';
import { X, Loader2, FileSpreadsheet, Check } from 'lucide-react';

const PreviewModal = ({
  previewTest,
  isLoadingPreview,
  previewQuestions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
        <div className="bg-[#44448E] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{previewTest.name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5 font-medium">Preview Questions</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#44448E]" size={28} />
              <span className="ml-3 text-xs font-medium text-slate-500">Loading questions...</span>
            </div>
          ) : previewQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto mb-3 text-slate-300" size={40} />
              <p className="text-sm font-semibold text-slate-700">No questions found</p>
              <p className="text-xs text-slate-400 mt-0.5">This test does not have any questions added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {previewQuestions.map((question, index) => (
                <div key={question.id} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                  {/* Question Card Header */}
                  <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#44448E] text-white font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900 tracking-tight">Question {index + 1}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
                        {question.type === 'coding' ? 'Coding' : 'MCQ'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                      {question.marks || (question.type === 'coding' ? 10 : 1)} Mark{question.marks !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-slate-900 font-semibold text-sm sm:text-base leading-relaxed mb-4">
                    {question.type === 'coding' ? question.title : question.question_text}
                  </p>

                  {question.type === 'coding' ? (
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {question.description || 'No description provided'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-medium">
                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-lg"><strong>Time limit:</strong> {question.timeLimit ?? 'N/A'}s</span>
                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-lg"><strong>Memory:</strong> {question.memoryLimit ?? 'N/A'} MB</span>
                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-lg"><strong>Marks:</strong> {question.marks || 10}</span>
                      </div>
                      {question.publicTestCases?.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Public test cases</p>
                          {question.publicTestCases.map((testCase, testCaseIndex) => (
                            <div key={`${question.id}-test-${testCaseIndex}`} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                              <p className="text-slate-600 font-semibold">Input:</p>
                              <pre className="whitespace-pre-wrap font-mono text-slate-800 bg-white border border-slate-200/60 rounded-lg p-2">{testCase.input || '(empty)'}</pre>
                              <p className="text-slate-600 font-semibold pt-1">Output:</p>
                              <pre className="whitespace-pre-wrap font-mono text-slate-800 bg-white border border-slate-200/60 rounded-lg p-2">{testCase.output || '(empty)'}</pre>
                              {testCase.explanation && <p className="text-slate-500 text-[11px] pt-0.5"><strong>Explanation:</strong> {testCase.explanation}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {[
                        { label: 'A', value: question.option_a },
                        { label: 'B', value: question.option_b },
                        { label: 'C', value: question.option_c },
                        { label: 'D', value: question.option_d }
                      ].filter(opt => opt.value).map((option) => {
                        const isCorrect = question.correct_option === option.label;
                        return (
                          <div
                            key={option.label}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium shadow-2xs'
                                : 'bg-slate-50/40 border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border border-slate-300 text-slate-600'
                              }`}>
                                {option.label}
                              </span>
                              <span className="flex-1 leading-snug">{option.value}</span>
                            </div>
                            {isCorrect && (
                              <span className="ml-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                <Check size={13} className="stroke-[2.5]" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/60">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
