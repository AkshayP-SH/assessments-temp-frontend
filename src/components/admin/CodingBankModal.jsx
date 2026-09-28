import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../config/api';

const CodingBankModal = ({ question, onClose, onSave, categories, tags }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_limit: 1.0,
    memory_limit: 256,
    marks: 10,
    difficulty: 'medium',
    category: '',
    tags: [],
    testCases: []
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (question) {
      fetchQuestionDetails(question.id);
    }
  }, [question]);

  const fetchQuestionDetails = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/question-bank/coding/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const q = data.question;
        setFormData({
          title: q.title || '',
          description: q.description || '',
          time_limit: parseFloat(q.time_limit) || 1.0,
          memory_limit: q.memory_limit || 256,
          marks: q.marks || 10,
          difficulty: q.difficulty || 'medium',
          category: q.category || '',
          tags: q.tags || [],
          testCases: q.testCases || []
        });
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Manual validation
    if (!formData.title.trim()) {
      return alert('Please enter a question title');
    }
    if (!formData.description.trim()) {
      return alert('Please enter a problem description');
    }
    if (!formData.time_limit) {
      return alert('Please enter a time limit');
    }
    if (!formData.memory_limit) {
      return alert('Please enter a memory limit');
    }
    if (!formData.marks) {
      return alert('Please enter the marks for this question');
    }

    // Check if test cases exist
    if (formData.testCases.length === 0) {
      return alert('Please add at least one test case');
    }

    // Check for empty test cases
    for (let i = 0; i < formData.testCases.length; i++) {
      const tc = formData.testCases[i];
      if (!tc.input.trim() || !tc.output.trim()) {
        return alert(`Please fill in input and output for Test Case ${i + 1}`);
      }
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = question 
        ? `api/question-bank/coding/${question.id}`
        : 'api/question-bank/coding';
      
      const response = await apiFetch(url, {
        method: question ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(question ? 'Question updated successfully' : 'Question created successfully');
        onSave();
      } else {
        alert(data.message || 'Failed to save question');
      }
    } catch {
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [
        ...formData.testCases,
        { input: '', output: '', explanation: '', is_hidden: false }
      ]
    });
  };

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

  const removeTestCase = (index) => {
    setFormData({
      ...formData,
      testCases: formData.testCases.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {question ? 'Edit Coding Question' : 'Add Coding Question'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9A9AC9] hover:text-gray-900 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
              placeholder="e.g., Two Sum"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-none"
              placeholder="Describe the problem..."
            />
          </div>

          {/* Time Limit, Memory Limit, Marks, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Time Limit (s) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: parseFloat(e.target.value) })}
                min="0.1"
                className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Memory (MB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.memory_limit}
                onChange={(e) => setFormData({ ...formData, memory_limit: parseInt(e.target.value) })}
                min="1"
                className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                min="1"
                className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Difficulty <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                required
                className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="categories"
                className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                placeholder="e.g., algorithms"
              />
              <datalist id="categories">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  list="tags"
                  className="flex-1 h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                  placeholder="Add tags..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 h-10 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <datalist id="tags">
                {tags.map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-bold gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gray-900">
                Test Cases
              </label>
              <button
                type="button"
                onClick={addTestCase}
                className="flex items-center justify-center gap-2 px-4 h-10 bg-[#403f75] hover:bg-[#2d2d53] text-white rounded-xl font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Test Case
              </button>
            </div>

            <div className="space-y-3">
              {formData.testCases.map((tc, index) => (
                <div key={index} className="border border-[#D1D1E6] rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900">Test Case {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1.5">
                        Input
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-[#D1D1E6] rounded-xl bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-none"
                        placeholder="Input data..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1.5">
                        Expected Output
                      </label>
                      <textarea
                        value={tc.output}
                        onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-[#D1D1E6] rounded-xl bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-none"
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      value={tc.explanation || ''}
                      onChange={(e) => updateTestCase(index, 'explanation', e.target.value)}
                      className="w-full h-10 px-3 border border-[#D1D1E6] rounded-xl bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                      placeholder="Explain this test case..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`hidden-${index}`}
                      checked={tc.is_hidden || false}
                      onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                      className="w-4 h-4 text-[#403f75] border-[#D1D1E6] rounded focus:ring-[#403f75]"
                    />
                    <label htmlFor={`hidden-${index}`} className="ml-2 text-sm font-bold text-[#9A9AC9]">
                      Hidden test case (not visible to students)
                    </label>
                  </div>
                </div>
              ))}

              {formData.testCases.length === 0 && (
                <div className="text-center py-6 text-[#9A9AC9] border-2 border-dashed border-[#D1D1E6] rounded-xl bg-gray-50 font-bold">
                  <p>No test cases added yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-12 border border-[#D1D1E6] rounded-xl text-[#9A9AC9] font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-12 bg-[#403f75] hover:bg-[#2d2d53] text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CodingBankModal;
