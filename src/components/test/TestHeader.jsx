import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import ThemeSelector from '../ThemeSelector';

const TestHeader = ({
  title = 'Assessment',
  currentQuestion = 0,
  totalQuestions = 0,
  formattedTime = '00:00',
  editorTheme = 'default',
  onFinish
}) => {
  return (
    <header className="bg-white border-b border-shnoor-light shadow-lg flex-shrink-0">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-shnoor-navy to-shnoor-indigo rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-base">EX</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-shnoor-navy truncate max-w-full">
                {title}
              </h1>
              <p className="text-[10px] sm:text-xs text-shnoor-indigoMedium truncate">
                Question {currentQuestion + 1} of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Center: Timer */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-shnoor-lavender px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-inner border border-shnoor-light flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-shnoor-indigo" />
            <span className="text-sm sm:text-xl font-mono font-bold text-shnoor-navy">{formattedTime}</span>
          </div>

          {/* Right: Theme & Finish Test Button */}
          <div className="flex items-center justify-end gap-2 lg:flex-none">
            <ThemeSelector variant={editorTheme === 'default' ? 'light' : 'dark'} />
            <button
              onClick={onFinish}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-shnoor-danger to-shnoor-danger hover:from-shnoor-danger hover:to-shnoor-danger text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 border-2 border-shnoor-danger text-xs sm:text-base flex-shrink-0"
            >
              <CheckCircle size={16} className="sm:w-5 sm:h-5" />
              <span>Finish<span className="hidden sm:inline"> Test</span></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TestHeader;
