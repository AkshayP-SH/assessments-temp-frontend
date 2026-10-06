import { useState } from 'react';
import { AlertTriangle, Check, RefreshCw, X, ArrowRight, CheckSquare, Square } from 'lucide-react';
const DuplicateResolutionModal = ({
  isOpen,
  type = 'mcq',
  duplicates = [],
  insertedCount = 0,
  onReplace,
  onKeepExisting,
  onClose
}) => {
  const [selectedIndices, setSelectedIndices] = useState(() => {
    return new Set(duplicates.map((_, idx) => idx));
  });
  const [isProcessing, setIsProcessing] = useState(false);
  if (!isOpen || !duplicates || duplicates.length === 0) return null;
  const isBulk = duplicates.length > 1;
  const toggleSelect = (idx) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };
  const toggleSelectAll = () => {
    if (selectedIndices.size === duplicates.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(duplicates.map((_, idx) => idx)));
    }
  };
  const handleConfirmReplace = async () => {
    const selected = duplicates
      .filter((_, idx) => selectedIndices.has(idx))
      .map(d => ({
        id: d.existingQuestion.id,
        ...d.newQuestion
      }));
    if (selected.length === 0) {
      alert('Please select at least one question to replace.');
      return;
    }
    setIsProcessing(true);
    try {
      await onReplace(selected);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-amber-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isBulk ? 'Duplicate Questions Detected' : 'Duplicate Question Found'}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {isBulk
                  ? `${duplicates.length} duplicate question(s) found in your upload. Choose which to replace or skip.`
                  : 'A matching question already exists in your Question Bank.'}
                {insertedCount > 0 && (
                  <span className="ml-1 text-emerald-700 font-semibold">
                    ({insertedCount} new unique question(s) were added successfully).
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose || onKeepExisting}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Bulk select header bar */}
        {isBulk && (
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between shrink-0 text-xs">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-gray-700 font-semibold hover:text-[#403f75] transition-colors"
            >
              {selectedIndices.size === duplicates.length ? (
                <CheckSquare className="w-4 h-4 text-[#403f75]" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>Select All ({selectedIndices.size} of {duplicates.length} selected)</span>
            </button>
            <span className="text-gray-500">
              Checked questions will be replaced by the newly uploaded version.
            </span>
          </div>
        )}
        {/* Question comparison list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
          {duplicates.map((dup, idx) => {
            const isSelected = selectedIndices.has(idx);
            const isMCQ = type === 'mcq';
            const existQ = dup.existingQuestion;
            const newQ = dup.newQuestion;
            const existTitle = isMCQ ? existQ.question_text : existQ.title;
            const newTitle = isMCQ ? newQ.question_text : newQ.title;
            return (
              <div
                key={idx}
                className={`bg-white rounded-xl border transition-all overflow-hidden ${isSelected
                    ? 'border-[#403f75] ring-2 ring-[#403f75]/10 shadow-sm'
                    : 'border-gray-200 opacity-80'
                  }`}
              >
                {/* Header row with checkbox */}
                <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-gray-800">
                    {isBulk && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        className="w-4 h-4 rounded text-[#403f75] focus:ring-[#403f75] cursor-pointer"
                      />
                    )}
                    <span>
                      {isBulk ? `Question #${idx + 1}` : 'Question Comparison'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      Matched existing ID: #{existQ.id}
                    </span>
                  </label>
                  <span className="text-xs text-gray-500">
                    Category: <span className="font-medium text-gray-700">{newQ.category || existQ.category || 'General'}</span>
                  </span>
                </div>
                {/* Comparison Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Existing Question */}
                  <div className="bg-amber-50/40 rounded-lg p-3.5 border border-amber-200/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5 uppercase tracking-wider">
                      <span>Existing in Question Bank</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-3">
                      {existTitle}
                    </p>
                    {isMCQ ? (
                      <div className="mt-2.5 space-y-1 text-xs text-gray-600">
                        <div className={`p-1 px-2 rounded ${existQ.correct_option === 'A' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                          A: {existQ.option_a}
                        </div>
                        <div className={`p-1 px-2 rounded ${existQ.correct_option === 'B' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                          B: {existQ.option_b}
                        </div>
                        {existQ.option_c && (
                          <div className={`p-1 px-2 rounded ${existQ.correct_option === 'C' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                            C: {existQ.option_c}
                          </div>
                        )}
                        {existQ.option_d && (
                          <div className={`p-1 px-2 rounded ${existQ.correct_option === 'D' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                            D: {existQ.option_d}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-3">
                        {existQ.description}
                      </div>
                    )}
                  </div>
                  {/* Right: New Question */}
                  <div className="bg-indigo-50/40 rounded-lg p-3.5 border border-indigo-200/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#403f75] mb-1.5 uppercase tracking-wider">
                      <span>New / Uploaded Version</span>
                      <ArrowRight className="w-3 h-3 text-[#403f75]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-3">
                      {newTitle}
                    </p>
                    {isMCQ ? (
                      <div className="mt-2.5 space-y-1 text-xs text-gray-600">
                        <div className={`p-1 px-2 rounded ${newQ.correct_option === 'A' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                          A: {newQ.option_a}
                        </div>
                        <div className={`p-1 px-2 rounded ${newQ.correct_option === 'B' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                          B: {newQ.option_b}
                        </div>
                        {newQ.option_c && (
                          <div className={`p-1 px-2 rounded ${newQ.correct_option === 'C' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                            C: {newQ.option_c}
                          </div>
                        )}
                        {newQ.option_d && (
                          <div className={`p-1 px-2 rounded ${newQ.correct_option === 'D' ? 'bg-emerald-100 font-bold text-emerald-800' : 'bg-white'}`}>
                            D: {newQ.option_d}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-3">
                        {newQ.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onKeepExisting}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isBulk ? 'Skip All & Keep Existing' : 'Keep Existing (Cancel)'}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmReplace}
              disabled={isProcessing || (isBulk && selectedIndices.size === 0)}
              className="px-6 py-2.5 rounded-xl bg-[#403f75] hover:bg-[#343360] text-white text-sm font-bold shadow-lg shadow-[#403f75]/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Replacing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isBulk
                      ? `Replace Selected (${selectedIndices.size})`
                      : 'Replace Existing Question'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default DuplicateResolutionModal;