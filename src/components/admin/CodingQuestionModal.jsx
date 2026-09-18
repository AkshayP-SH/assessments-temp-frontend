import React from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

const CodingQuestionModal = ({
  editingCodingQuestionId,
  currentCodingQuestion,
  setCurrentCodingQuestion,
  handleAddPublicTestCase,
  handleRemovePublicTestCase,
  handleAddHiddenTestCase,
  handleRemoveHiddenTestCase,
  handleSaveCodingQuestion,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-shnoor-navy">
            {editingCodingQuestionId ? 'Edit Coding Question' : 'Add Coding Question'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
          >
            <X size={20} className="text-shnoor-navy" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Question Title *</label>
            <input
              type="text"
              value={currentCodingQuestion.title}
              onChange={(e) =>
                setCurrentCodingQuestion({ ...currentCodingQuestion, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
              placeholder="e.g., Two Sum Problem"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-shnoor-navy mb-2">Problem Description *</label>
            <textarea
              value={currentCodingQuestion.description}
              onChange={(e) =>
                setCurrentCodingQuestion({ ...currentCodingQuestion, description: e.target.value })
              }
              rows={6}
              className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
              placeholder="Describe the problem, constraints, and requirements..."
            />
          </div>

          {/* Marks, Time Limit, Memory Limit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-shnoor-navy mb-2">Marks *</label>
              <input
                type="number"
                value={currentCodingQuestion.marks}
                onChange={(e) =>
                  setCurrentCodingQuestion({
                    ...currentCodingQuestion,
                    marks: parseInt(e.target.value) || 10
                  })
                }
                min="1"
                className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-shnoor-navy mb-2">Time Limit (sec) *</label>
              <input
                type="number"
                value={currentCodingQuestion.timeLimit}
                onChange={(e) =>
                  setCurrentCodingQuestion({
                    ...currentCodingQuestion,
                    timeLimit: parseFloat(e.target.value) || 2
                  })
                }
                step="0.1"
                min="0.1"
                className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-shnoor-navy mb-2">Memory Limit (MB) *</label>
              <input
                type="number"
                value={currentCodingQuestion.memoryLimit}
                onChange={(e) =>
                  setCurrentCodingQuestion({
                    ...currentCodingQuestion,
                    memoryLimit: parseInt(e.target.value) || 256
                  })
                }
                min="1"
                className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
              />
            </div>
          </div>

          {/* Public Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-shnoor-navy">Public Test Cases *</label>
              <button
                type="button"
                onClick={handleAddPublicTestCase}
                className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-indigo hover:text-white transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                <span>Add Test Case</span>
              </button>
            </div>
            <div className="space-y-3">
              {currentCodingQuestion.publicTestCases.map((tc, idx) => (
                <div key={idx} className="p-4 border border-shnoor-mist rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-shnoor-navy">Test Case {idx + 1}</span>
                    {currentCodingQuestion.publicTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePublicTestCase(idx)}
                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-shnoor-navy mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => {
                          const newTestCases = [...currentCodingQuestion.publicTestCases];
                          newTestCases[idx].input = e.target.value;
                          setCurrentCodingQuestion({
                            ...currentCodingQuestion,
                            publicTestCases: newTestCases
                          });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                        placeholder="Input data"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-shnoor-navy mb-1">Expected Output</label>
                      <textarea
                        value={tc.output}
                        onChange={(e) => {
                          const newTestCases = [...currentCodingQuestion.publicTestCases];
                          newTestCases[idx].output = e.target.value;
                          setCurrentCodingQuestion({
                            ...currentCodingQuestion,
                            publicTestCases: newTestCases
                          });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                        placeholder="Expected output"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-shnoor-navy mb-1">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={tc.explanation}
                      onChange={(e) => {
                        const newTestCases = [...currentCodingQuestion.publicTestCases];
                        newTestCases[idx].explanation = e.target.value;
                        setCurrentCodingQuestion({
                          ...currentCodingQuestion,
                          publicTestCases: newTestCases
                        });
                      }}
                      className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                      placeholder="Explain this test case"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-shnoor-navy">Hidden Test Cases *</label>
              <button
                type="button"
                onClick={handleAddHiddenTestCase}
                className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-indigo hover:text-white transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                <span>Add Test Case</span>
              </button>
            </div>
            <div className="space-y-3">
              {currentCodingQuestion.hiddenTestCases.map((tc, idx) => (
                <div key={idx} className="p-4 border border-shnoor-mist rounded-lg space-y-3 bg-shnoor-lavender/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-shnoor-navy">Hidden Test Case {idx + 1}</span>
                    {currentCodingQuestion.hiddenTestCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHiddenTestCase(idx)}
                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-shnoor-navy mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => {
                          const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                          newTestCases[idx].input = e.target.value;
                          setCurrentCodingQuestion({
                            ...currentCodingQuestion,
                            hiddenTestCases: newTestCases
                          });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                        placeholder="Input data"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-shnoor-navy mb-1">Expected Output</label>
                      <textarea
                        value={tc.output}
                        onChange={(e) => {
                          const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                          newTestCases[idx].output = e.target.value;
                          setCurrentCodingQuestion({
                            ...currentCodingQuestion,
                            hiddenTestCases: newTestCases
                          });
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                        placeholder="Expected output"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-shnoor-mist">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg hover:bg-shnoor-mist transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCodingQuestion}
              className="px-6 py-3 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-navy transition-colors flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{editingCodingQuestionId ? 'Update Question' : 'Add Question'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionModal;
