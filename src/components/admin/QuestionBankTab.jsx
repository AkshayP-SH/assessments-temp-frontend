import { useState, useEffect, useCallback, memo } from 'react';
import { BookOpen, Code, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { apiFetch } from '../../config/api';
import MCQBankModal from './MCQBankModal';
import CodingBankModal from './CodingBankModal';

const getAuthToken = () =>
  localStorage.getItem('adminToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('clientToken') ||
  '';

const QuestionBankTab = () => {
  const [activeTab, setActiveTab] = useState('mcq'); // mcq or coding
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await apiFetch('api/question-bank/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await apiFetch('api/question-bank/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.tags)) {
        setTags(data.tags);
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTags([]);
    }
  }, []);

  const fetchMCQQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiFetch(`api/question-bank/mcq?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.questions)) {
        const seen = new Set();
        const unique = data.questions.filter((q) => {
          const key = (q.question_text || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setMcqQuestions(unique);
      } else {
        setMcqQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching MCQ questions:', error);
      setMcqQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, selectedCategory, debouncedSearchTerm]);

  const fetchCodingQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiFetch(`api/question-bank/coding?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.questions)) {
        const seen = new Set();
        const unique = data.questions.filter((q) => {
          const key = (q.title || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setCodingQuestions(unique);
      } else {
        setCodingQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching coding questions:', error);
      setCodingQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, selectedCategory, debouncedSearchTerm]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  useEffect(() => {
    if (activeTab === 'mcq') {
      fetchMCQQuestions();
    } else {
      fetchCodingQuestions();
    }
  }, [activeTab, fetchMCQQuestions, fetchCodingQuestions]);

  const handleDeleteMCQ = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = getAuthToken();
      const response = await apiFetch(`api/question-bank/mcq/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success) {
        alert('Question deleted successfully');
        fetchMCQQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  }, [fetchMCQQuestions]);

  const handleDeleteCoding = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = getAuthToken();
      const response = await apiFetch(`api/question-bank/coding/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success) {
        alert('Question deleted successfully');
        fetchCodingQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  }, [fetchCodingQuestions]);

  const handleEditMCQ = useCallback((q) => {
    setEditingQuestion(q);
    setShowMCQModal(true);
  }, []);

  const handleEditCoding = useCallback((q) => {
    setEditingQuestion(q);
    setShowCodingModal(true);
  }, []);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Bank</h2>
        <p className="text-sm text-[#9A9AC9]">Manage reusable questions for your tests</p>
      </div>

      <div className="border-b border-gray-100 mb-6">
        <nav className="flex -mb-px space-x-2">
          <button
            onClick={() => setActiveTab('mcq')}
            className={`flex items-center px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'mcq'
                ? 'border-[#403f75] text-[#403f75]'
                : 'border-transparent text-[#9A9AC9] hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            MCQ Questions ({(mcqQuestions || []).length})
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'coding'
                ? 'border-[#403f75] text-[#403f75]'
                : 'border-transparent text-[#9A9AC9] hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            <Code className="w-4 h-4 mr-2" />
            Coding Questions ({(codingQuestions || []).length})
          </button>
        </nav>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9A9AC9] w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
          >
            <option value="">All Categories</option>
            {(categories || []).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={() => {
              if (activeTab === 'mcq') {
                setEditingQuestion(null);
                setShowMCQModal(true);
              } else {
                setEditingQuestion(null);
                setShowCodingModal(true);
              }
            }}
            className="flex items-center justify-center space-x-2 bg-[#403f75] hover:bg-[#2d2d53] text-white h-12 px-6 rounded-xl font-bold shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo mx-auto"></div>
          </div>
        ) : activeTab === 'mcq' ? (
          <MCQQuestionsList
            questions={mcqQuestions}
onEdit={(q) => {
              handleEditMCQ(q);
              setEditingQuestion(q);
              setShowMCQModal(true);
            }}
            onDelete={handleDeleteMCQ}
            getDifficultyColor={getDifficultyColor}
          />
        ) : (
          <CodingQuestionsList
            questions={codingQuestions}
onEdit={(q) => {
              handleEditCoding(q);
              setEditingQuestion(q);
              setShowCodingModal(true);
            }}
            onDelete={handleDeleteCoding}
            getDifficultyColor={getDifficultyColor}
          />
        )}
      </div>

      {/* Modals */}
      {showMCQModal && (
        <MCQBankModal
          question={editingQuestion}
          onClose={() => {
            setShowMCQModal(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            setShowMCQModal(false);
            setEditingQuestion(null);
            fetchMCQQuestions();
          }}
          categories={categories || []}
          tags={tags || []}
        />
      )}

      {showCodingModal && (
        <CodingBankModal
          question={editingQuestion}
          onClose={() => {
            setShowCodingModal(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            setShowCodingModal(false);
            setEditingQuestion(null);
            fetchCodingQuestions();
          }}
          categories={categories || []}
          tags={tags || []}
        />
      )}
    </div>
  );
};

// MCQ Questions List Component
const MCQQuestionsList = memo(({ questions = [], onEdit, onDelete, getDifficultyColor }) => {
  const list = Array.isArray(questions) ? questions : [];
  if (list.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-16 text-center mt-2">
        <BookOpen className="w-16 h-16 mx-auto mb-6 text-[#9A9AC9] opacity-60" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No MCQ Questions Found</h2>
        <p className="text-[#9A9AC9] text-base font-medium">Add your first question to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((q) => (
        <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <p className="text-gray-900 font-bold text-lg mb-3">{q.question_text}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                  {q.difficulty}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {q.category}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {q.marks} marks
                </span>
                {Array.isArray(q.tags) && q.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(q)}
                className="p-2 text-[#403f75] hover:bg-[#edeefc] rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(q.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start">
              <span className="font-bold mr-2 text-gray-900">A:</span>
              <span className="text-[#9A9AC9]">{q.option_a}</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-gray-900">B:</span>
              <span className="text-[#9A9AC9]">{q.option_b}</span>
            </div>
            {q.option_c && (
              <div className="flex items-start">
                <span className="font-bold mr-2 text-gray-900">C:</span>
                <span className="text-[#9A9AC9]">{q.option_c}</span>
              </div>
            )}
            {q.option_d && (
              <div className="flex items-start">
                <span className="font-bold mr-2 text-gray-900">D:</span>
                <span className="text-[#9A9AC9]">{q.option_d}</span>
              </div>
            )}
          </div>
          <div className="mt-4 text-sm font-bold bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-xl inline-block">
            Correct Answer: {q.correct_option}
          </div>
        </div>
      ))}
    </div>
  );
});

// Coding Questions List Component
const CodingQuestionsList = memo(({ questions = [], onEdit, onDelete, getDifficultyColor }) => {
  const list = Array.isArray(questions) ? questions : [];
  if (list.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-16 text-center mt-2">
        <Code className="w-16 h-16 mx-auto mb-6 text-[#9A9AC9] opacity-60" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Coding Questions Found</h2>
        <p className="text-[#9A9AC9] text-base font-medium">Add your first coding question to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((q) => (
        <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{q.title}</h3>
              <p className="text-[#9A9AC9] text-sm mb-4 line-clamp-2">{q.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                  {q.difficulty}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {q.category}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {q.marks} marks
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  {q.test_case_count} test cases
                </span>
                {Array.isArray(q.tags) && q.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(q)}
                className="p-2 text-[#9A9AC9] hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(q.id)}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-4 text-sm font-bold text-[#9A9AC9] mt-4 p-4 bg-gray-50 rounded-xl">
            <span>Time Limit: {q.time_limit}s</span>
            <span>Memory Limit: {q.memory_limit}MB</span>
          </div>
        </div>
      ))}
    </div>
  );
});

export default QuestionBankTab;

