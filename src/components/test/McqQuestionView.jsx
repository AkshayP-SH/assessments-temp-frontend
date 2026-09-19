import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Flag, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const McqQuestionView = ({
  currentQ,
  currentQuestion,
  answers,
  markedForReview,
  toggleMarkForReview,
  handleAnswerSelect,
  handlePrevious,
  handleNext,
  saveProgressNow
}) => {
  if (!currentQ) return null;

  const isMarked = markedForReview.has(currentQuestion);

  return (
    <main className="flex-1 flex flex-col bg-shnoor-lavender p-3 sm:p-6 overflow-hidden order-1 lg:order-2">
      {/* Question Card - Fixed Height with Internal Scrolling */}
      <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-shnoor-light p-4 sm:p-8 flex flex-col overflow-hidden min-h-0">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-shnoor-indigo to-shnoor-navy text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-lg text-sm sm:text-base flex-shrink-0">
              Q{currentQuestion + 1}
            </span>
            {isMarked && (
              <span className="flex items-center space-x-1 text-shnoor-warning bg-shnoor-warningLight px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-shnoor-warningLight shadow-sm">
                <Flag size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden sm:inline">Marked for Review</span>
                <span className="sm:hidden">Marked</span>
              </span>
            )}
          </div>
          <button
            onClick={toggleMarkForReview}
            className={`
              flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm flex-shrink-0
              ${isMarked
                ? 'bg-shnoor-warningLight text-shnoor-warning hover:bg-shnoor-warningLight border border-shnoor-warningLight'
                : 'bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-mist border border-shnoor-light'}
            `}
          >
            <Flag size={14} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">{isMarked ? 'Unmark' : 'Mark for Review'}</span>
            <span className="sm:hidden">{isMarked ? 'Unmark' : 'Review'}</span>
          </button>
        </div>

        {/* Layout: Question & Options */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
          {/* Left Side: Question Text */}
          <div className="col-span-1 lg:col-span-3 bg-shnoor-lavender/30 rounded-xl p-4 sm:p-6 border-2 border-shnoor-mist overflow-y-visible lg:overflow-y-auto h-auto lg:h-full">
            <h3 className="text-sm font-semibold text-shnoor-indigoMedium mb-4 uppercase tracking-wide">
              Question
            </h3>
            {currentQ.format === 'paragraph' ? (
              <div className="text-lg text-shnoor-navy leading-relaxed prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQ.question}
                </ReactMarkdown>
              </div>
            ) : currentQ.format === 'code' ? (
              <pre className="text-sm text-shnoor-navy leading-relaxed bg-gray-50 p-4 rounded-lg overflow-x-auto font-mono border border-shnoor-mist">
                <code>{currentQ.question}</code>
              </pre>
            ) : (
              <p className="text-lg text-shnoor-navy leading-relaxed whitespace-pre-wrap font-medium">
                {currentQ.question}
              </p>
            )}
          </div>

          {/* Right Side: Options */}
          <div className="col-span-1 lg:col-span-2 bg-shnoor-lavender/30 rounded-xl p-4 sm:p-6 border-2 border-shnoor-mist overflow-y-visible lg:overflow-y-auto h-auto lg:h-full">
            <h3 className="text-sm font-semibold text-shnoor-indigoMedium mb-4 uppercase tracking-wide">
              Choose Your Answer
            </h3>
            <div className="space-y-3">
              {currentQ.options && currentQ.options.map((option, index) => (
                <label
                  key={index}
                  className={`
                    flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm bg-white
                    ${answers[currentQuestion] === index
                      ? 'border-shnoor-indigo bg-shnoor-lavender shadow-lg'
                      : 'border-shnoor-light hover:border-shnoor-soft hover:bg-shnoor-mist/30'}
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === index}
                    onChange={() => handleAnswerSelect(index)}
                    className="w-5 h-5 text-shnoor-indigo border-shnoor-light focus:ring-shnoor-indigo"
                  />
                  <span className="ml-4 text-shnoor-navy font-medium">{option}</span>
                  {answers[currentQuestion] === index && (
                    <CheckCircle className="ml-auto w-5 h-5 text-shnoor-indigo" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Navigation Buttons - Fixed at Bottom */}
      <div className="flex justify-between items-center mt-4 sm:mt-6 flex-shrink-0 gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`
            flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm sm:text-base flex-1 sm:flex-none
            ${currentQuestion === 0
              ? 'bg-shnoor-mist text-shnoor-soft cursor-not-allowed'
              : 'bg-white border-2 border-shnoor-light text-shnoor-navy hover:border-shnoor-soft hover:bg-shnoor-mist/30 hover:shadow-xl'}
          `}
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        <div className="flex space-x-2 sm:space-x-3 flex-1 sm:flex-none justify-end">
          <button
            onClick={() => {
              saveProgressNow();
              handleNext();
            }}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-shnoor-light text-shnoor-indigoMedium rounded-lg sm:rounded-xl font-semibold hover:border-shnoor-soft hover:bg-shnoor-mist/30 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Skip
          </button>

          <button
            onClick={() => {
              if (answers[currentQuestion] !== undefined) {
                saveProgressNow();
                handleNext();
              } else {
                alert('Please select an answer or click Skip');
              }
            }}
            className="flex items-center justify-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex-shrink-0"
          >
            <span className="hidden sm:inline">Save & Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default McqQuestionView;
