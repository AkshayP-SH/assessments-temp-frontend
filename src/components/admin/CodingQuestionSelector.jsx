import { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Check, Info, Code, List, Plus, Loader2 } from 'lucide-react';
import { apiFetch } from '../../config/api';
import PropTypes from 'prop-types';
import ModalShell, { ModalButton, SectionTitle, modalInputClass } from './ModalShell';

const CodingQuestionSelector = ({ onClose, onSelect, selectedQuestionIds = [], selectedRoles = [] }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set(selectedQuestionIds));
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCodingQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedDifficulty, selectedCategory, selectedRoles]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/question-bank/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCodingQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/question-bank/coding', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const seen = new Set();
        const uniqueQuestions = (data.questions || []).filter((q) => {
          const key = (q.title || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setQuestions(uniqueQuestions);
      }
    } catch (error) {
      console.error('Error fetching coding questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    if (selectedCategory) {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    if (selectedRoles && selectedRoles.length > 0) {
      filtered = filtered.map(q => {
        const roleKeywords = selectedRoles.map(r => r.job_role.toLowerCase()).join(' ');
        const questionText = `${q.title} ${q.description} ${q.category} ${(q.tags || []).join(' ')}`.toLowerCase();
        
        let relevanceScore = 0;
        const keywords = roleKeywords.split(/\s+/);
        keywords.forEach(keyword => {
          if (questionText.includes(keyword)) {
            relevanceScore++;
          }
        });

        return { ...q, relevanceScore };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    setFilteredQuestions(filtered);
  };

  const handleToggleQuestion = (questionId) => {
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
      const response = await apiFetch(`api/question-bank/coding/${questionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPreviewQuestion(data.question);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
      alert('Failed to load question preview');
    }
  };

  const handleConfirmSelection = () => {
    const selected = questions.filter(q => selectedQuestions.has(q.id));
    onSelect(selected);
    onClose();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-50 text-green-700 border border-green-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'hard': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const tagClass = 'px-2 py-0.5 rounded-md text-xs font-medium';
  const neutralTag = `${tagClass} bg-gray-100 text-gray-700 border border-gray-200`;
  const selectedCount = selectedQuestions.size;

  return (
    <ModalShell
      icon={List}
      title="Select Coding Questions"
      subtitle={`${selectedCount} question${selectedCount !== 1 ? 's' : ''} selected`}
      onClose={onClose}
      size="lg"
      fullHeight
      zIndexClass="z-[60]"
      toolbar={
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${modalInputClass} pl-9`}
              />
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={modalInputClass}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={modalInputClass}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {selectedRoles && selectedRoles.length > 0 && (
            <div className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full bg-shnoor-lavender text-shnoor-indigo text-xs">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Recommended for selected roles: {selectedRoles.map(r => r.job_role).join(', ')}</span>
            </div>
          )}
        </div>
      }
      footerStart={`${selectedCount} selected`}
      footerActions={
        <>
          <ModalButton variant="outline" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton icon={Plus} onClick={handleConfirmSelection} disabled={selectedCount === 0}>
            Add {selectedCount} Question{selectedCount !== 1 ? 's' : ''}
          </ModalButton>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-shnoor-indigo animate-spin" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Code className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-shnoor-navy">No questions found</p>
          <p className="text-xs text-gray-500 mt-1">Try a different search or clear the filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isSelected = selectedQuestions.has(q.id);
            return (
              <div
                key={q.id}
                className={`group flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-shnoor-indigo bg-shnoor-lavender/40'
                    : 'border-shnoor-mist bg-white hover:border-shnoor-light'
                }`}
                onClick={() => handleToggleQuestion(q.id)}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-shnoor-indigo border-shnoor-indigo' : 'bg-white border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-shnoor-navy">{q.title}</h3>
                    {q.relevanceScore > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-shnoor-lavender text-shnoor-indigo text-[11px] font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 mt-1 mb-3 line-clamp-2">{q.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`${tagClass} capitalize ${getDifficultyColor(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                    <span className={neutralTag}>{q.category}</span>
                    <span className={neutralTag}>{q.marks} marks</span>
                    <span className={neutralTag}>{q.test_case_count} test cases</span>
                    {q.tags && q.tags.map((tag, idx) => (
                      <span key={idx} className={neutralTag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(q.id);
                  }}
                  className="p-2 -m-1 rounded-lg text-shnoor-indigo hover:bg-shnoor-lavender transition-all flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  title="Preview question"
                >
                  <Eye className="w-[18px] h-[18px]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showPreview && previewQuestion && (
        <ModalShell
          icon={Eye}
          title={previewQuestion.title}
          subtitle="Question preview"
          onClose={() => setShowPreview(false)}
          size="md"
          zIndexClass="z-[70]"
          footerActions={
            <ModalButton onClick={() => setShowPreview(false)}>
              Close Preview
            </ModalButton>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            <span className={`${tagClass} capitalize ${getDifficultyColor(previewQuestion.difficulty)}`}>
              {previewQuestion.difficulty}
            </span>
            <span className={neutralTag}>{previewQuestion.category}</span>
            <span className={neutralTag}>{previewQuestion.marks} marks</span>
            <span className={neutralTag}>Time: {previewQuestion.time_limit}s</span>
            <span className={neutralTag}>Memory: {previewQuestion.memory_limit}MB</span>
          </div>

          <section>
            <SectionTitle>Description</SectionTitle>
            <p className="text-sm text-shnoor-navy whitespace-pre-wrap">{previewQuestion.description}</p>
          </section>

          {previewQuestion.testCases && previewQuestion.testCases.length > 0 && (
            <section>
              <SectionTitle>Test Cases</SectionTitle>
              <div className="space-y-3">
                {previewQuestion.testCases.map((tc, idx) => (
                  <div key={tc.id} className="rounded-xl border border-shnoor-mist p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-shnoor-navy">Test case {idx + 1}</span>
                      {tc.is_hidden && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-shnoor-lavender text-shnoor-indigo text-[11px] font-medium">
                          <EyeOff size={11} />
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-500 mb-1">Input</span>
                        <pre className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-mono overflow-x-auto">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 mb-1">Expected output</span>
                        <pre className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-mono overflow-x-auto">{tc.output}</pre>
                      </div>
                    </div>
                    {tc.explanation && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-gray-500">Explanation: </span>
                        {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {previewQuestion.tags && previewQuestion.tags.length > 0 && (
            <section>
              <SectionTitle>Tags</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {previewQuestion.tags.map((tag, idx) => (
                  <span key={idx} className={neutralTag}>{tag}</span>
                ))}
              </div>
            </section>
          )}
        </ModalShell>
      )}
    </ModalShell>
  );
};

CodingQuestionSelector.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedQuestionIds: PropTypes.array,
  selectedRoles: PropTypes.array
};

export default CodingQuestionSelector;
