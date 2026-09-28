import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, Wifi, WifiOff, Camera, Clock, MessageCircle, StopCircle, AlertTriangle, Mic, MicOff } from 'lucide-react';
import AdminChatModal from '../../components/admin/AdminChatModal';
import { API_URL } from '../../config/api';

const SOCKET_URL = API_URL;

const LiveProctoring = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [frameData, setFrameData] = useState(new Map()); // studentId -> frame base64
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [isStoppingTest, setIsStoppingTest] = useState(false);
  const [enabledMicStudents, setEnabledMicStudents] = useState(new Set());
  const socketRef = useRef(null);
  const enabledMicStudentsRef = useRef(new Set());
  const audioElementsRef = useRef(new Map());
  const audioQueuesRef = useRef(new Map());
  const audioPlayingRef = useRef(new Map());

  const playNextAudioChunk = (studentId) => {
    if (!enabledMicStudentsRef.current.has(studentId)) {
      return;
    }

    if (audioPlayingRef.current.get(studentId)) {
      return;
    }

    const queue = audioQueuesRef.current.get(studentId) || [];
    if (queue.length === 0) {
      return;
    }

    const nextChunk = queue.shift();
    audioQueuesRef.current.set(studentId, queue);

    let audioEl = audioElementsRef.current.get(studentId);
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = 'none';
      audioElementsRef.current.set(studentId, audioEl);
    }

    audioPlayingRef.current.set(studentId, true);

    const finishPlayback = () => {
      audioPlayingRef.current.set(studentId, false);
      playNextAudioChunk(studentId);
    };

    audioEl.onended = finishPlayback;
    audioEl.onerror = finishPlayback;
    audioEl.src = nextChunk;
    audioEl.play().catch(() => {
      audioPlayingRef.current.set(studentId, false);
    });
  };

  const stopStudentAudio = (studentId) => {
    const audioEl = audioElementsRef.current.get(studentId);
    if (audioEl) {
      audioEl.pause();
      audioEl.src = '';
      audioEl.onended = null;
      audioEl.onerror = null;
    }
    audioQueuesRef.current.delete(studentId);
    audioPlayingRef.current.set(studentId, false);
  };

  const toggleStudentMic = (studentId) => {
    setEnabledMicStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
        stopStudentAudio(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  useEffect(() => {
    enabledMicStudentsRef.current = enabledMicStudents;
  }, [enabledMicStudents]);


  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    console.log('[Admin] Initializing Socket.IO connection to:', SOCKET_URL);

    // Pass JWT in socket handshake so the server can verify identity and scope the room
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 30000,
      forceNew: true,
      autoConnect: true,
      auth: { token },
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Admin] Connected to proctoring server');
      console.log('[Admin] Socket ID:', socket.id);
      console.log('[Admin] Transport:', socket.io.engine.transport.name);
      setIsConnected(true);

      // Join monitoring room — server verifies JWT from handshake auth
      socket.emit('admin:join-monitoring');
      console.log('[Admin] Sent admin:join-monitoring event');
    });

    // Server rejected the join (bad/expired token)
    socket.on('admin:monitoring-joined', (data) => {
      if (!data.success) {
        console.error('[Admin] Monitoring join rejected:', data.error);
        navigate('/login');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Admin] Connection error:', error);
      console.error('[Admin] Error message:', error.message);
      console.error('[Admin] Error type:', error.type);
      console.error('[Admin] Error description:', error.description);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Admin] Disconnected from proctoring server. Reason:', reason);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Admin] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Admin] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Admin] Reconnection failed after all attempts');
      setIsConnected(false);
    });

    // Receive active sessions list
    socket.on('active-sessions', (sessions) => {
      console.log('[Admin] Active sessions:', sessions);
      // Ensure all studentIds are strings for consistent key matching
      const normalizedSessions = sessions.map(s => ({
        ...s,
        studentId: String(s.studentId)
      }));
      setActiveSessions(normalizedSessions);
    });

    // New student joined
    socket.on('student:joined', (studentData) => {
      console.log('[Admin] Student joined:', studentData);
      // Ensure studentId is a string for consistent key matching
      const normalizedData = {
        ...studentData,
        studentId: String(studentData.studentId)
      };
      setActiveSessions(prev => [...prev, normalizedData]);
    });

    // Student left
    socket.on('student:left', (data) => {
      console.log('[Admin] Student left:', data);
      const leftStudentId = String(data.studentId);
      setActiveSessions(prev => prev.filter(s => String(s.studentId) !== leftStudentId));

      // Remove frame data
      setFrameData(prev => {
        const newMap = new Map(prev);
        newMap.delete(leftStudentId);
        return newMap;
      });

      setEnabledMicStudents(prev => {
        const next = new Set(prev);
        next.delete(leftStudentId);
        return next;
      });
      stopStudentAudio(leftStudentId);
    });

    // Receive video frames from students
    socket.on('proctoring:frame', (data) => {
      const { studentId, frame } = data;

      // Update frame data for this student
      setFrameData(prev => {
        const newMap = new Map(prev);
        // Ensure studentId is a string for consistent key matching
        newMap.set(String(studentId), frame);
        return newMap;
      });
    });

    // Receive audio chunks from students and play only for explicitly enabled student cards
    socket.on('proctoring:audio', (data) => {
      const studentId = String(data.studentId);

      if (!enabledMicStudentsRef.current.has(studentId)) {
        return;
      }

      const queue = audioQueuesRef.current.get(studentId) || [];
      queue.push(data.audioDataUrl);

      // Keep queue size reasonable to balance responsiveness vs stability
      if (queue.length > 5) {
        queue.shift();
      }

      audioQueuesRef.current.set(studentId, queue);
      playNextAudioChunk(studentId);
    });

    // Handle force-stop success
    socket.on('admin:force-stop-success', (data) => {
      console.log('[Admin] Force-stop successful:', data);
      alert(`✅ Test successfully terminated for ${data.studentName}\n\nThe student has been notified.`);
      setIsStopModalOpen(false);
      setStopReason('');
      setSelectedStudent(null);
      setIsStoppingTest(false);
    });

    // Handle force-stop failure
    socket.on('admin:force-stop-failed', (data) => {
      console.error('[Admin] Force-stop failed:', data);
      alert(`❌ Failed to stop test: ${data.error}`);
      setIsStoppingTest(false);
    });

    // Handle notification when another admin stops a test
    socket.on('admin:test-forcibly-stopped', (data) => {
      console.log('[Admin] Test stopped by another admin:', data);
      // Could show a toast notification here
    });

    socketRef.current = socket;

    // Cleanup
    return () => {
      audioElementsRef.current.forEach((audioEl) => {
        audioEl.pause();
        audioEl.src = '';
      });
      audioElementsRef.current.clear();
      audioQueuesRef.current.clear();
      audioPlayingRef.current.clear();
      socket.disconnect();
    };
  }, [navigate]);

  const formatDuration = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / 1000 / 60); // minutes
    return `${diff} min`;
  };

  const handleOpenChat = (student) => {
    setSelectedStudent(student);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedStudent(null);
  };

  const handleMessageSent = () => {
    // Optional: Add any additional handling when a message is sent
    console.log('[Admin] Message sent to student');
  };

  const handleOpenStopModal = (student) => {
    setSelectedStudent(student);
    setIsStopModalOpen(true);
    setStopReason('');
  };

  const handleCloseStopModal = () => {
    if (!isStoppingTest) {
      setIsStopModalOpen(false);
      setStopReason('');
      setSelectedStudent(null);
    }
  };

  const handleStopTest = () => {
    if (!stopReason.trim()) {
      alert('Please provide a reason for stopping the test');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      alert('Not connected to server. Please refresh the page.');
      return;
    }

    setIsStoppingTest(true);

    const adminToken = localStorage.getItem('adminToken');
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

    console.log('[Admin] Sending force-stop request:', {
      studentId: selectedStudent.studentId,
      testId: selectedStudent.testId,
      reason: stopReason
    });

    socketRef.current.emit('admin:force-stop-test', {
      studentId: selectedStudent.studentId,
      testId: selectedStudent.testId,
      reason: stopReason.trim(),
      adminId: adminData.id || 'admin',
      adminName: adminData.full_name || adminData.email || 'Admin',
      violationSummary: `Test stopped during live proctoring session. Duration: ${formatDuration(selectedStudent.startTime)}`
    });
  };

  return (
    <div className="min-h-screen bg-[#E0E0EF] dark:bg-[#11111d]">
      {/* Header */}
      <header className="bg-transparent pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2 h-10 px-4 border border-[#D1D1E6] dark:border-gray-700 bg-transparent text-[#9A9AC9] dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-white dark:hover:bg-[#1a1a2e] hover:border-gray-300 dark:hover:border-gray-500 transition-colors flex-shrink-0"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Proctoring</h1>
                <p className="text-sm text-[#9A9AC9] mt-0.5">Monitor students in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 h-10 px-4 rounded-xl shadow-sm ${isConnected ? 'bg-[#dcfce7] dark:bg-green-900/30 text-[#166534] dark:text-green-400' : 'bg-[#fee2e2] dark:bg-red-900/30 text-[#991b1b] dark:text-red-400'}`}>
                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-sm font-bold">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-[#1a1a2e] text-[#403f75] dark:text-gray-300 rounded-xl shadow-sm border border-[#D1D1E6] dark:border-gray-700">
                <Users size={16} />
                <span className="text-sm font-bold">{activeSessions.length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSessions.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-sm p-16 text-center mt-2 border dark:border-transparent">
            <Camera size={64} className="mx-auto text-[#9A9AC9] dark:text-gray-500 mb-6 opacity-60" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Active Sessions</h2>
            <p className="text-[#9A9AC9] dark:text-gray-400 text-base font-medium">
              Students taking exams with proctoring enabled will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session) => {
              // Ensure consistent string key for lookup
              const sessionKey = String(session.studentId);
              const currentFrame = frameData.get(sessionKey);

              return (
                <div
                  key={sessionKey}
                  className="bg-white rounded-xl shadow-sm border border-shnoor-light overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Video Feed */}
                  <div className="relative bg-shnoor-navyLight aspect-video">
                    {currentFrame ? (
                      <img
                        src={currentFrame}
                        alt={`${session.studentName} proctoring feed`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-shnoor-lavender">
                        <div className="text-center">
                          <Camera size={48} className="mx-auto text-shnoor-light mb-2" />
                          <p className="text-shnoor-soft text-sm">Waiting for video...</p>
                        </div>
                      </div>
                    )}

                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1 bg-shnoor-danger text-white px-2 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>

                    {/* Duration */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Clock size={12} />
                      <span>{formatDuration(session.startTime)}</span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-shnoor-navy text-lg mb-1">
                      {session.studentName}
                    </h3>
                    <p className="text-sm text-shnoor-indigoMedium mb-3">
                      ID: {session.studentId}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-shnoor-light">
                      <div>
                        <p className="text-xs text-shnoor-soft">Test</p>
                        <p className="text-sm font-semibold text-shnoor-navy">
                          {session.testTitle}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-shnoor-success">
                        <Wifi size={16} />
                        <span className="text-xs font-medium">
                          {currentFrame ? 'Streaming' : 'Connected'}
                        </span>
                      </div>
                    </div>

                    {/* Chat Button */}
                    <div className="mt-4 pt-3 border-t border-shnoor-light">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStudentMic(sessionKey)}
                          className={`px-3 py-2 rounded-lg border transition-colors ${enabledMicStudents.has(sessionKey)
                            ? 'bg-shnoor-success text-white border-shnoor-success'
                            : 'bg-white text-shnoor-indigoMedium border-shnoor-light hover:bg-shnoor-lavender'
                            }`}
                          title={enabledMicStudents.has(sessionKey) ? 'Turn off mic listening' : 'Turn on mic listening'}
                        >
                          {enabledMicStudents.has(sessionKey) ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenChat(session)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-shnoor-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                          <MessageCircle size={16} />
                          <span className="text-sm font-medium">Send Message</span>
                        </button>
                      </div>
                    </div>

                    {/* Stop Test Button */}
                    <div className="mt-3">
                      <button
                        onClick={() => handleOpenStopModal(session)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <StopCircle size={16} />
                        <span className="text-sm font-medium">Stop Test</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Chat Modal */}
      {selectedStudent && (
        <AdminChatModal
          isOpen={isChatModalOpen}
          onClose={handleCloseChat}
          student={selectedStudent}
          socket={socketRef.current}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* Stop Test Confirmation Modal */}
      {isStopModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold">Stop Test - Confirmation Required</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-shnoor-navy font-semibold mb-2">Student Information:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Name:</span> {selectedStudent.studentName}</p>
                  <p className="text-sm"><span className="font-medium">ID:</span> {selectedStudent.studentId}</p>
                  <p className="text-sm"><span className="font-medium">Test:</span> {selectedStudent.testTitle}</p>
                </div>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800 font-medium">⚠️ Warning:</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will immediately terminate the student's exam and submit their current answers. The student will receive a notification that their test was stopped due to policy violations.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-shnoor-navy mb-2">
                  Reason for Termination <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="e.g., Multiple instances of unauthorized devices detected, suspicious behavior observed..."
                  rows={4}
                  disabled={isStoppingTest}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be logged for audit purposes and may be shared with the student.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={handleCloseStopModal}
                disabled={isStoppingTest}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleStopTest}
                disabled={isStoppingTest || !stopReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isStoppingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <StopCircle size={16} />
                    <span>Stop Test Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveProctoring;

