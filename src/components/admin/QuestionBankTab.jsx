import { useState, useEffect } from 'react';
import { BookOpen, Code, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { apiFetch } from '../../config/api';
import MCQBankModal from './MCQBankModal';
import CodingBankModal from './CodingBankModal';

const QuestionBankTab = () => {
  const [activeTab, setActiveTab] = useState('mcq'); // mcq or coding
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (activeTab === 'mcq') {
      fetchMCQQuestions();
    } else {
      fetchCodingQuestions();
    }
  }, [activeTab, selectedDifficulty, selectedCategory, searchTerm]);

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

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/question-bank/tags', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchMCQQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiFetch(`api/question-bank/mcq?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMcqQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching MCQ questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCodingQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiFetch(`api/question-bank/coding?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCodingQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching coding questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMCQ = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/question-bank/mcq/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Question deleted successfully');
        fetchMCQQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const handleDeleteCoding = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/question-bank/coding/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Question deleted successfully');
        fetchCodingQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-shnoor-navy mb-2">Question Bank</h2>
        <p className="text-shnoor-soft">Manage reusable questions for your tests</p>
      </div>

      <div className="border-b border-shnoor-light mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('mcq')}
            className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'mcq'
                ? 'border-shnoor-indigo text-shnoor-indigo'
                : 'border-transparent text-shnoor-soft hover:text-shnoor-navy hover:border-shnoor-mist'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            MCQ Questions ({mcqQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'coding'
                ? 'border-shnoor-indigo text-shnoor-indigo'
                : 'border-transparent text-shnoor-soft hover:text-shnoor-navy hover:border-shnoor-mist'
            }`}
          >
            <Code className="w-4 h-4 mr-2" />
            Coding Questions ({codingQuestions.length})
          </button>
        </nav>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
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
            className="flex items-center justify-center px-4 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Question
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
          categories={categories}
          tags={tags}
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
          categories={categories}
          tags={tags}
        />
      )}
    </div>
  );
};

// MCQ Questions List Component
const MCQQuestionsList = ({ questions, onEdit, onDelete, getDifficultyColor }) => {
  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-shnoor-soft">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-shnoor-mist" />
        <p>No MCQ questions found. Add your first question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="border border-shnoor-light rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <p className="text-shnoor-navy font-medium mb-2">{q.question_text}</p>
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
                {q.tags && q.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(q)}
                className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
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
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-medium mr-2">A:</span>
              <span className="text-shnoor-soft">{q.option_a}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">B:</span>
              <span className="text-shnoor-soft">{q.option_b}</span>
            </div>
            {q.option_c && (
              <div className="flex items-center">
                <span className="font-medium mr-2">C:</span>
                <span className="text-shnoor-soft">{q.option_c}</span>
              </div>
            )}
            {q.option_d && (
              <div className="flex items-center">
                <span className="font-medium mr-2">D:</span>
                <span className="text-shnoor-soft">{q.option_d}</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            <span className="font-medium text-green-600">Correct Answer: {q.correct_option}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Coding Questions List Component
const CodingQuestionsList = ({ questions, onEdit, onDelete, getDifficultyColor }) => {
  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-shnoor-soft">
        <Code className="w-16 h-16 mx-auto mb-4 text-shnoor-mist" />
        <p>No coding questions found. Add your first question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="border border-shnoor-light rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-shnoor-navy mb-2">{q.title}</h3>
              <p className="text-shnoor-soft text-sm mb-3 line-clamp-2">{q.description}</p>
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
                {q.tags && q.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(q)}
                className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
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
          <div className="flex gap-4 text-sm text-shnoor-soft">
            <span>Time Limit: {q.time_limit}s</span>
            <span>Memory: {q.memory_limit}MB</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionBankTab;
