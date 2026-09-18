import React from 'react';

const CodingProblemView = ({
  currentQ,
  leftPanelWidth = 33,
  isMobileVisible = false
}) => {
  if (!currentQ) return null;

  return (
    <div
      style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : undefined }}
      className={`bg-white overflow-y-auto custom-scrollbar pb-16 lg:pb-0 border-r border-shnoor-mist flex-shrink-0 ${
        isMobileVisible ? 'flex flex-col w-full h-full flex-1' : 'hidden'
      } lg:flex lg:flex-col lg:h-full`}
    >
      {/* Description Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-shnoor-mist bg-shnoor-lavender/30">
        <h4 className="text-sm font-bold text-shnoor-navy">Problem Description</h4>
      </div>

      <div className="p-4 sm:p-6">
        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-shnoor-navy mb-2">{currentQ.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gradient-to-r from-shnoor-warningLight to-shnoor-warningLight text-shnoor-warning text-xs font-semibold rounded-full border border-shnoor-warningLight shadow-sm">
              MEDIUM
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy text-white text-xs font-semibold rounded-full shadow-sm">
              {currentQ.marks || 10} Marks
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-shnoor-indigoMedium uppercase mb-2">Description</h4>
          <div className="text-shnoor-navy text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{currentQ.description}</pre>
          </div>
        </div>

        {/* Examples */}
        <div>
          <h4 className="text-sm font-semibold text-shnoor-indigoMedium uppercase mb-3">Examples</h4>
          <div className="space-y-4">
            {currentQ.testCases && currentQ.testCases.map((testCase, index) => (
              <div key={index} className="bg-shnoor-mist rounded-xl p-4 border border-shnoor-light shadow-sm">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Input</p>
                  <pre className="bg-shnoor-navy text-shnoor-lavender p-3 rounded-lg font-mono text-sm shadow-inner whitespace-pre-wrap break-words">
                    {testCase.input}
                  </pre>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Output</p>
                  <pre className="bg-shnoor-navy text-shnoor-lavender p-3 rounded-lg font-mono text-sm shadow-inner whitespace-pre-wrap break-words">
                    {testCase.output}
                  </pre>
                </div>
                {testCase.explanation && (
                  <div>
                    <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Explanation</p>
                    <p className="text-sm text-shnoor-navy">{testCase.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingProblemView;
