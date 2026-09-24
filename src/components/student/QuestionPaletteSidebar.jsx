import { useState, memo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

const QuestionPaletteSidebar = memo(({
  questions = [],
  codingQuestions = [],
  currentQuestion = 0,
  getQuestionStatus,
  handleNavigate,
  answers = {},
  markedForReview = new Set(),
  totalQuestions = 0,
  proctoringMessages = [],
  isCollapsed = false,
  onToggleCollapse,
  isMobileVisible = true,
  className = '',
}) => {
  const [proctorMessagesCollapsed, setProctorMessagesCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-b lg:border-b-0 border-r border-shnoor-mist flex flex-col flex-shrink-0 overflow-y-auto pb-16 lg:pb-0 transition-all duration-300 ${
        isMobileVisible ? 'flex w-full h-full flex-1' : 'hidden'
      } lg:flex ${isCollapsed ? 'lg:w-14' : 'lg:w-64'} lg:h-full ${className}`}
    >
      {/* Collapse Toggle Button - Desktop Only */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center p-2 hover:bg-shnoor-lavender transition-colors border-b border-shnoor-mist flex-shrink-0"
        title={isCollapsed ? 'Expand Palette' : 'Collapse Palette'}
      >
        {isCollapsed ? (
          <ChevronRight size={20} className="text-shnoor-indigo" />
        ) : (
          <ChevronLeft size={20} className="text-shnoor-indigo" />
        )}
      </button>

      {/* Expanded View */}
      {!isCollapsed && (
        <>
          <div className="p-3 border-b border-shnoor-mist flex-shrink-0">
            <h3 className="font-bold text-shnoor-navy mb-3 text-sm">Question Palette</h3>
            {questions.length > 0 && (
              <>
                <p className="text-xs text-shnoor-indigoMedium mb-2 font-medium">MCQ Questions</p>
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50';
                    if (status === 'answered') bgClass = 'bg-shnoor-success text-white border border-shnoor-success';
                    else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
                    else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';
                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleNavigate(index)}
                        className={`w-9 h-9 rounded-lg font-bold text-xs transition-all shadow-sm hover:opacity-80 ${bgClass} ${
                          currentQuestion === index ? 'ring-2 ring-shnoor-indigo ring-offset-1' : ''
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {codingQuestions.length > 0 && (
              <>
                <p className="text-xs text-shnoor-indigoMedium mb-2 font-medium">Coding Questions</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {codingQuestions.map((_, index) => {
                    const actualIndex = questions.length + index;
                    const status = getQuestionStatus(actualIndex);
                    let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50';
                    if (status === 'answered') bgClass = 'bg-shnoor-indigo text-white border border-shnoor-indigo';
                    else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
                    else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';
                    return (
                      <button
                        type="button"
                        key={actualIndex}
                        onClick={() => handleNavigate(actualIndex)}
                        className={`w-9 h-9 rounded-lg font-semibold text-xs transition-all hover:opacity-80 ${bgClass} ${
                          currentQuestion === actualIndex ? 'ring-2 ring-shnoor-indigo ring-offset-1' : ''
                        }`}
                      >
                        C{index + 1}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 space-y-2 flex-shrink-0">
            <div className="text-xs font-bold text-shnoor-indigoMedium uppercase mb-1">Summary</div>
            <div className="flex items-center space-x-2 text-xs">
               <div className="w-3 h-3 bg-shnoor-success rounded"></div>
              <span className="text-shnoor-navy">
                Answered ({Object.keys(answers).filter(k => !markedForReview.has(parseInt(k))).length})
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-shnoor-warning rounded"></div>
              <span className="text-shnoor-navy">Marked ({markedForReview.size})</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-shnoor-mist rounded border border-shnoor-mist"></div>
              <span className="text-shnoor-navy">
                Not Answered ({totalQuestions - Object.keys(answers).length})
              </span>
            </div>
          </div>

          {/* Messages from Proctor - inline at bottom of sidebar */}
          <div className="border-t border-shnoor-mist flex-1 flex flex-col min-h-0">
            <div
              onClick={() => setProctorMessagesCollapsed(prev => !prev)}
              className="flex items-center space-x-2 px-3 py-2 border-b border-shnoor-mist bg-shnoor-lavender/30 flex-shrink-0 cursor-pointer select-none"
              title={proctorMessagesCollapsed ? 'Expand Messages from Proctor' : 'Collapse Messages from Proctor'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-shnoor-navy"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="text-xs font-bold text-shnoor-navy">Messages from Proctor</span>
              {proctoringMessages.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {proctoringMessages.length > 9 ? '9+' : proctoringMessages.length}
                </span>
              )}
              <span className="ml-auto text-shnoor-indigoMedium">
                {proctorMessagesCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </span>
            </div>
            {!proctorMessagesCollapsed && (
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                {proctoringMessages.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-300 mt-0.5">Proctor messages will appear here</p>
                  </div>
                ) : (
                  proctoringMessages.map((msg, idx) => (
                    <div key={msg.id || idx} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-xs text-gray-700 leading-relaxed">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Collapsed View - Vertical Question Numbers */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-2 overflow-y-auto">
          {/* MCQ Questions */}
          {questions.map((_, index) => {
            const status = getQuestionStatus(index);
            let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50';
            if (status === 'answered') bgClass = 'bg-shnoor-success text-white border border-shnoor-success';
            else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
            else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';
            return (
              <button
                type="button"
                key={index}
                onClick={() => handleNavigate(index)}
                className={`w-9 h-9 rounded-lg font-bold text-xs transition-all shadow-sm hover:opacity-80 ${bgClass} ${
                  currentQuestion === index ? 'ring-2 ring-shnoor-indigo ring-offset-1' : ''
                }`}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}

          {/* Separator if both MCQ and Coding exist */}
          {questions.length > 0 && codingQuestions.length > 0 && (
            <div className="w-8 h-px bg-shnoor-mist my-2"></div>
          )}

          {/* Coding Questions */}
          {codingQuestions.map((_, index) => {
            const actualIndex = questions.length + index;
            const status = getQuestionStatus(actualIndex);
            let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50';
            if (status === 'answered') bgClass = 'bg-shnoor-indigo text-white border border-shnoor-indigo';
            else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
            else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';
            return (
              <button
                type="button"
                key={actualIndex}
                onClick={() => handleNavigate(actualIndex)}
                className={`w-9 h-9 rounded-lg font-semibold text-xs transition-all hover:opacity-80 ${bgClass} ${
                  currentQuestion === actualIndex ? 'ring-2 ring-shnoor-indigo ring-offset-1' : ''
                }`}
                title={`Coding Question ${index + 1}`}
              >
                C{index + 1}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
});

export default QuestionPaletteSidebar;
