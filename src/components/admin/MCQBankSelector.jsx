import { useState, useEffect } from 'react';
import { X, Search, Check, Eye, Plus } from 'lucide-react';
import { apiFetch } from '../../config/api';
import PropTypes from 'prop-types';

const MCQBankSelector = ({
  onClose,
  onSelect,
  selectedQuestionIds = [],
  selectedRoles = [],
  variant = 'modal'
}) => {
  const isInline = variant === 'inline';
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  useEffect(() => {
    setSelectedQuestions(new Set());
  }, [selectedQuestionIds.join(',')]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedDifficulty, selectedCategory, selectedRoles]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/question-bank/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/question-bank/mcq', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching MCQ questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question_text?.toLowerCase().includes(term) ||
          q.option_a?.toLowerCase().includes(term) ||
          q.option_b?.toLowerCase().includes(term)
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    if (selectedCategory) {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }

    if (selectedRoles?.length > 0) {
      filtered = filtered
        .map((q) => {
          const roleKeywords = selectedRoles.map((r) => r.job_role.toLowerCase()).join(' ');
          const questionText = `${q.question_text} ${q.category} ${(q.tags || []).join(' ')}`.toLowerCase();
          let relevanceScore = 0;
          roleKeywords.split(/\s+/).forEach((keyword) => {
            if (keyword && questionText.includes(keyword)) relevanceScore++;
          });
          return { ...q, relevanceScore };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    setFilteredQuestions(filtered);
  };

  const handleToggleQuestion = (questionId) => {
    if (selectedQuestionIds.includes(questionId)) return;
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handlePreview = async (questionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/question-bank/mcq/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPreviewQuestion(data.question);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching question preview:', error);
    }
  };

  const handleConfirmSelection = () => {
    const selected = filteredQuestions.filter((q) => selectedQuestions.has(q.id));
    if (selected.length === 0) return;
    onSelect(selected);
    setSelectedQuestions(new Set());
    if (!isInline && onClose) {
      onClose();
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isAlreadyAdded = (id) => selectedQuestionIds.includes(id);
  const pendingCount = [...selectedQuestions].filter((id) => !isAlreadyAdded(id)).length;

  const pickerContent = (
    <MotionlessPickerShell isInline={isInline}>
      {!isInline && onClose && (
        <div className="p-4 sm:p-6 border-b border-shnoor-mist flex justify-between items-center sticky top-0 bg-white z-10 flex-shrink-0">
          <MotionlessPickerTitle count={pendingCount} isInline={false} />
          <button type="button" onClick={onClose} className="text-shnoor-navy hover:text-shnoor-indigo" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {isInline && (
        <div className="mb-4">
          <MotionlessPickerTitle count={pendingCount} isInline />
          <p className="text-sm text-shnoor-navy mt-1">
            Select questions below, then click &quot;Add to Test&quot;. Added questions appear in the panel on the right.
          </p>
        </div>
      )}

      <div className={`${isInline ? 'mb-4' : 'p-4 sm:p-6 border-b border-shnoor-mist bg-shnoor-lavender flex-shrink-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-shnoor-navy w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent text-sm"
            />
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo text-sm"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`overflow-y-auto ${isInline ? 'max-h-[420px] pr-1' : 'flex-1 p-4 sm:p-6'}`}>
        {loading ? (
          <div className="text-center py-12">
            <MotionlessSpinner />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-shnoor-navy">
            <p>No questions found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const added = isAlreadyAdded(q.id);
              const selected = selectedQuestions.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={added ? undefined : () => handleToggleQuestion(q.id)}
                  className={`border rounded-lg p-4 transition-all ${
                    added
                      ? 'border-shnoor-mist bg-shnoor-lavender opacity-70 cursor-not-allowed'
                      : selected
                        ? 'border-shnoor-indigo bg-shnoor-lavender cursor-pointer'
                        : 'border-shnoor-mist hover:border-shnoor-indigo cursor-pointer bg-white hover:shadow-sm'
                  }`}
                >
                  <MotionlessQuestionRow
                    q={q}
                    added={added}
                    selected={selected}
                    selectedRoles={selectedRoles}
                    getDifficultyColor={getDifficultyColor}
                    onPreview={() => handlePreview(q.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`${isInline ? 'mt-4 pt-4 border-t border-shnoor-mist' : 'p-4 sm:p-6 border-t border-shnoor-mist bg-white flex flex-col sm:flex-row justify-end sticky bottom-0 z-10 flex-shrink-0'} gap-3`}>
        {!isInline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 border border-shnoor-mist text-shnoor-navy rounded-lg hover:bg-shnoor-lavender text-center"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirmSelection}
          disabled={pendingCount === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors bg-shnoor-indigo hover:bg-shnoor-navy text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          <span>
            Add {pendingCount} to Test{pendingCount !== 1 ? '' : ''}
          </span>
        </button>
      </div>
    </MotionlessPickerShell>
  );

  if (isInline) {
    return (
      <>
        {pickerContent}
        {showPreview && previewQuestion && (
          <PreviewModal
            question={previewQuestion}
            onClose={() => setShowPreview(false)}
            getDifficultyColor={getDifficultyColor}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div
          className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl max-w-5xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {pickerContent}
        </div>
      </div>
      {showPreview && previewQuestion && (
        <PreviewModal
          question={previewQuestion}
          onClose={() => setShowPreview(false)}
          getDifficultyColor={getDifficultyColor}
        />
      )}
    </>
  );
};

function MotionlessPickerShell({ isInline, children }) {
  if (isInline) {
    return <div className="border border-shnoor-mist rounded-xl p-4 bg-shnoor-lavender/30">{children}</div>;
  }
  return <>{children}</>;
}

function MotionlessPickerTitle({ count, isInline }) {
  return (
    <div>
      <h3 className={`font-bold text-shnoor-navy ${isInline ? 'text-lg' : 'text-2xl'}`}>
        {isInline ? 'Question Bank' : 'Select MCQ Questions from Bank'}
      </h3>
      <p className="text-sm text-shnoor-navy mt-0.5">{count} selected to add</p>
    </div>
  );
}

function MotionlessSpinner() {
  return <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-shnoor-indigo mx-auto" />;
}

function MotionlessQuestionRow({ q, added, selected, selectedRoles, getDifficultyColor, onPreview }) {
  if (!q || !q.question_text) {
    return <div className="text-red-500">Invalid question data</div>;
  }
  
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-1">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            selected ? 'bg-shnoor-indigo border-shnoor-indigo' : 'border-shnoor-mist'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-semibold text-shnoor-navy">{q.question_text}</h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-1 text-shnoor-indigo hover:bg-shnoor-lavender rounded transition-colors flex-shrink-0"
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRoles?.length > 0 && q.relevanceScore > 0 && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-shnoor-lavender text-shnoor-indigo">Recommended</span>
          )}
          {added && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-shnoor-mist text-shnoor-navy">In test</span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{q.category}</span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{q.marks || 1} marks</span>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ question, onClose, getDifficultyColor }) {
  const options = [
    { letter: 'A', text: question.option_a },
    { letter: 'B', text: question.option_b },
    { letter: 'C', text: question.option_c },
    { letter: 'D', text: question.option_d }
  ].filter((o) => o.text);

  return (
    <MotionlessPreviewOverlay onClose={onClose}>
      <MotionlessPreviewBody onClose={onClose} question={question} options={options} getDifficultyColor={getDifficultyColor} />
    </MotionlessPreviewOverlay>
  );
}

function MotionlessPreviewOverlay({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {children}
    </div>
  );
}

function MotionlessPreviewBody({ onClose, question, options, getDifficultyColor }) {
  return (
    <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl max-w-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 bg-white border-b border-shnoor-mist p-4 sm:p-6 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-bold text-shnoor-navy">Preview</h3>
        <button type="button" onClick={onClose}>
          <X className="w-5 h-5 text-shnoor-navy" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{question.category}</span>
        </div>
        <p className="text-shnoor-navy whitespace-pre-wrap">{question.question_text}</p>
        <div className="space-y-2">
          {options.map((o) => (
            <div
              key={o.letter}
              className={`p-3 rounded-lg border text-sm ${
                question.correct_option === o.letter ? 'border-shnoor-success bg-shnoor-successLight' : 'border-shnoor-mist'
              }`}
            >
              <span className="font-medium">{o.letter}.</span> {o.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

MCQBankSelector.propTypes = {
  onClose: PropTypes.func,
  onSelect: PropTypes.func.isRequired,
  selectedQuestionIds: PropTypes.arrayOf(PropTypes.number),
  selectedRoles: PropTypes.arrayOf(
    PropTypes.shape({
      job_role: PropTypes.string,
      job_description: PropTypes.string
    })
  ),
  variant: PropTypes.oneOf(['modal', 'inline'])
};

export default MCQBankSelector;
