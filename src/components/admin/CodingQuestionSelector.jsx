import { useState, useEffect } from 'react';
import { Search, X, Eye, CheckCircle, Filter, Code } from 'lucide-react';
import { apiFetch } from '../../config/api';
import PropTypes from 'prop-types';

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
        setQuestions(data.questions);
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
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-6xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Coding Questions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
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

          {selectedRoles && selectedRoles.length > 0 && (
            <div className="mt-3 flex items-center text-sm text-blue-600">
              <Filter className="w-4 h-4 mr-2" />
              <span>Questions are recommended based on selected roles: {selectedRoles.map(r => r.job_role).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No coding questions found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    selectedQuestions.has(q.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleToggleQuestion(q.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {selectedQuestions.has(q.id) ? (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{q.title}</h3>
                          {q.relevanceScore > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{q.description}</p>
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
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(q.id);
                      }}
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview question"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedQuestions.size === 0}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {showPreview && previewQuestion && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-4xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Question Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{previewQuestion.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getDifficultyColor(previewQuestion.difficulty)}`}>
                      {previewQuestion.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                      {previewQuestion.category}
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                      {previewQuestion.marks} marks
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800">
                      Time: {previewQuestion.time_limit}s
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-medium bg-orange-100 text-orange-800">
                      Memory: {previewQuestion.memory_limit}MB
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{previewQuestion.description}</p>
                </div>

                {previewQuestion.testCases && previewQuestion.testCases.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Test Cases</h4>
                    <div className="space-y-3">
                      {previewQuestion.testCases.map((tc, idx) => (
                        <div key={tc.id} className={`border rounded-lg p-4 ${tc.is_hidden ? 'bg-gray-50' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Test Case {idx + 1}</span>
                            {tc.is_hidden && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Input:</span>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">{tc.input}</pre>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Expected Output:</span>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">{tc.output}</pre>
                            </div>
                            {tc.explanation && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Explanation:</span>
                                <p className="mt-1 text-sm text-gray-600">{tc.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewQuestion.tags && previewQuestion.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewQuestion.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10 flex-shrink-0">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CodingQuestionSelector.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedQuestionIds: PropTypes.array,
  selectedRoles: PropTypes.array
};

export default CodingQuestionSelector;
