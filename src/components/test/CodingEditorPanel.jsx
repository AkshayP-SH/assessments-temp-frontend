import React from 'react';
import LazyMonacoEditor from '../LazyMonacoEditor';
import ErrorBoundary from '../ErrorBoundary';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import codeExecutionAPI from '../../services/codeExecutionAPI';

const CodingEditorPanel = ({
  currentQ,
  currentQuestion,
  totalQuestions,
  answers,
  setAnswers,
  codingConsoleOutput,
  setCodingConsoleOutput,
  editorTheme = 'default',
  getStarterCode,
  formatErrorForDisplay,
  saveProgressNow,
  handlePrevious,
  handleNext,
  handleVerticalMouseDown,
  consolePanelHeight = 256,
  bottomPanelTab = 'testCases',
  setBottomPanelTab,
  isMobileVisible = false
}) => {
  if (!currentQ) return null;

  const currentAnswer = answers[currentQuestion];
  const currentLang = currentAnswer?.language || 'java';
  const currentCode = currentAnswer?.code || currentAnswer?.codes?.[currentLang] || getStarterCode(currentLang);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setAnswers(prev => {
      const ans = prev[currentQuestion] || {};
      const lang = ans.language || 'java';

      const updatedCodes = {
        ...ans.codes,
        [lang]: ans.code || ans.codes?.[lang] || getStarterCode(lang)
      };

      const newCode = updatedCodes[newLanguage] || getStarterCode(newLanguage);

      return {
        ...prev,
        [currentQuestion]: {
          language: newLanguage,
          code: newCode,
          codes: updatedCodes
        }
      };
    });
  };

  const handleRunCode = async () => {
    if (!currentCode.trim()) {
      alert('Please write some code first!');
      return;
    }

    setCodingConsoleOutput(prev => ({
      ...prev,
      [currentQuestion]: {
        running: true,
        results: []
      }
    }));

    try {
      const testCases = currentQ.testCases || currentQ.publicTestCases || [];

      if (testCases.length === 0) {
        const result = await codeExecutionAPI.executeCode(currentCode, currentLang);

        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            running: false,
            results: [{
              testCase: 1,
              input: 'No input',
              expectedOutput: 'N/A',
              actualOutput: result.output || result.error,
              passed: result.success,
              executionTime: result.executionTime + 'ms',
              error: result.error
            }],
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      } else {
        const evaluation = await codeExecutionAPI.evaluateWithTestCases(
          currentCode,
          currentLang,
          testCases.map(tc => ({
            input: tc.input,
            output: tc.output || tc.expectedOutput,
            expected_output: tc.output || tc.expectedOutput,
            is_hidden: tc.isHidden || false
          }))
        );

        const results = evaluation.testResults.map((result, idx) => ({
          testCase: idx + 1,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          passed: result.passed,
          executionTime: result.executionTime + 'ms',
          error: result.error
        }));

        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            running: false,
            results: results,
            summary: evaluation.summary,
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setCodingConsoleOutput(prev => ({
        ...prev,
        [currentQuestion]: {
          running: false,
          results: [{
            testCase: 1,
            input: 'Error',
            expectedOutput: 'N/A',
            actualOutput: error.message,
            passed: false,
            executionTime: '0ms',
            error: error.message
          }],
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  const handleSubmitCode = async () => {
    if (!currentCode.trim()) {
      alert('Please write some code first!');
      return;
    }

    const studentId = localStorage.getItem('studentId');
    const testId = localStorage.getItem('selectedTestId');
    const codingQuestionId = currentQ.id;

    setCodingConsoleOutput(prev => ({
      ...prev,
      [currentQuestion]: {
        running: true
      }
    }));

    try {
      const result = await codeExecutionAPI.submitCodingSolution(
        studentId,
        codingQuestionId,
        testId,
        currentCode,
        currentLang
      );

      if (result.success) {
        const {
          passed,
          testCasesPassed,
          totalTestCases,
          percentage,
          publicTestResults,
          hiddenTestResults
        } = result.result;

        const formattedResults = [];

        if (publicTestResults && publicTestResults.length > 0) {
          publicTestResults.forEach((tc, idx) => {
            formattedResults.push({
              testCase: idx + 1,
              passed: tc.passed,
              input: tc.input || '(no input)',
              expectedOutput: tc.expectedOutput,
              actualOutput: tc.actualOutput || tc.actual || tc.output || '(no output)',
              error: tc.error || null,
              executionTime: tc.executionTime || 'N/A',
              isHidden: false,
              explanation: tc.explanation || null
            });
          });
        }

        if (hiddenTestResults && hiddenTestResults.length > 0) {
          hiddenTestResults.forEach((tc) => {
            formattedResults.push({
              testCase: (publicTestResults ? publicTestResults.length : 0) + tc.testNumber,
              passed: tc.passed,
              isHidden: true,
              input: '🔒 Hidden',
              expectedOutput: '🔒 Hidden',
              actualOutput: '🔒 Hidden',
              error: null,
              executionTime: 'N/A'
            });
          });
        }

        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            results: formattedResults,
            summary: {
              passedTestCases: testCasesPassed,
              failedTestCases: totalTestCases - testCasesPassed,
              totalTestCases: totalTestCases,
              percentage: percentage.toFixed(1)
            },
            timestamp: new Date().toLocaleTimeString(),
            isLoading: false
          }
        }));

        setAnswers(prev => ({
          ...prev,
          [currentQuestion]: {
            ...currentAnswer,
            language: currentLang,
            code: currentCode,
            codes: {
              ...currentAnswer?.codes,
              [currentLang]: currentCode
            },
            submitted: true,
            submittedAt: new Date().toISOString(),
            testCasesPassed,
            totalTestCases,
            passed
          }
        }));

        await saveProgressNow();
      } else {
        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            results: [{
              testCase: 1,
              passed: false,
              input: 'N/A',
              expectedOutput: 'N/A',
              actualOutput: 'N/A',
              error: `Submission failed: ${result.message}`,
              executionTime: 'N/A',
              isHidden: false
            }],
            summary: {
              passedTestCases: 0,
              failedTestCases: 1,
              totalTestCases: 1,
              percentage: '0.0'
            },
            timestamp: new Date().toLocaleTimeString(),
            running: false
          }
        }));
      }
    } catch (error) {
      console.error('Submit error:', error);
      setCodingConsoleOutput(prev => ({
        ...prev,
        [currentQuestion]: {
          results: [{
            testCase: 1,
            passed: false,
            input: 'N/A',
            expectedOutput: 'N/A',
            actualOutput: 'N/A',
            error: `Error: ${error.message}`,
            executionTime: 'N/A',
            isHidden: false
          }],
          summary: {
            passedTestCases: 0,
            failedTestCases: 1,
            totalTestCases: 1,
            percentage: '0.0'
          },
          timestamp: new Date().toLocaleTimeString(),
          running: false
        }
      }));
    }
  };

  const handleEditorChange = (value) => {
    setAnswers(prev => {
      const ans = prev[currentQuestion] || {};
      const lang = ans.language || 'java';

      return {
        ...prev,
        [currentQuestion]: {
          ...ans,
          language: lang,
          code: value,
          codes: {
            ...ans.codes,
            [lang]: value
          }
        }
      };
    });
  };

  return (
    <div
      className={`flex-1 flex-col bg-shnoor-navy code-editor-container min-w-0 shadow-xl pb-16 lg:pb-0 ${
        isMobileVisible ? 'flex w-full' : 'hidden'
      } lg:flex`}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-shnoor-navy border-b border-shnoor-indigo/30">
        <select
          value={currentLang}
          onChange={handleLanguageChange}
          className="px-3 py-1.5 bg-shnoor-indigo text-shnoor-lavender text-sm rounded-lg border border-shnoor-indigo/50 focus:ring-2 focus:ring-shnoor-lavender focus:border-transparent shadow-sm"
        >
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunCode}
            disabled={codingConsoleOutput[currentQuestion]?.running}
            className="px-4 py-1.5 bg-shnoor-success hover:bg-shnoor-success text-white text-sm rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm"
          >
            <span>▶</span>
            <span>{codingConsoleOutput[currentQuestion]?.running ? 'Running...' : 'Run'}</span>
          </button>
          <button
            onClick={handleSubmitCode}
            className="px-4 py-1.5 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white text-sm rounded-lg font-medium transition-all duration-200 shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <LazyMonacoEditor
            height="100%"
            language={currentLang === 'cpp' ? 'cpp' : currentLang}
            value={currentCode}
            onChange={handleEditorChange}
            theme={editorTheme === 'default' ? 'light' : 'vs-dark'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'off',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: true,
              parameterHints: { enabled: true },
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />
        </ErrorBoundary>
      </div>

      {/* Vertical Resize Handle */}
      <div
        className="hidden lg:block h-1 bg-shnoor-indigo/30 hover:bg-shnoor-indigo cursor-row-resize flex-shrink-0 transition-colors duration-200"
        onMouseDown={handleVerticalMouseDown}
        style={{ cursor: 'row-resize' }}
      />

      {/* Test Cases / Console Tabs */}
      <div
        className="border-t border-shnoor-indigo/30 flex flex-col"
        style={{
          height: window.innerWidth >= 1024 ? `${consolePanelHeight}px` : 'auto',
          minHeight: window.innerWidth < 1024 ? '200px' : 'auto',
          maxHeight: window.innerWidth < 1024 ? '300px' : 'none'
        }}
      >
        <div className="flex items-center space-x-4 px-4 py-2 bg-shnoor-navy border-b border-shnoor-indigo/30">
          <button
            onClick={() => setBottomPanelTab('testCases')}
            className={`text-sm font-medium pb-2 transition-all ${
              bottomPanelTab === 'testCases'
                ? 'text-shnoor-lavender border-b-2 border-shnoor-lavender'
                : 'text-shnoor-soft hover:text-shnoor-lavender'
            }`}
          >
            Test Cases
          </button>
          <button
            onClick={() => setBottomPanelTab('console')}
            className={`text-sm font-medium pb-2 transition-all ${
              bottomPanelTab === 'console'
                ? 'text-shnoor-lavender border-b-2 border-shnoor-lavender'
                : 'text-shnoor-soft hover:text-shnoor-lavender'
            }`}
          >
            Console
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-shnoor-navy">
          {bottomPanelTab === 'testCases' ? (
            codingConsoleOutput[currentQuestion]?.running ? (
              <div className="flex items-center space-x-2 text-shnoor-warning">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-shnoor-warning"></div>
                <span className="text-sm">Running test cases...</span>
              </div>
            ) : codingConsoleOutput[currentQuestion]?.results ? (
              <div className="space-y-3">
                {/* Summary */}
                {codingConsoleOutput[currentQuestion]?.summary && (
                  <div className="mb-4 p-3 bg-shnoor-indigo/20 rounded-lg border border-shnoor-indigo/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-shnoor-lavender">Test Results Summary</span>
                      <span className="text-xs text-shnoor-soft">
                        {codingConsoleOutput[currentQuestion].timestamp}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-shnoor-success">
                          {codingConsoleOutput[currentQuestion].summary.passedTestCases}
                        </div>
                        <div className="text-shnoor-soft">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-shnoor-danger">
                          {codingConsoleOutput[currentQuestion].summary.failedTestCases}
                        </div>
                        <div className="text-shnoor-soft">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-shnoor-lavender">
                          {codingConsoleOutput[currentQuestion].summary.percentage}%
                        </div>
                        <div className="text-shnoor-soft">Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Test Results */}
                {codingConsoleOutput[currentQuestion].results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border shadow-sm ${
                      result.passed
                        ? 'bg-shnoor-success/20 border-shnoor-success/50'
                        : 'bg-shnoor-danger/20 border-shnoor-danger/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${result.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                        TEST CASE {result.testCase}: {result.passed ? '✓ PASSED' : '✗ FAILED'}
                      </span>
                      <span className="text-xs text-shnoor-soft">{result.executionTime}</span>
                    </div>
                    <div className="text-xs font-mono space-y-1">
                      {!result.isHidden && (
                        <>
                          <div>
                            <span className="text-shnoor-soft">Input: </span>
                            <pre className="inline-block text-shnoor-lavender whitespace-pre-wrap break-words">
                              {result.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-shnoor-soft">Expected: </span>
                            <pre className="inline-block text-shnoor-lavender whitespace-pre-wrap break-words">
                              {result.expectedOutput}
                            </pre>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-shnoor-soft">Got: </span>
                        <div className={`mt-1 ${result.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                          {result.actualOutput &&
                          (result.actualOutput.includes('🐍') ||
                            result.actualOutput.includes('☕') ||
                            result.actualOutput.includes('🔧') ||
                            result.actualOutput.includes('🟨') ||
                            result.actualOutput.includes('Error:')) ? (
                            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed bg-gray-900/30 p-2 rounded border border-gray-600/30">
                              {formatErrorForDisplay(result.actualOutput)}
                            </pre>
                          ) : (
                            <span className="font-mono text-sm">{result.actualOutput}</span>
                          )}
                        </div>
                      </div>
                      {result.error && (
                        <div className="mt-2">
                          <span className="text-shnoor-soft text-xs uppercase tracking-wide">Error Details:</span>
                          <div className="mt-1 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <pre className="text-shnoor-danger text-sm font-mono whitespace-pre-wrap leading-relaxed">
                              {formatErrorForDisplay(result.error)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-shnoor-soft text-sm py-8">
                Click "Run" or "Submit" to see test results
              </div>
            )
          ) : (
            /* Console View */
            <div className="font-mono text-sm text-shnoor-lavender bg-black/30 p-4 rounded-lg min-h-[100px] border border-shnoor-indigo/20">
              {codingConsoleOutput[currentQuestion]?.running ? (
                <div className="flex items-center space-x-2 text-shnoor-warning">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-shnoor-warning"></div>
                  <span>Executing code...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {codingConsoleOutput[currentQuestion]?.results?.map((r, i) => (
                    <div key={i} className="mb-2">
                      <span className="text-shnoor-soft">
                        [{codingConsoleOutput[currentQuestion].timestamp}]{' '}
                      </span>
                      <span className={r.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}>
                        {r.actualOutput || r.error || 'No output'}
                      </span>
                    </div>
                  )) || 'No execution history'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Desktop Only */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 bg-shnoor-navy border-t border-shnoor-indigo/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentQuestion === 0
                  ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                  : 'bg-shnoor-indigo/30 hover:bg-shnoor-indigo/50 text-shnoor-lavender'
              }
            `}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestion >= totalQuestions - 1}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                currentQuestion >= totalQuestions - 1
                  ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                  : 'bg-shnoor-indigo/30 hover:bg-shnoor-indigo/50 text-shnoor-lavender'
              }
            `}
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Action Buttons - Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-shnoor-navy border-t border-shnoor-indigo/30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-1 justify-between items-center max-w-lg mx-auto w-full">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex-1 mr-2
              ${
                currentQuestion === 0
                  ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                  : 'bg-shnoor-indigo border border-shnoor-indigo/50 text-white shadow-md'
              }
            `}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestion >= totalQuestions - 1}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex-1 ml-2
              ${
                currentQuestion >= totalQuestions - 1
                  ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                  : 'bg-shnoor-indigo border border-shnoor-indigo/50 text-white shadow-md'
              }
            `}
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodingEditorPanel;
