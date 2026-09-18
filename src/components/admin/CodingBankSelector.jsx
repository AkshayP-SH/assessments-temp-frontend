import { useState, useEffect } from 'react';
import { X, Search, Check, Eye } from 'lucide-react';
import { apiFetch } from '../../config/api';

const CodingBankSelector = ({ onClose, onSelect }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, [selectedDifficulty, selectedCategory, searchTerm]);

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

  const fetchQuestions = async () => {
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
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAddSelected = () => {
    const selected = questions.filter(q => selectedQuestions.has(q.id));
    onSelect(selected);
  };

  const handlePreview = async (e, questionId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/question-bank/coding/${questionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPreviewQuestion(data.question);
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
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
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl max-w-5xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Coding Questions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedQuestions.size} question(s) selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedQuestions.has(q.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedQuestions.has(q.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedQuestions.has(q.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{q.title}</h3>
                          <button
                            onClick={(e) => handlePreview(e, q.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{q.description}</p>
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white sticky bottom-0 z-10 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedQuestions.size === 0}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedQuestions.size} Question(s)
            </button>
          </div>
        </div>
      </div>

      {previewQuestion && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl max-w-3xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">{previewQuestion.title}</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 bg-gray-50 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{previewQuestion.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Time Limit:</span> {previewQuestion.time_limit}s
                </div>
                <div>
                  <span className="font-medium">Memory:</span> {previewQuestion.memory_limit}MB
                </div>
                <div>
                  <span className="font-medium">Marks:</span> {previewQuestion.marks}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {previewQuestion.difficulty}
                </div>
              </div>
              {previewQuestion.testCases && previewQuestion.testCases.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Test Cases</h4>
                  <div className="space-y-3">
                    {previewQuestion.testCases.map((tc, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">Test Case {idx + 1}</span>
                          {tc.is_hidden && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Hidden</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Input:</div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">{tc.input}</pre>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Output:</div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">{tc.output}</pre>
                          </div>
                        </div>
                        {tc.explanation && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Explanation:</span> {tc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodingBankSelector;
