import { useState } from 'react';
import { Upload, FileSpreadsheet, FileText, X } from 'lucide-react';
import PropTypes from 'prop-types';
import ModalShell, { ModalButton, SectionTitle } from './ModalShell';

const ACCEPTED = /\.(csv|xlsx|xls)$/i;
const TEMPLATE_COLUMNS = ['Question', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectOption(1-4)', 'Marks', 'Tags'];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// The file is held here until "Upload" is clicked, then handed to the
// existing onUpload handler in the same shape as a file input change event.
const BulkUploadModal = ({ testTitle, isUploading, onUpload, onClose }) => {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [typeError, setTypeError] = useState(false);

  const pickFile = (picked) => {
    if (!picked) return;
    if (!ACCEPTED.test(picked.name)) {
      setTypeError(true);
      return;
    }
    setTypeError(false);
    setFile(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    pickFile(e.dataTransfer.files?.[0]);
  };

  return (
    <ModalShell
      icon={Upload}
      title={testTitle || 'Bulk Upload'}
      subtitle="Import questions from an Excel or CSV file"
      onClose={onClose}
      size="sm"
      footerStart={file ? '1 file selected' : 'No file selected'}
      footerActions={
        <>
          <ModalButton variant="outline" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton
            icon={Upload}
            loading={isUploading}
            disabled={!file}
            onClick={() => onUpload({ target: { files: [file], value: '' } })}
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </ModalButton>
        </>
      }
    >
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-shnoor-mist p-3">
          <div className="w-10 h-10 rounded-lg bg-shnoor-lavender text-shnoor-indigo flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-shnoor-navy truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={isUploading}
            aria-label="Remove file"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`h-[220px] flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              isDragOver
                ? 'border-shnoor-indigo bg-shnoor-lavender/50'
                : 'border-shnoor-light hover:border-shnoor-indigo hover:bg-shnoor-lavender/30'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-shnoor-lavender text-shnoor-indigo flex items-center justify-center mb-3">
              <Upload size={22} />
            </div>
            <p className="text-sm text-shnoor-navy">
              Drag &amp; drop your file here, or{' '}
              <span className="font-semibold text-shnoor-indigo underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Supported formats: .csv, .xlsx, .xls</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files[0]);
                e.target.value = '';
              }}
              disabled={isUploading}
            />
          </label>
          {typeError && (
            <p className="text-xs text-red-600 mt-2">Unsupported file type. Please choose a .csv, .xlsx or .xls file.</p>
          )}
        </div>
      )}

      <section className="rounded-xl bg-gray-50 border border-shnoor-mist p-4">
        <SectionTitle>
          <span className="inline-flex items-center gap-1.5">
            <FileText size={14} />
            Template columns
          </span>
        </SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_COLUMNS.map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 rounded-md bg-white border border-shnoor-mist text-xs font-mono text-shnoor-navy"
            >
              {col}
            </span>
          ))}
        </div>
      </section>
    </ModalShell>
  );
};

BulkUploadModal.propTypes = {
  testTitle: PropTypes.string,
  isUploading: PropTypes.bool,
  onUpload: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default BulkUploadModal;
