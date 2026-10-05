import React from 'react';
import { ArrowLeft, Upload, FileText } from 'lucide-react';

const TestBulkStep = ({
  testTitle,
  setStep,
  isUploading,
  handleBulkUpload
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-shnoor-mist">
        <button
          type="button"
          onClick={() => setStep('init')}
          className="p-2 hover:bg-shnoor-lavender rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-shnoor-navy" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-shnoor-navy">{testTitle}</h2>
          <p className="text-sm text-shnoor-navy">Bulk Upload via Excel/CSV</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-shnoor-mist rounded-lg p-12 text-center hover:border-shnoor-indigo transition-colors relative">
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shnoor-indigo"></div>
          </div>
        )}

        <div className="w-16 h-16 bg-shnoor-lavender rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-shnoor-navy" />
        </div>
        <p className="text-shnoor-navy mb-2">Drag and drop your Excel/CSV file here</p>
        <p className="text-sm text-shnoor-navy mb-6">Supported formats: .csv, .xlsx, .xls</p>

        <label className="inline-flex items-center px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
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

      <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg flex items-start space-x-3">
        <div className="flex-shrink-0">
          <FileText className="h-5 w-5 text-shnoor-indigo" />
        </div>
        <div className="text-sm text-shnoor-indigo">
          <p className="font-bold mb-1">CSV Template Format:</p>
          <p>Question, Option1, Option2, Option3, Option4, CorrectOption(1-4), Marks, Tags</p>
        </div>
      </div>
    </div>
  );
};

export default TestBulkStep;
