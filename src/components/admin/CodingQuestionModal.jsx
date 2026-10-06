import React from 'react';
import { Code, Plus, Trash2, Save, EyeOff } from 'lucide-react';
import ModalShell, {
  ModalButton,
  FieldLabel,
  SectionTitle,
  modalInputClass,
  modalTextareaClass
} from './ModalShell';

const AddTestCaseButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 text-[13px] font-medium text-shnoor-indigo hover:text-shnoor-navyLight transition-colors"
  >
    <Plus size={14} />
    Add test case
  </button>
);

const RemoveTestCaseButton = ({ canRemove, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!canRemove}
    title={canRemove ? 'Remove test case' : 'At least one test case is required'}
    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
  >
    <Trash2 size={15} />
  </button>
);

const SuffixInput = ({ suffix, ...props }) => (
  <div className="relative">
    <input type="number" className={`${modalInputClass} pr-14`} {...props} />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
      {suffix}
    </span>
  </div>
);

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
  const publicCount = currentCodingQuestion.publicTestCases.length;
  const hiddenCount = currentCodingQuestion.hiddenTestCases.length;

  return (
    <ModalShell
      icon={Code}
      title={editingCodingQuestionId ? 'Edit Coding Question' : 'Add Coding Question'}
      subtitle="Define the problem, limits and test cases"
      onClose={onClose}
      size="md"
      footerStart={`${publicCount} public · ${hiddenCount} hidden test case${hiddenCount !== 1 ? 's' : ''}`}
      footerActions={
        <>
          <ModalButton variant="outline" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton icon={editingCodingQuestionId ? Save : Plus} onClick={handleSaveCodingQuestion}>
            {editingCodingQuestionId ? 'Update Question' : 'Add Question'}
          </ModalButton>
        </>
      }
    >
      {/* Problem */}
      <section>
        <SectionTitle>Problem</SectionTitle>
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="coding-title" required>Question title</FieldLabel>
            <input
              id="coding-title"
              type="text"
              value={currentCodingQuestion.title}
              onChange={(e) =>
                setCurrentCodingQuestion({ ...currentCodingQuestion, title: e.target.value })
              }
              className={modalInputClass}
              placeholder="e.g., Two Sum Problem"
            />
          </div>
          <div>
            <FieldLabel htmlFor="coding-description" required>Problem description</FieldLabel>
            <textarea
              id="coding-description"
              value={currentCodingQuestion.description}
              onChange={(e) =>
                setCurrentCodingQuestion({ ...currentCodingQuestion, description: e.target.value })
              }
              rows={5}
              className={modalTextareaClass}
              placeholder="Describe the problem, constraints, and requirements..."
            />
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="pt-5 border-t border-shnoor-mist">
        <SectionTitle>Limits</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="coding-marks" required>Marks</FieldLabel>
            <SuffixInput
              id="coding-marks"
              suffix="marks"
              value={currentCodingQuestion.marks}
              onChange={(e) =>
                setCurrentCodingQuestion({
                  ...currentCodingQuestion,
                  marks: parseInt(e.target.value) || 10
                })
              }
              min="1"
            />
          </div>
          <div>
            <FieldLabel htmlFor="coding-time" required>Time limit</FieldLabel>
            <SuffixInput
              id="coding-time"
              suffix="sec"
              value={currentCodingQuestion.timeLimit}
              onChange={(e) =>
                setCurrentCodingQuestion({
                  ...currentCodingQuestion,
                  timeLimit: parseFloat(e.target.value) || 2
                })
              }
              step="0.1"
              min="0.1"
            />
          </div>
          <div>
            <FieldLabel htmlFor="coding-memory" required>Memory limit</FieldLabel>
            <SuffixInput
              id="coding-memory"
              suffix="MB"
              value={currentCodingQuestion.memoryLimit}
              onChange={(e) =>
                setCurrentCodingQuestion({
                  ...currentCodingQuestion,
                  memoryLimit: parseInt(e.target.value) || 256
                })
              }
              min="1"
            />
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section className="pt-5 border-t border-shnoor-mist space-y-5">
        <SectionTitle>Test Cases</SectionTitle>

        {/* Public */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-shnoor-navy">
              Public test cases<span className="text-red-500 ml-0.5">*</span>
            </span>
            <AddTestCaseButton onClick={handleAddPublicTestCase} />
          </div>
          <div className="space-y-3">
            {currentCodingQuestion.publicTestCases.map((tc, idx) => (
              <div key={idx} className="rounded-xl border border-shnoor-mist p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-shnoor-navy">Test case {idx + 1}</span>
                  <RemoveTestCaseButton
                    canRemove={publicCount > 1}
                    onClick={() => handleRemovePublicTestCase(idx)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Input</FieldLabel>
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
                      className={`${modalTextareaClass} font-mono text-[13px]`}
                      placeholder="Input data"
                    />
                  </div>
                  <div>
                    <FieldLabel>Expected output</FieldLabel>
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
                      className={`${modalTextareaClass} font-mono text-[13px]`}
                      placeholder="Expected output"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>
                    Explanation <span className="font-normal text-gray-400">(optional)</span>
                  </FieldLabel>
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
                    className={modalInputClass}
                    placeholder="Explain this test case"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-shnoor-navy">
              Hidden test cases<span className="text-red-500 ml-0.5">*</span>
            </span>
            <AddTestCaseButton onClick={handleAddHiddenTestCase} />
          </div>
          <div className="space-y-3">
            {currentCodingQuestion.hiddenTestCases.map((tc, idx) => (
              <div key={idx} className="rounded-xl border border-shnoor-mist p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-shnoor-navy">Test case {idx + 1}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-shnoor-lavender text-shnoor-indigo text-[11px] font-medium">
                      <EyeOff size={11} />
                      Hidden
                    </span>
                  </div>
                  <RemoveTestCaseButton
                    canRemove={hiddenCount > 1}
                    onClick={() => handleRemoveHiddenTestCase(idx)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Input</FieldLabel>
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
                      className={`${modalTextareaClass} font-mono text-[13px]`}
                      placeholder="Input data"
                    />
                  </div>
                  <div>
                    <FieldLabel>Expected output</FieldLabel>
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
                      className={`${modalTextareaClass} font-mono text-[13px]`}
                      placeholder="Expected output"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ModalShell>
  );
};

export default CodingQuestionModal;
