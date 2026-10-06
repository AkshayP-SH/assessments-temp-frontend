import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../config/api';
import DuplicateResolutionModal from './DuplicateResolutionModal';

const CodingBankModal = ({ question, onClose, onSave, categories = [], tags = [] }) => {
  const [uploadMode, setUploadMode] = useState('manual'); // 'manual' | 'bulk'
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateResolution, setDuplicateResolution] = useState(null);

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
      setUploadMode('manual');
    }
  }, [question]);

  const fetchQuestionDetails = async (id) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('clientToken') || '';
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
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('clientToken') || '';
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
      if (data.alreadyExists) {
        setDuplicateResolution({
          type: 'coding',
          duplicates: [{
            existingQuestion: data.existingQuestion || {
              id: data.questionId,
              title: formData.title,
              description: formData.description,
              category: formData.category,
              difficulty: formData.difficulty
            },
            newQuestion: formData
          }],
          isBulk: false,
          insertedCount: 0
        });
        return;
      } else if (data.success) {
        alert(question ? 'Question updated successfully' : 'Question created successfully');
        onSave();
        onClose();
      } else {
        alert(data.message || 'Failed to save question');
      }
    } catch {
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  // Bulk Upload Handler
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rows = XLSX.utils.sheet_to_json(ws);

          if (!rows || rows.length === 0) {
            alert('The uploaded file is empty.');
            setIsUploading(false);
            return;
          }

          const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('clientToken') || '';
          const response = await apiFetch('api/question-bank/coding/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questions: rows })
          });

          const data = await response.json();
          if (data.alreadyExists && Array.isArray(data.duplicates) && data.duplicates.length > 0) {
            setDuplicateResolution({
              type: 'coding',
              duplicates: data.duplicates,
              isBulk: true,
              insertedCount: data.count || 0
            });
            return;
          } else if (data.success) {
            alert(data.message || `Successfully added ${data.count} coding question(s) to Question Bank!`);
            onSave();
            onClose();
          } else {
            alert(data.message || 'Failed to upload coding questions');
          }
        } catch (err) {
          console.error('Error parsing file:', err);
          alert('Failed to parse file: ' + err.message);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert('Failed to upload file');
      setIsUploading(false);
    }
  };

  const handleResolveCodingReplacements = async (selectedReplacements) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('clientToken') || '';

      if (selectedReplacements.length === 1 && !duplicateResolution?.isBulk) {
        // Single coding question replace via PUT
        const target = selectedReplacements[0];
        const res = await apiFetch(`api/question-bank/coding/${target.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(target)
        });
        const resData = await res.json();
        if (resData.success) {
          alert('Coding question replaced successfully!');
          setDuplicateResolution(null);
          onSave();
          onClose();
        } else {
          alert(resData.message || 'Failed to replace question');
        }
      } else {
        // Batch replace via POST /coding/batch-replace
        const res = await apiFetch('api/question-bank/coding/batch-replace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ replacements: selectedReplacements })
        });
        const resData = await res.json();
        if (resData.success) {
          alert(`Successfully replaced ${selectedReplacements.length} coding question(s)!`);
          setDuplicateResolution(null);
          onSave();
          onClose();
        } else {
          alert(resData.message || 'Failed to replace coding questions');
        }
      }
    } catch (err) {
      console.error('Error replacing coding questions:', err);
      alert('Failed to replace coding questions');
    }
  };

  const handleKeepExisting = () => {
    setDuplicateResolution(null);
    onSave();
    onClose();
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    const sampleHeaders = [
      ['Title', 'Description', 'Difficulty', 'Category', 'Marks', 'TimeLimit', 'MemoryLimit', 'SampleInput', 'SampleOutput', 'Explanation', 'Tags'],
      ['Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'easy', 'Arrays', '10', '1.0', '256', '2 7 11 15\n9', '0 1', 'Because nums[0] + nums[1] == 9, return [0, 1].', 'arrays,hash-table'],
      ['Reverse String', 'Write a function that reverses a string.', 'easy', 'Strings', '10', '1.0', '256', 'hello', 'olleh', 'The string hello reversed is olleh', 'strings,two-pointers']
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleHeaders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Coding_Questions');
    XLSX.writeFile(wb, 'Coding_Question_Bank_Sample_Template.xlsx');
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

        {/* Mode Selector (Manual Entry vs Bulk Upload) */}
        {!question && (
          <div className="flex border-b border-gray-100 px-6 pt-2 bg-gray-50/50 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setUploadMode('manual')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                uploadMode === 'manual'
                  ? 'border-[#403f75] text-[#403f75] bg-white rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('bulk')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                uploadMode === 'bulk'
                  ? 'border-[#403f75] text-[#403f75] bg-white rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload (Excel / CSV)</span>
            </button>
          </div>
        )}

        {/* Bulk Upload Mode */}
        {!question && uploadMode === 'bulk' ? (
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#403f75]">Download Coding Template</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Use our sample template containing the expected columns (Title, Description, SampleInput, SampleOutput, etc.)
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#403f75] text-[#403f75] hover:bg-[#403f75] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Sample Template (.xlsx)</span>
              </button>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-[#D1D1E6] hover:border-[#403f75] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/40 relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleBulkUpload}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#403f75] mb-4">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {isUploading ? 'Uploading & checking duplicates...' : 'Click or Drag & Drop File Here'}
              </h3>
              <p className="text-xs text-[#9A9AC9] max-w-sm mb-4">
                Upload your Excel (.xlsx, .xls) or CSV file with coding questions to automatically verify and add them to the Question Bank.
              </p>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-white border border-[#D1D1E6] rounded-md text-[10px] font-bold text-gray-600">.XLSX</span>
                <span className="px-2.5 py-1 bg-white border border-[#D1D1E6] rounded-md text-[10px] font-bold text-gray-600">.XLS</span>
                <span className="px-2.5 py-1 bg-white border border-[#D1D1E6] rounded-md text-[10px] font-bold text-gray-600">.CSV</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-11 border border-[#D1D1E6] rounded-xl text-[#9A9AC9] font-bold hover:bg-gray-50 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Manual Entry Form */
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
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="categories-list"
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                  placeholder="e.g., Algorithms"
                />
                <datalist id="categories-list">
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    list="coding-tags-list"
                    className="flex-1 h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
                <datalist id="coding-tags-list">
                  {tags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                {/* Tag Pills */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#403f75] text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Cases */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  Test Cases <span className="text-red-500">*</span>
                </h3>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-[#403f75] hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test Case</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.testCases.map((tc, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        Test Case {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Input <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#D1D1E6] bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#403f75]"
                          placeholder="Input data..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Output <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={tc.output}
                          onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#D1D1E6] bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#403f75]"
                          placeholder="Expected output..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={tc.explanation || ''}
                        onChange={(e) => updateTestCase(index, 'explanation', e.target.value)}
                        className="w-full h-8 px-3 rounded-lg border border-[#D1D1E6] bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#403f75]"
                        placeholder="Why this is the expected output..."
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={tc.is_hidden || false}
                        onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#403f75] focus:ring-[#403f75]"
                      />
                      <span className="text-xs text-gray-600">Hidden Test Case</span>
                    </label>
                  </div>
                ))}
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
        )}
      </div>

      {/* Duplicate Resolution Modal for Coding Questions */}
      {duplicateResolution && (
        <DuplicateResolutionModal
          isOpen={Boolean(duplicateResolution)}
          type="coding"
          duplicates={duplicateResolution.duplicates}
          insertedCount={duplicateResolution.insertedCount}
          onReplace={handleResolveCodingReplacements}
          onKeepExisting={handleKeepExisting}
          onClose={() => setDuplicateResolution(null)}
        />
      )}
    </div>
  );
};

export default CodingBankModal;
