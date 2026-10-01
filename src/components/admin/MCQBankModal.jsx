import { useState, useEffect } from 'react';
import { X, Upload, FileText, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../config/api';

const MCQBankModal = ({ question, onClose, onSave, categories = [], tags = [] }) => {
  // Mode selection: 'manual' | 'bulk' (only selectable when creating new questions)
  const [uploadMode, setUploadMode] = useState('manual');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: 1,
    difficulty: 'medium',
    category: '',
    tags: []
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        option_a: question.option_a || '',
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        correct_option: question.correct_option || 'A',
        marks: question.marks || 1,
        difficulty: question.difficulty || 'medium',
        category: question.category || '',
        tags: question.tags || []
      });
      setUploadMode('manual');
    }
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('clientToken') || '';
      const url = question
        ? `api/question-bank/mcq/${question.id}`
        : 'api/question-bank/mcq';

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
        alert(data.message || 'Question already exists in Question Bank');
        onSave();
        onClose();
      } else if (data.success) {
        alert(question ? 'Question updated successfully' : 'Question added successfully');
        onSave();
        onClose();
      } else {
        alert(data.message || 'Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
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
          const response = await apiFetch('api/question-bank/mcq/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questions: rows })
          });

          const data = await response.json();
          if (data.alreadyExists) {
            alert(data.message || 'Question(s) already exist in Question Bank');
            onSave();
            onClose();
          } else if (data.success) {
            alert(data.message || `Successfully added ${data.count} question(s) to Question Bank!`);
            onSave();
            onClose();
          } else {
            alert(data.message || 'Failed to upload questions');
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

  // Download Sample CSV
  const handleDownloadSample = () => {
    const sampleHeaders = [
      ['Question', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectOption', 'Marks', 'Difficulty', 'Category', 'Tags'],
      ['What is the capital of France?', 'London', 'Paris', 'Berlin', 'Madrid', 'B', '1', 'easy', 'General', 'geography,europe'],
      ['Which data structure uses LIFO order?', 'Queue', 'Array', 'Stack', 'Tree', 'C', '2', 'medium', 'Computer Science', 'data-structures']
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleHeaders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_MCQs');
    XLSX.writeFile(wb, 'Question_Bank_Sample_Template.xlsx');
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {question ? 'Edit MCQ Question' : 'Add MCQ Question'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9A9AC9] hover:text-gray-900 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector (Manual Entry vs Bulk Upload) — Only shown when adding new questions */}
        {!question && (
          <div className="flex border-b border-gray-100 px-6 pt-2 bg-gray-50/50 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setUploadMode('manual')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${uploadMode === 'manual'
                  ? 'border-[#403f75] text-[#403f75]'
                  : 'border-transparent text-[#9A9AC9] hover:text-gray-900'
                }`}
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('bulk')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${uploadMode === 'bulk'
                  ? 'border-[#403f75] text-[#403f75]'
                  : 'border-transparent text-[#9A9AC9] hover:text-gray-900'
                }`}
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </button>
          </div>
        )}

        {/* View 1: Bulk Upload */}
        {!question && uploadMode === 'bulk' ? (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#403f75] transition-colors relative">
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#403f75]"></div>
                </div>
              )}

              <div className="w-16 h-16 bg-[#EEEDF9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#403f75]" />
              </div>
              <p className="text-gray-900 font-bold mb-1">Drag and drop your Excel/CSV file here</p>
              <p className="text-sm text-[#9A9AC9] mb-6">Supported formats: .csv, .xlsx, .xls</p>

              <label className="inline-flex items-center px-6 py-3 bg-[#403f75] hover:bg-[#2d2d53] text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm">
                <Upload size={18} className="mr-2" />
                Select File
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleBulkUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="bg-[#F4F3FB] p-4 rounded-xl flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-[#403f75] shrink-0 mt-0.5" />
                <div className="text-sm text-[#403f75]">
                  <p className="font-bold mb-1">Excel/CSV Template Format:</p>
                  <p className="text-xs text-[#5D5D8A]">
                    Question, Option1, Option2, Option3, Option4, CorrectOption(1-4 or A-D), Marks, Difficulty, Category, Tags
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#403f75] border border-[#D1D1E6] rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shrink-0"
              >
                <Download size={14} />
                Download Sample
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-11 border border-[#D1D1E6] rounded-xl text-[#9A9AC9] font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Manual Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                required
                rows={2}
                className="w-full px-4 py-2 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors resize-none"
                placeholder="Enter your question..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Option A <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.option_a}
                  onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                  required
                  placeholder="Option A"
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Option B <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.option_b}
                  onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                  required
                  placeholder="Option B"
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Option C
                </label>
                <input
                  type="text"
                  value={formData.option_c}
                  onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                  placeholder="Option C"
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Option D
                </label>
                <input
                  type="text"
                  value={formData.option_d}
                  onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                  placeholder="Option D"
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Correct Option <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.correct_option}
                  onChange={(e) => setFormData({ ...formData, correct_option: e.target.value })}
                  required
                  className="w-full h-10 px-4 rounded-xl border border-[#D1D1E6] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                  required
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
                  placeholder="e.g., programming, aptitude"
                />
                <datalist id="categories">
                  {(categories || []).map(cat => (
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
                    placeholder="Type tag and press enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 h-10 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-bold">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-600 hover:text-purple-900 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <datalist id="tags">
                  {tags.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>

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
    </div>
  );
};

export default MCQBankModal;
