import { useCallback } from 'react';
import { apiFetch } from '../config/api';

/**
 * Hook to handle test submission logic
 */
export const useTestSubmission = ({
  answers,
  warningCount,
  timeLeft,
  stopTimer,
  stopProctoring,
  setTerminationData,
  setShowTerminationModal
}) => {
  const submitTest = useCallback(async (reason = 'manual') => {
    // Stop timers immediately
    if (stopTimer) stopTimer();
    
    // IMPORTANT: Stop proctoring immediately when test ends
    if (stopProctoring) stopProctoring();

    const testId = localStorage.getItem('selectedTestId');
    const applicationId = localStorage.getItem('currentApplicationId');
    const studentId = localStorage.getItem('studentId');
    const token = localStorage.getItem('studentAuthToken');

    console.log('=== SUBMITTING TEST ===');
    console.log('Test ID:', testId);
    console.log('Student ID:', studentId);
    console.log('Reason:', reason);
    console.log('Proctoring stopped');

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

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

      if (data.success) {
        localStorage.setItem('lastTestId', testId);
        
        // Use setTerminationData if provided, otherwise the caller handles routing
        if (setTerminationData && setShowTerminationModal) {
          setTerminationData(data);
          setShowTerminationModal(true);
        }
        return { success: true, data };
      } else {
        alert(data.message || 'Failed to submit exam');
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('An error occurred while submitting. Please try again.');
      return { success: false, error };
    }
  }, [answers, warningCount, timeLeft, stopTimer, stopProctoring, setTerminationData, setShowTerminationModal]);

  return { submitTest };
};
