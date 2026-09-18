import React from 'react';
import { X, Loader2, FileSpreadsheet } from 'lucide-react';

const PreviewModal = ({
  previewTest,
  isLoadingPreview,
  previewQuestions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">{previewTest.name}</h3>
            <p className="text-shnoor-lavender text-sm mt-1">Preview Questions</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
              <span className="ml-3 text-shnoor-indigoMedium">Loading questions...</span>
            </div>
          ) : previewQuestions.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
              <p className="text-shnoor-indigoMedium">No questions found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {previewQuestions.map((question, index) => (
                <div key={question.id} className="p-4 bg-white rounded-xl border border-shnoor-light">
                  <div className="flex items-start space-x-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-shnoor-lavender text-shnoor-indigo rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="inline-block mb-2 px-2 py-1 rounded text-xs font-bold bg-shnoor-lavender text-shnoor-indigo">
                        {question.type === 'coding' ? 'Coding' : 'MCQ'}
                      </span>
                      <p className="text-shnoor-navy font-medium">
                        {question.type === 'coding' ? question.title : question.question_text}
                      </p>
                    </div>
                  </div>
                  {question.type === 'coding' ? (
                    <div className="ml-11 space-y-3">
                      <p className="text-sm text-shnoor-indigoMedium whitespace-pre-wrap">
                        {question.description || 'No description provided'}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-shnoor-indigoMedium">
                        <span><strong>Time limit:</strong> {question.timeLimit ?? 'N/A'}s</span>
                        <span><strong>Memory:</strong> {question.memoryLimit ?? 'N/A'} MB</span>
                        <span><strong>Marks:</strong> {question.marks || 10}</span>
                      </div>
                      {question.publicTestCases?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-shnoor-navy">Public test cases</p>
                          {question.publicTestCases.map((testCase, testCaseIndex) => (
                            <div key={`${question.id}-test-${testCaseIndex}`} className="p-3 rounded-lg bg-shnoor-lavender border border-shnoor-light text-sm">
                              <p className="text-shnoor-indigoMedium"><strong>Input:</strong></p>
                              <pre className="whitespace-pre-wrap font-mono text-shnoor-indigoMedium bg-white/60 rounded px-2 py-1 mt-1">{testCase.input || '(empty)'}</pre>
                              <p className="text-shnoor-indigoMedium mt-2"><strong>Output:</strong></p>
                              <pre className="whitespace-pre-wrap font-mono text-shnoor-indigoMedium bg-white/60 rounded px-2 py-1 mt-1">{testCase.output || '(empty)'}</pre>
                              {testCase.explanation && <p className="mt-1 text-shnoor-soft"><strong>Explanation:</strong> {testCase.explanation}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ml-11 space-y-2">
                      {[
                        { label: 'A', value: question.option_a },
                        { label: 'B', value: question.option_b },
                        { label: 'C', value: question.option_c },
                        { label: 'D', value: question.option_d }
                      ].filter(opt => opt.value).map((option) => (
                        <div
                          key={option.label}
                          className={`p-3 rounded-lg border ${question.correct_option === option.label
                            ? 'bg-shnoor-successLight border-shnoor-success text-shnoor-success'
                            : 'bg-white border-shnoor-light text-shnoor-indigoMedium'
                            }`}
                        >
                          <span className="font-bold mr-2">{option.label}.</span>
                          {option.value}
                          {question.correct_option === option.label && (
                            <span className="ml-2 text-xs font-bold text-shnoor-success">(Correct Answer)</span>
                          )}
                        </div>
                      ))}
                      <div className="text-sm text-shnoor-indigoMedium mt-2">
                        <span className="font-bold">Marks:</span> {question.marks || 1}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-shnoor-light flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
