import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTabSwitch } from '../hooks/useTabSwitch';
import { useProctoringWithAI } from '../hooks/useProctoringWithAI';
import FullscreenWarning from '../components/FullscreenWarning';
import AIViolationAlert from '../components/AIViolationAlert';
import StudentMessageAlert from '../components/student/StudentMessageAlert';
import QuestionPaletteSidebar from '../components/student/QuestionPaletteSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import TestHeader from '../components/test/TestHeader';
import McqQuestionView from '../components/test/McqQuestionView';
import CodingProblemView from '../components/test/CodingProblemView';
import CodingEditorPanel from '../components/test/CodingEditorPanel';
import TerminationModal from '../components/test/TerminationModal';
import SubmitConfirmModal from '../components/test/SubmitConfirmModal';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { apiFetch } from '../config/api';
import { getSavedTheme } from '../utils/theme';

const TestScreen = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [codingConsoleOutput, setCodingConsoleOutput] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const lastSavedStateRef = useRef(null);

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Termination modal state
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationData, setTerminationData] = useState(null);

  // Navigation & panels state
  const [warningsSidebarCollapsed, setWarningsSidebarCollapsed] = useState(false);
  const [activeCodingTab, setActiveCodingTab] = useState('questions'); // questions, description, code
  const [bottomPanelTab, setBottomPanelTab] = useState('testCases'); // testCases, console

  // Resizable panel states
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // percentage
  const [consolePanelHeight, setConsolePanelHeight] = useState(256); // pixels
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);

  // Starter code templates
  const getStarterCode = (language) => {
    const templates = {
      java: `public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello World");
    }
}`,
      python: `def solution():
    # Write your code here
    print("Hello World")

if __name__ == "__main__":
    solution()`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello World" << endl;
    return 0;
}`
    };
    return templates[language] || templates.java;
  };

  const [visited, setVisited] = useState(new Set([0]));
  const [warningCount, setWarningCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState(3600);
  const [hasStarted, setHasStarted] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [currentAIViolation, setCurrentAIViolation] = useState(null);
  const [aiViolationCount, setAiViolationCount] = useState(0);
  const [editorTheme, setEditorTheme] = useState(getSavedTheme());

  const totalQuestions = questions.length + codingQuestions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined).length;
  const markedForReviewCount = markedForReview.size;

  const formatErrorForDisplay = (err) => {
    if (!err) return '';
    return err
      .replace(/Tip: Install JDK \(javac\) or start Docker Desktop\./g, 'Tip: To fix this, please install Java JDK on your computer or start Docker Desktop.')
      .replace(/Command failed with exit code \d+:\s*/g, '')
      .replace(/Error: Command failed:\s*/g, '')
      .replace(/^.*alpine.*$/gm, '')
      .replace(/\/app\//g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim() || err;
  };

  const { showWarning, enterFullscreen } = useFullscreen();

  const handleTimeUp = useCallback(() => {}, []);

  const { timeLeft, formattedTime, stopTimer } = useTimer(
    initialTimeRemaining,
    handleTimeUp
  );

  const handleCameraLost = useCallback((reason) => {
    alert(`⚠️ ${reason}\n\nYour exam has been terminated.`);
    stopTimer();
    localStorage.removeItem('selectedTestId');
    navigate('/dashboard', {
      replace: true,
      state: {
        message: 'Exam terminated due to camera issue',
        type: 'error'
      }
    });
  }, [navigate, stopTimer]);

  const handleAIViolation = useCallback((violation) => {
    console.log('[AI Violation Detected]', violation);
    setCurrentAIViolation(violation);
    setAiViolationCount(prev => prev + 1);

    setTimeout(() => {
      setCurrentAIViolation(null);
    }, 5000);

    if (violation.severity === 'high') {
      const highSeverityCount = aiViolationCount + 1;
      if (highSeverityCount >= 5) {
        alert('⚠️ EXAM TERMINATED\n\nMultiple cheating attempts detected by AI monitoring system.\n\nYour exam has been flagged and submitted automatically.');
        submitTest('ai_violation_limit');
      }
    }
  }, [aiViolationCount]);

  const handleForceStop = useCallback((data) => {
    console.log('[Force Stop] Admin stopped test:', data);
    setTerminationData(data);
    setShowTerminationModal(true);
  }, []);

  const {
    startProctoring,
    stopProctoring,
    messages: proctoringMessages,
    currentMessage,
    dismissCurrentMessage
  } = useProctoringWithAI(handleCameraLost, handleAIViolation, null, handleForceStop);

  useEffect(() => {
    const syncTheme = () => setEditorTheme(getSavedTheme());
    window.addEventListener('themechange', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('themechange', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const submitTest = useCallback(async (reason = 'manual') => {
    setIsSubmitting(true);
    stopTimer();
    stopProctoring();

    const testId = localStorage.getItem('selectedTestId');
    const applicationId = localStorage.getItem('currentApplicationId');
    const studentId = localStorage.getItem('studentId');
    const token = localStorage.getItem('studentAuthToken');

    console.log('=== SUBMITTING TEST ===');
    console.log('Test ID:', testId);
    console.log('Student ID:', studentId);
    console.log('Answers:', answers);
    console.log('Reason:', reason);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await apiFetch('api/student/submit-exam', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          testId: testId,
          studentId: studentId,
          applicationId: applicationId ? parseInt(applicationId, 10) : null,
          answers: answers,
          submissionReason: reason,
          warningCount: warningCount,
          timeRemaining: timeLeft
        })
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        localStorage.setItem('lastTestId', testId);
        localStorage.removeItem('selectedTestId');
        localStorage.removeItem('currentApplicationId');

        navigate('/result', {
          state: {
            result: {
              ...data.result,
              testId: parseInt(testId),
              studentId: studentId
            },
            submissionReason: reason
          }
        });
      } else {
        setIsSubmitting(false);
        alert('Failed to submit exam: ' + data.message);
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error submitting exam:', err);
      alert('Error submitting exam. Please try again.');
    }
  }, [answers, warningCount, timeLeft, stopTimer, navigate, stopProctoring]);

  useEffect(() => {
    if (timeLeft === 0 && hasStarted) {
      submitTest('time_up');
    }
  }, [timeLeft, submitTest, hasStarted]);

  const handleTabSwitch = useCallback((count, max) => {
    if (!hasStarted) {
      console.log('[Tab Switch] Ignored - exam not started yet');
      return;
    }

    setWarningCount(count);
    setShowTabWarning(true);

    if (count >= max) {
      alert(`[FINAL WARNING] ${count}/${max}\n\nYou have exceeded the maximum number of tab switches!\n\nYour test will be submitted automatically now.`);
      setTimeout(() => {
        submitTest('tab_switch_violation');
      }, 100);
    } else {
      alert(`[WARNING] ${count}/${max}\n\nDo not switch tabs during the examination!\n\nPlease return to the test immediately.`);
      setTimeout(() => setShowTabWarning(false), 3000);
    }
  }, [submitTest, hasStarted]);

  useTabSwitch(handleTabSwitch, 3);

  const syncOfflineProgress = useCallback(async () => {
    const testId = localStorage.getItem('selectedTestId');
    if (!testId) return;
    const offlineKey = `offline_test_sync_${testId}`;
    const cachedData = localStorage.getItem(offlineKey);

    if (cachedData) {
      try {
        const payload = JSON.parse(cachedData);
        const token = localStorage.getItem('studentAuthToken');
        if (!token) return;

        console.log('🔄 Syncing offline progress to server...');
        const response = await apiFetch('api/student/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log('✅ Offline progress synced successfully');
          localStorage.removeItem(offlineKey);
        }
      } catch (err) {
        console.error('Error syncing offline progress:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineProgress();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineProgress]);

  const saveProgressNow = useCallback(async (isBackground = false) => {
    const token = localStorage.getItem('studentAuthToken');
    const testId = localStorage.getItem('selectedTestId');

    if (!token || !testId || questions.length === 0) return;

    try {
      const payload = {
        testId: parseInt(testId),
        answers: answers,
        currentQuestion: currentQuestion,
        markedForReview: Array.from(markedForReview),
        visitedQuestions: Array.from(visited),
        timeRemaining: timeLeft,
        warningCount: warningCount
      };

      const currentStateString = JSON.stringify(payload);
      if (isBackground && lastSavedStateRef.current === currentStateString) {
        return true;
      }

      lastSavedStateRef.current = currentStateString;

      if (!navigator.onLine) {
        console.log('📶 Offline: Saving progress locally');
        localStorage.setItem(`offline_test_sync_${testId}`, currentStateString);
        return true;
      }

      if (!isBackground) console.log('💾 Saving progress manually');

      const response = await apiFetch('api/student/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: currentStateString,
        skipGlobalErrorRedirect: true
      });

      if (response.ok) {
        if (!isBackground) console.log('✅ Progress saved');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save progress:', errorData);
        return false;
      }
    } catch (err) {
      console.error('Error saving progress:', err);
      return false;
    }
  }, [answers, currentQuestion, markedForReview, visited, timeLeft, warningCount, questions.length]);

  useEffect(() => {
    if (!hasStarted || totalQuestions === 0) return;

    const intervalId = setInterval(() => {
      saveProgressNow(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [hasStarted, totalQuestions, saveProgressNow]);

  useEffect(() => {
    const preventAction = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);
    document.addEventListener('paste', preventAction);

    const preventKeys = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventKeys);

    const fetchData = async () => {
      const token = localStorage.getItem('studentAuthToken');
      const testId = localStorage.getItem('selectedTestId');
      const applicationId = localStorage.getItem('currentApplicationId');

      if (!token || !testId) {
        navigate('/login');
        return;
      }

      try {
        const endpoint = applicationId
          ? `api/student/test/${testId}?applicationId=${applicationId}`
          : `api/student/test/${testId}`;

        const response = await apiFetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load test');
        }

        const data = await response.json();
        if (data.success && data.test && data.test.questions) {
          console.log('Test data received:', data.test);
          setQuestions(data.test.questions);
          setCodingQuestions(data.test.codingQuestions || []);

          setTestDetails({
            title: data.test.title || 'Assessment',
            duration: data.test.duration || 60,
            totalQuestions: data.test.questions.length + (data.test.codingQuestions?.length || 0)
          });

          const duration = data.test.duration || 60;

          if (data.savedProgress) {
            console.log('Loading saved progress:', data.savedProgress);
            setAnswers(data.savedProgress.answers || {});
            setCurrentQuestion(data.savedProgress.currentQuestion || 0);
            setMarkedForReview(new Set(data.savedProgress.markedForReview || []));
            setVisited(new Set(data.savedProgress.visitedQuestions || [0]));
            setWarningCount(data.savedProgress.warningCount || 0);

            // Set time remaining from saved progress (in seconds)
            if (data.savedProgress.timeRemaining) {
              setInitialTimeRemaining(data.savedProgress.timeRemaining);
            } else {
              setInitialTimeRemaining(duration * 60);
            }

            setHasStarted(true);

            const studentId = localStorage.getItem('studentId') || 'unknown';
            const studentName = localStorage.getItem('studentName') || 'Student';

            try {
              const proctoringResult = await startProctoring({
                studentId: studentId,
                studentName: studentName,
                testId: testId,
                testTitle: data.test.title,
                clientId: localStorage.getItem('clientId') || null,
              });

              if (proctoringResult.success) {
                console.log('[Proctoring] Successfully resumed');
              }
            } catch (proctoringErr) {
              console.error('[Proctoring] Error resuming proctoring:', proctoringErr);
            }

            try {
              await enterFullscreen();
              console.log('[Fullscreen] Fullscreen mode activated on resume');
            } catch (fullscreenErr) {
              console.error('[Fullscreen] Failed to resume fullscreen:', fullscreenErr);
            }
          } else {
            setInitialTimeRemaining(duration * 60);
            console.log('[TestScreen] No saved progress found - redirecting to instructions');
            navigate('/instructions', { replace: true });
            return;
          }
        } else {
          throw new Error('Invalid test data');
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError('Failed to load assessment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      stopProctoring();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const blockBackButton = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);

      const confirmExit = window.confirm(
        '⚠️ Warning: Going back will exit the exam!\n\n' +
        'Your progress will be saved, but you will need to resume the exam.\n\n' +
        'Are you sure you want to exit?'
      );

      if (confirmExit) {
        stopProctoring();
        navigate('/dashboard', { replace: true });
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackButton);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Proctoring] Page hidden');
      } else {
        console.log('[Proctoring] Page visible again');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    fetchData();

    return () => {
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
      document.removeEventListener('paste', preventAction);
      document.removeEventListener('keydown', preventKeys);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', blockBackButton);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopProctoring();
    };
  }, [navigate, stopProctoring]);

  const handleAnswerSelect = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionIndex
    }));
  };

  const handleNavigate = (index) => {
    setCurrentQuestion(index);
    setVisited(prev => new Set([...prev, index]));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      handleNavigate(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      handleNavigate(currentQuestion - 1);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  // Horizontal resize handler (left panel width)
  const handleHorizontalMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHorizontal(true);
  };

  useEffect(() => {
    const handleHorizontalMouseMove = (e) => {
      if (!isResizingHorizontal) return;

      const container = document.querySelector('.coding-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 20 && newWidth <= 50) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
    };

    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleHorizontalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleHorizontalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHorizontal]);

  // Vertical resize handler (console height)
  const handleVerticalMouseDown = (e) => {
    e.preventDefault();
    setIsResizingVertical(true);
  };

  useEffect(() => {
    const handleVerticalMouseMove = (e) => {
      if (!isResizingVertical) return;

      const container = document.querySelector('.code-editor-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      if (newHeight >= 100 && newHeight <= 500) {
        setConsolePanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingVertical(false);
    };

    if (isResizingVertical) {
      document.addEventListener('mousemove', handleVerticalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleVerticalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingVertical]);

  const getQuestionStatus = (index) => {
    const isAnswered = answers[index] !== undefined;
    const isMarked = markedForReview.has(index);

    if (isMarked) return 'review';
    if (isAnswered) return 'answered';
    if (visited.has(index)) return 'visited';
    return 'not-visited';
  };

  if (loading) {
    return (
      <div className="h-screen bg-shnoor-lavender flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
      </div>
    );
  }

  if (error || totalQuestions === 0) {
    return (
      <div className="h-screen bg-shnoor-lavender flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-shnoor-light">
          <AlertTriangle className="mx-auto h-12 w-12 text-shnoor-danger mb-4" />
          <h2 className="text-xl font-bold text-shnoor-navy mb-2">Error</h2>
          <p className="text-shnoor-indigoMedium">{error || 'No questions found for this test.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy text-white rounded-xl hover:from-shnoor-navy hover:to-shnoor-indigo transition-all duration-200 shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCodingQuestion = currentQuestion >= questions.length;
  const currentQ = isCodingQuestion
    ? codingQuestions[currentQuestion - questions.length]
    : questions[currentQuestion];

  return (
    <div className="h-screen bg-shnoor-lavender flex flex-col overflow-hidden">
      {/* Fullscreen Warning Modal */}
      {showWarning && (
        <FullscreenWarning onEnterFullscreen={enterFullscreen} />
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 w-full bg-shnoor-danger text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center space-x-2 z-50 shadow-md">
          <WifiOff size={16} />
          <span>You are currently offline. Your progress is being saved locally and will sync when you reconnect.</span>
        </div>
      )}

      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 right-4 z-50 bg-shnoor-danger text-white px-6 py-4 rounded-xl shadow-2xl animate-pulse border border-shnoor-danger">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} />
            <span className="font-bold">Warning {warningCount}/3: Tab Switch Detected!</span>
          </div>
        </div>
      )}

      {/* AI Violation Alert */}
      {currentAIViolation && (
        <AIViolationAlert
          violation={currentAIViolation}
          onDismiss={() => setCurrentAIViolation(null)}
        />
      )}

      {/* Proctor Message Alert */}
      {currentMessage && (
        <StudentMessageAlert
          message={currentMessage}
          isVisible={!!currentMessage}
          onDismiss={dismissCurrentMessage}
          autoHideDelay={10000}
        />
      )}

      {/* Top Bar Header */}
      <TestHeader
        title={testDetails?.title || 'Assessment'}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        formattedTime={formattedTime}
        editorTheme={editorTheme}
        onFinish={() => {
          saveProgressNow();
          setShowSubmitModal(true);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Question Palette (MCQ view) */}
        {!isCodingQuestion && (
          <ErrorBoundary>
            <QuestionPaletteSidebar
              questions={questions}
              codingQuestions={codingQuestions}
              currentQuestion={currentQuestion}
              getQuestionStatus={getQuestionStatus}
              handleNavigate={handleNavigate}
              answers={answers}
              markedForReview={markedForReview}
              totalQuestions={totalQuestions}
              proctoringMessages={proctoringMessages}
              isCollapsed={warningsSidebarCollapsed}
              onToggleCollapse={() => setWarningsSidebarCollapsed(prev => !prev)}
              isMobileVisible={true}
              className="order-2 lg:order-1 max-h-72 lg:max-h-none"
            />
          </ErrorBoundary>
        )}

        {/* Main Question Area - MCQ */}
        {!isCodingQuestion && (
          <McqQuestionView
            currentQ={currentQ}
            currentQuestion={currentQuestion}
            totalQuestions={totalQuestions}
            answers={answers}
            markedForReview={markedForReview}
            toggleMarkForReview={toggleMarkForReview}
            handleAnswerSelect={handleAnswerSelect}
            handlePrevious={handlePrevious}
            handleNext={handleNext}
            onSubmitTest={() => setShowSubmitModal(true)}
            saveProgressNow={saveProgressNow}
          />
        )}

        {/* Coding Question - Tabbed Layout */}
        {isCodingQuestion && (
          <div className="flex-1 flex flex-col bg-shnoor-lavender overflow-hidden coding-container relative">
            {/* Tab Switcher - Mobile Only */}
            <div className="flex lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0 shadow-md w-full justify-center">
              <div className="flex w-full max-w-4xl">
                {['questions', 'description', 'code'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodingTab(tab)}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
                      activeCodingTab === tab ? 'text-shnoor-indigo' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {tab === 'questions' ? (
                        <span>Palette</span>
                      ) : tab === 'description' ? (
                        <>
                          <span className="hidden sm:inline">Description</span>
                          <span className="sm:hidden">Desc</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-shnoor-success rounded-full animate-ping"></div>
                          </div>
                          <span className="hidden sm:inline">Code Editor</span>
                          <span className="sm:hidden">Editor</span>
                        </div>
                      )}
                    </div>
                    {activeCodingTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-shnoor-indigo shadow-[0_-2px_10px_rgba(79,70,229,0.3)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Panels Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
              {/* Column 1 - Question Palette */}
              <ErrorBoundary>
                <QuestionPaletteSidebar
                  questions={questions}
                  codingQuestions={codingQuestions}
                  currentQuestion={currentQuestion}
                  getQuestionStatus={getQuestionStatus}
                  handleNavigate={handleNavigate}
                  answers={answers}
                  markedForReview={markedForReview}
                  totalQuestions={totalQuestions}
                  proctoringMessages={proctoringMessages}
                  isCollapsed={warningsSidebarCollapsed}
                  onToggleCollapse={() => setWarningsSidebarCollapsed(prev => !prev)}
                  isMobileVisible={activeCodingTab === 'questions'}
                />
              </ErrorBoundary>

              {/* Column 2 - Problem Description (resizable) */}
              <ErrorBoundary>
                <CodingProblemView
                  currentQ={currentQ}
                  leftPanelWidth={leftPanelWidth}
                  isMobileVisible={activeCodingTab === 'description'}
                />
              </ErrorBoundary>

              {/* Horizontal Resizer */}
              <div
                className="hidden lg:block w-1 bg-shnoor-mist hover:bg-shnoor-indigo cursor-col-resize transition-colors flex-shrink-0"
                onMouseDown={handleHorizontalMouseDown}
              />

              {/* Column 3 - Code Editor + Console */}
              <CodingEditorPanel
                currentQ={currentQ}
                currentQuestion={currentQuestion}
                totalQuestions={totalQuestions}
                answers={answers}
                setAnswers={setAnswers}
                codingConsoleOutput={codingConsoleOutput}
                setCodingConsoleOutput={setCodingConsoleOutput}
                editorTheme={editorTheme}
                getStarterCode={getStarterCode}
                formatErrorForDisplay={formatErrorForDisplay}
                saveProgressNow={saveProgressNow}
                handlePrevious={handlePrevious}
                handleNext={handleNext}
                onSubmitTest={() => setShowSubmitModal(true)}
                handleVerticalMouseDown={handleVerticalMouseDown}
                consolePanelHeight={consolePanelHeight}
                bottomPanelTab={bottomPanelTab}
                setBottomPanelTab={setBottomPanelTab}
                isMobileVisible={activeCodingTab === 'code'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => {
          setShowSubmitModal(false);
          submitTest('manual');
        }}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        markedForReviewCount={markedForReviewCount}
        isSubmitting={isSubmitting}
      />

      {/* Force Termination Modal */}
      <TerminationModal
        isOpen={showTerminationModal && !!terminationData}
        terminationData={terminationData}
        onContinue={() => {
          setShowTerminationModal(false);
          submitTest('forced_termination');
        }}
      />
    </div>
  );
};

export default TestScreen;
