import React from 'react';
import {
  ArrowLeft, FileText, List, AlignLeft, Code, CheckCircle, Plus, Save, Trash2
} from 'lucide-react';
import MCQBankSelector from './MCQBankSelector';

const TestManualStep = ({
  testTitle,
  setStep,
  questions,
  questionInputMode,
  setQuestionInputMode,
  bankSelectorKey,
  handleSelectMcqFromBank,
  jobRoles,
  currentQuestion,
  setCurrentQuestion,
  handleAddQuestion,
  handleManualSubmit,
  isUploading,
  isEditMode,
  setViewMode,
  handleRemoveQuestion
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-6">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-shnoor-mist">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setStep('init')}
            className="p-2 hover:bg-shnoor-lavender rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-shnoor-navy" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-shnoor-navy">{testTitle}</h2>
            <p className="text-sm text-shnoor-navy">Adding questions manually</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-shnoor-lavender px-4 py-2 rounded-lg">
          <span className="text-shnoor-indigo font-bold">{questions.length}</span>
          <span className="text-shnoor-indigo text-sm">Questions Added</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Side */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex rounded-lg border border-shnoor-mist p-1 bg-shnoor-lavender">
            <button
              type="button"
              onClick={() => setQuestionInputMode('type')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                questionInputMode === 'type'
                  ? 'bg-white text-shnoor-indigo shadow-sm'
                  : 'text-shnoor-navy hover:text-shnoor-indigo'
              }`}
            >
              <FileText size={16} />
              Type Manually
            </button>
            <button
              type="button"
              onClick={() => setQuestionInputMode('bank')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                questionInputMode === 'bank'
                  ? 'bg-white text-shnoor-indigo shadow-sm'
                  : 'text-shnoor-navy hover:text-shnoor-indigo'
              }`}
            >
              <List size={16} />
              From Question Bank
            </button>
          </div>

          {questionInputMode === 'bank' ? (
            <MCQBankSelector
              key={bankSelectorKey}
              variant="inline"
              onSelect={handleSelectMcqFromBank}
              selectedQuestionIds={questions.filter((q) => q.bankId).map((q) => q.bankId)}
              selectedRoles={jobRoles}
            />
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-shnoor-navy">Question Text</label>
                  <div className="flex items-center space-x-1 bg-shnoor-lavender rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'paragraph' })}
                      className={`p-2 rounded transition-colors ${
                        currentQuestion.format === 'paragraph'
                          ? 'bg-shnoor-indigo text-white'
                          : 'text-shnoor-navy hover:bg-white'
                      }`}
                      title="Paragraph format (Markdown supported)"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'line' })}
                      className={`p-2 rounded transition-colors ${
                        currentQuestion.format === 'line'
                          ? 'bg-shnoor-indigo text-white'
                          : 'text-shnoor-navy hover:bg-white'
                      }`}
                      title="Line format (preserves line breaks)"
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'code' })}
                      className={`p-2 rounded transition-colors ${
                        currentQuestion.format === 'code'
                          ? 'bg-shnoor-indigo text-white'
                          : 'text-shnoor-navy hover:bg-white'
                      }`}
                      title="Code format (monospace, syntax highlighting)"
                    >
                      <Code size={16} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                  rows={6}
                  className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent text-sm ${
                    currentQuestion.format === 'code' ? 'font-mono' : ''
                  }`}
                  placeholder="Enter Question here"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
                <p className="text-xs text-shnoor-indigoMedium mt-1">
                  {currentQuestion.format === 'paragraph' &&
                    '📝 Paragraph: Supports Markdown formatting (**bold**, *italic*, `code`, lists)'}
                  {currentQuestion.format === 'line' && '📄 Line: Preserves line breaks and spacing'}
                  {currentQuestion.format === 'code' && '💻 Code: Monospace font with syntax highlighting'}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-shnoor-navy">Options</label>
                {currentQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <span className="w-6 text-sm text-shnoor-navy font-medium">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[idx] = e.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${
                        currentQuestion.correctOption === idx
                          ? 'border-shnoor-success bg-shnoor-successLight'
                          : 'border-shnoor-mist'
                      }`}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correctOption: idx })}
                      className={`p-2 rounded-full transition-colors ${
                        currentQuestion.correctOption === idx
                          ? 'bg-shnoor-successLight text-shnoor-success'
                          : 'bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-lavender'
                      }`}
                      title="Mark as correct answer"
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-3 bg-theme-accent hover:bg-theme-accent2 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Question to Test</span>
              </button>
            </>
          )}

          <div className="pt-6 border-t border-shnoor-mist">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={questions.length === 0 || isUploading}
                className={`flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${
                  questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={20} />
                    <span>
                      {isEditMode ? 'Save Changes' : 'Save'} ({questions.length} Questions)
                    </span>
                  </>
                )}
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('init');
                    setViewMode(true);
                  }}
                  disabled={isUploading}
                  className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="bg-shnoor-lavender rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto border border-shnoor-mist">
          <h3 className="font-bold text-shnoor-navy mb-1">Added Questions</h3>
          <p className="text-xs text-shnoor-navy mb-4">
            Questions you add appear here. Remove any with the trash icon before saving the test.
          </p>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-shnoor-navy">
              <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>No questions added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-lg border border-shnoor-mist shadow-sm">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-xs text-shnoor-navy bg-shnoor-lavender px-2 py-1 rounded">
                        Q{idx + 1}
                      </span>
                      {q.fromBank && (
                        <span className="text-xs text-shnoor-indigo bg-shnoor-lavender px-2 py-0.5 rounded">
                          Bank
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="p-1.5 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg flex-shrink-0"
                      title="Remove question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-shnoor-navy mb-2 line-clamp-2">{q.text}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          q.correctOption === i
                            ? 'bg-shnoor-successLight text-shnoor-success font-medium'
                            : 'text-shnoor-navy'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestManualStep;
