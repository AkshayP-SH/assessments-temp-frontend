import { useCallback } from 'react';
import codeExecutionAPI from '../services/codeExecutionAPI';

/**
 * Hook to handle code execution and test case evaluation
 */
export const useCodeExecution = ({
  answers,
  setCodingConsoleOutput
}) => {
  const runCode = useCallback(async (currentQuestion, currentQ) => {
    const currentAnswer = answers[currentQuestion];
    const currentLang = currentAnswer?.language || 'java';
    
    // In actual implementation, we might need a fallback getStarterCode, 
    // but the caller can handle ensuring the code exists
    const currentCode = currentAnswer?.code || currentAnswer?.codes?.[currentLang] || '';

    if (!currentCode.trim()) {
      alert('Please write some code first!');
      return { success: false, reason: 'empty_code' };
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
        // No test cases, run raw code
        const result = await codeExecutionAPI.executeCode(currentCode, currentLang);
        
        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            running: false,
            results: [{
              testCase: 1,
              input: 'No input',
              expectedOutput: 'N/A',
              actualOutput: result.output || result.error || 'No output',
              passed: !result.error,
              executionTime: result.executionTime || '0',
              memory: result.memory || '0',
              error: result.error
            }],
            passedCount: result.error ? 0 : 1,
            totalCount: 1,
            summary: {
              status: result.error ? 'failed' : 'passed',
              percentage: result.error ? '0.0' : '100.0'
            },
            timestamp: new Date().toLocaleTimeString(),
            running: false
          }
        }));
        
        return { success: true, type: 'raw', result };
      } else {
        // Evaluate against test cases
        const result = await codeExecutionAPI.evaluateTestCases(currentCode, currentLang, testCases);
        
        setCodingConsoleOutput(prev => ({
          ...prev,
          [currentQuestion]: {
            running: false,
            results: result.results || [],
            passedCount: result.summary?.passedCount || 0,
            totalCount: result.summary?.totalCount || testCases.length,
            summary: result.summary || { status: 'failed', percentage: '0.0' },
            timestamp: new Date().toLocaleTimeString(),
            running: false
          }
        }));
        
        return { success: true, type: 'test_cases', result };
      }
    } catch (error) {
      console.error('Code execution error:', error);
      alert('Failed to execute code. Please try again.');
      
      setCodingConsoleOutput(prev => ({
        ...prev,
        [currentQuestion]: {
          running: false,
          results: [{
            testCase: 1,
            input: 'System Error',
            expectedOutput: 'N/A',
            actualOutput: String(error.message || 'Unknown error'),
            passed: false,
            error: true
          }],
          passedCount: 0,
          totalCount: 1,
          summary: {
            status: 'failed',
            percentage: '0.0'
          },
          timestamp: new Date().toLocaleTimeString(),
          running: false
        }
      }));
      
      return { success: false, error };
    }
  }, [answers, setCodingConsoleOutput]);

  return { runCode };
};
