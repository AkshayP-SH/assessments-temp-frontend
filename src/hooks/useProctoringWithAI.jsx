import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAICheatingDetection } from './useAICheatingDetection';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FRAME_RATE = 2; // Reduced from 5 to lower CPU usage during active exam screens
const FRAME_INTERVAL = 1000 / FRAME_RATE;
const SOCKET_CONNECT_TIMEOUT_MS = 10000;

export const useProctoringWithAI = (onCameraLost, onAIViolation, onMessageReceived, onForceStop) => {
  const [stream, setStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [aiViolations, setAiViolations] = useState([]);
  
 const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const studentDataRef = useRef(null);
  const cameraCheckIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const silentGainRef = useRef(null);
  const audioChunkIntervalRef = useRef(null);
  const audioSampleBufferRef = useRef([]);
  const voiceAnalysisIntervalRef = useRef(null);
  const blurDetectionIntervalRef = useRef(null);
  const voiceActivityStartRef = useRef(null);
  const lastViolationTimeRef = useRef({});

  const encodeWavChunk = useCallback((sampleChunks, sampleRate) => {
    const totalLength = sampleChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (totalLength === 0) {
      return null;
    }

    const mergedSamples = new Float32Array(totalLength);
    let offset = 0;
    sampleChunks.forEach((chunk) => {
      mergedSamples.set(chunk, offset);
      offset += chunk.length;
    });

    const buffer = new ArrayBuffer(44 + mergedSamples.length * 2);
    const view = new DataView(buffer);

    const writeString = (viewRef, writeOffset, text) => {
      for (let index = 0; index < text.length; index += 1) {
        viewRef.setUint8(writeOffset + index, text.charCodeAt(index));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + mergedSamples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, mergedSamples.length * 2, true);

    let pcmOffset = 44;
    mergedSamples.forEach((sample) => {
      const normalizedSample = Math.max(-1, Math.min(1, sample));
      view.setInt16(pcmOffset, normalizedSample < 0 ? normalizedSample * 0x8000 : normalizedSample * 0x7fff, true);
      pcmOffset += 2;
    });

    return new Blob([view], { type: 'audio/wav' });
  }, []);

  // Centralized violation handler - sends to backend and notifies parent
  const sendViolation = useCallback((violation) => {
    // Add to violations list
    setAiViolations(prev => [...prev, {
      ...violation,
      timestamp: Date.now()
    }]);

    // Notify parent component
    if (onAIViolation) {
      onAIViolation(violation);
    }

    // Send violation to backend
    if (socketRef.current && socketRef.current.connected) {
      console.log('[Proctoring] 📤 Sending violation to backend:', {
        type: violation.type,
        severity: violation.severity,
        studentId: studentDataRef.current?.studentId,
        testId: studentDataRef.current?.testId
      });
      
      socketRef.current.emit('proctoring:ai-violation', {
        studentId: studentDataRef.current?.studentId,
        testId: studentDataRef.current?.testId,
        violation: violation,
        timestamp: Date.now()
      });
    } else {
      console.warn('[Proctoring] ⚠️ Cannot send violation - socket not connected');
    }
  }, [onAIViolation]);

  // Message handling functions
  const handleMessageReceived = useCallback((messageData) => {
    console.log('[Messaging] 📩 Received message from proctor:', messageData);
    
    // Add to messages list
    setMessages(prev => [...prev, messageData]);
    
    // Set as current message for alert display
    setCurrentMessage(messageData);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    // Call parent handler if provided
    if (onMessageReceived) {
      onMessageReceived(messageData);
    }

    // Auto-acknowledge message after 3 seconds
    setTimeout(() => {
      acknowledgeMessage(messageData.id);
    }, 3000);
  }, [onMessageReceived]);

  const acknowledgeMessage = useCallback((messageId) => {
    if (socketRef.current && socketRef.current.connected && studentDataRef.current) {
      console.log('[Messaging] ✅ Acknowledging message:', messageId);
      
      socketRef.current.emit('student:message-read', {
        messageId: messageId,
        studentId: studentDataRef.current.studentId
      });
    }
  }, []);

  const dismissCurrentMessage = useCallback(() => {
    setCurrentMessage(null);
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // AI Detection hook
  const {
    isModelLoaded,
    detectionActive,
    violations,
    startDetection,
    stopDetection
  } = useAICheatingDetection(sendViolation);

  // Blur detection function
  const detectBlur = useCallback((canvas, ctx) => {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate Laplacian variance for blur detection
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += gray;
        count++;
      }
      
      const mean = sum / count;
      let variance = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        variance += Math.pow(gray - mean, 2);
      }
      
      variance /= count;
      
      // Threshold for blur detection (lower values indicate more blur)
      const blurThreshold = 100;
      
      if (variance < blurThreshold) {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current['video_blur'] || 0;
        
        // Only report if cooldown has passed (10 seconds)
        if ((now - lastTime) >= 10000) {
          lastViolationTimeRef.current['video_blur'] = now;
          console.log(`[Blur Detection] ⚠️ BLUR DETECTED: variance ${variance.toFixed(2)}`);
          
          const violation = {
            type: 'video_blur',
            severity: 'medium',
            message: 'Video feed appears blurred - Please ensure camera is clean and focused',
            blurValue: variance
          };
          
          sendViolation(violation);
          return true;
        } else {
          const timeLeft = Math.ceil((10000 - (now - lastTime)) / 1000);
          console.log(`[Blur Detection] Blur detected but cooldown active (${timeLeft}s remaining)`);
        }
      }
      
      return false;
    } catch (error) {
      console.error('[Blur Detection] Error:', error);
      return false;
    }
  }, [sendViolation]);

  // Voice anomaly detection with Web Audio API
  const analyzeAudio = useCallback((audioContext, analyser) => {
    try {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Calculate voice frequency energy (85-255 Hz range for human voice)
      const sampleRate = audioContext.sampleRate;
      const binSize = sampleRate / analyser.fftSize;
      const voiceStartBin = Math.floor(85 / binSize);
      const voiceEndBin = Math.floor(255 / binSize);
      const voiceFrequencies = dataArray.slice(voiceStartBin, voiceEndBin);
      const voiceEnergy = voiceFrequencies.reduce((a, b) => a + b) / voiceFrequencies.length;
      
      // Detect loud noise (sudden spike)
      const LOUD_THRESHOLD = 80;
      if (average > LOUD_THRESHOLD) {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current['loud_noise'] || 0;
        
        if ((now - lastTime) >= 10000) { // 10 second cooldown
          lastViolationTimeRef.current['loud_noise'] = now;
          console.log(`[Audio] ⚠️ LOUD NOISE: ${Math.round(average)}`);
          
          const violation = {
            type: 'loud_noise',
            severity: 'medium',
            message: `Loud noise detected (${Math.round(average)} dB) - Maintain quiet environment`,
            volume: average
          };
          
          sendViolation(violation);
        }
      }
      
      // Detect voice activity
      const VOICE_THRESHOLD = 40;
      if (voiceEnergy > VOICE_THRESHOLD) {
        const now = Date.now();
        
        // Track continuous voice activity
        if (!voiceActivityStartRef.current) {
          voiceActivityStartRef.current = now;
        }
        
        const voiceDuration = now - voiceActivityStartRef.current;
        
        // If voice detected for more than 3 seconds, flag as potential conversation
        if (voiceDuration > 3000) {
          const lastTime = lastViolationTimeRef.current['voice_detected'] || 0;
          
          if ((now - lastTime) >= 15000) { // 15 second cooldown
            lastViolationTimeRef.current['voice_detected'] = now;
            console.log(`[Audio] ⚠️ VOICE ACTIVITY: ${Math.round(voiceEnergy)}`);
            
            const violation = {
              type: 'voice_detected',
              severity: 'medium',
              message: 'Voice activity detected - Maintain silence during exam',
              voiceEnergy: voiceEnergy,
              duration: voiceDuration
            };
            
            sendViolation(violation);
          }
        }
      } else {
        // Reset voice activity timer when no voice
        voiceActivityStartRef.current = null;
      }
      
      // Note: Silent microphone is NOT a violation - students should be quiet during exams
      
    } catch (error) {
      console.error('[Audio Analysis] Error:', error);
    }
  }, [sendViolation]);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      // Request video and audio permissions
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });
      
      setStream(videoStream);
      setPermissionGranted(true);
      
      // Check if microphone is available - MANDATORY
      const audioTracks = videoStream.getAudioTracks();
      if (audioTracks.length > 0) {
        setMicrophonePermissionGranted(true);
        console.log('[Proctoring] Camera and microphone permissions granted');
      } else {
        setMicrophonePermissionGranted(false);
        console.error('[Proctoring] Microphone not available - MANDATORY');
        setError('Microphone access is mandatory. Please allow microphone permissions to continue.');
        throw new Error('Microphone access denied or not available');
      }
      
      setError(null);
      return videoStream;
    } catch (err) {
      console.error('Error accessing camera/microphone:', err);
      
      // Check if it's specifically a microphone issue
      if (err.message && err.message.includes('Microphone')) {
        setError('Microphone access is mandatory. Please allow microphone permissions to continue.');
      } else {
        setError('Camera and microphone access required. Please allow permissions to continue.');
      }
      
      setPermissionGranted(false);
      throw err;
    }
  };

  // Initialize Socket.io connection
  const connectSocket = (studentData) => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // Pass student JWT in handshake so server can verify identity
    const studentToken = localStorage.getItem('studentAuthToken');

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
      timeout: 10000,
      forceNew: true,
      auth: { token: studentToken },
    });

    socket.on('connect', () => {
      console.log('[Proctoring] Socket connected');
      setIsConnected(true);
      setError(null);
      socket.emit('student:join-proctoring', studentData);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Proctoring] Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setError('Server disconnected you. Please refresh the page.');
      } else if (reason === 'transport close') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Proctoring] Connection error (backend may not be running):', err.message);
      setError('Proctoring server unavailable. Continuing without live monitoring.');
      setIsConnected(false);
    });

    socket.on('reconnect_failed', () => {
      console.warn('[Proctoring] Reconnection failed after max attempts');
      setError('Unable to connect to proctoring server. Continuing without live monitoring.');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Proctoring] Reconnected after', attemptNumber, 'attempts');
      setError(null);
      socket.emit('student:join-proctoring', studentData);
    });
    
    // Handle incoming messages from proctor
    socket.on('proctoring:message-received', handleMessageReceived); 
    // Handle forced test stop from admin
    socket.on('proctoring:force-stopped', (data) => {
      console.log('[Proctoring] 🛑 Test force-stopped by admin:', data);
      
      // Call parent handler to trigger test submission
      if (onForceStop) {
        onForceStop(data);
      }
    });
    
    socketRef.current = socket;
    return socket;
  };

  // Capture and send video frames
  const startFrameCapture = (mediaStream, socket, studentData) => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    videoRef.current.srcObject = mediaStream;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });

    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play().then(async () => {
        console.log('[Proctoring] Video playing, waiting for stabilization...');
        
        // Wait longer for video to stabilize (increased from 1s to 3s)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('[Proctoring] Starting AI detection...');
        
        // Try to start AI detection with better error handling
        const started = await startDetection(videoRef.current);
        
        if (started) {
          console.log('[Proctoring] ✅ AI detection started successfully');
        } else {
          console.warn('[Proctoring] ⚠️ AI detection failed to start, retrying in 5s...');
          // Retry after 5 seconds
          setTimeout(async () => {
            const retryStarted = await startDetection(videoRef.current);
            if (retryStarted) {
              console.log('[Proctoring] ✅ AI detection started on retry');
            } else {
              console.error('[Proctoring] ❌ AI detection failed on retry');
            }
          }, 5000);
        }
        
        // Start audio analysis
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          console.log('[Proctoring] Starting audio analysis...');
          
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(mediaStream);
            
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            microphone.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            
            // Analyze audio every 2 seconds to reduce main-thread pressure
            voiceAnalysisIntervalRef.current = setInterval(() => {
              if (audioContextRef.current && analyserRef.current) {
                analyzeAudio(audioContextRef.current, analyserRef.current);
              }
            }, 2000);
            
            console.log('[Proctoring] ✅ Audio analysis started');

            // Stream audio chunks for admin live listening using WAV chunks for broad playback support.
            try {
              const processor = audioContext.createScriptProcessor(4096, 1, 1);
              const silentGain = audioContext.createGain();
              silentGain.gain.value = 0;

              audioSampleBufferRef.current = [];
              processor.onaudioprocess = (event) => {
                const inputSamples = event.inputBuffer.getChannelData(0);
                audioSampleBufferRef.current.push(new Float32Array(inputSamples));
              };

              microphone.connect(processor);
              processor.connect(silentGain);
              silentGain.connect(audioContext.destination);

              audioProcessorRef.current = processor;
              silentGainRef.current = silentGain;

              audioChunkIntervalRef.current = setInterval(() => {
                if (!socket.connected || audioSampleBufferRef.current.length === 0) {
                  return;
                }

                const wavBlob = encodeWavChunk(audioSampleBufferRef.current, audioContext.sampleRate);
                audioSampleBufferRef.current = [];

                if (!wavBlob) {
                  return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                  if (!socket.connected || !reader.result) {
                    return;
                  }

                  socket.emit('proctoring:audio', {
                    studentId: studentData.studentId,
                    studentName: studentData.studentName,
                    testId: studentData.testId,
                    testTitle: studentData.testTitle,
                    audioDataUrl: reader.result,
                    timestamp: Date.now()
                  });
                };
                reader.readAsDataURL(wavBlob);
              }, 2000);

              console.log('[Proctoring] ✅ WAV audio chunk streaming started');
            } catch (audioStreamErr) {
              console.error('[Proctoring] Audio chunk streaming setup failed:', audioStreamErr);
            }
          } catch (audioErr) {
            console.error('[Proctoring] Audio analysis setup failed:', audioErr);
          }
        } else {
          console.warn('[Proctoring] No audio tracks available for analysis');
        }
        
        // Start blur detection
        blurDetectionIntervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            detectBlur(canvasRef.current, ctx);
          }
        }, 8000); // Check blur less frequently to reduce main-thread pressure
        
        // Capture and send frames
        frameIntervalRef.current = setInterval(() => {
          if (socket.connected && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              ctx.drawImage(videoRef.current, 0, 0, 640, 480);
              const frameData = canvasRef.current.toDataURL('image/jpeg', 0.6);
              
              socket.emit('proctoring:frame', {
                studentId: studentData.studentId,
                studentName: studentData.studentName,
                testId: studentData.testId,
                testTitle: studentData.testTitle,
                frame: frameData,
                timestamp: Date.now(),
                aiViolations: violations, // Include AI violation counts
                microphoneEnabled: microphonePermissionGranted // Audio enabled
              });
            } catch (err) {
              console.error('[Proctoring] Error capturing frame:', err);
            }
          }
        }, FRAME_INTERVAL);
      }).catch(err => {
        console.error('[Proctoring] Error playing video:', err);
      });
    };
  };

  // Start proctoring with AI
  const startProctoring = async (studentData) => {
    try {
      studentDataRef.current = studentData;
      
      const mediaStream = await requestPermissions();
      const socket = connectSocket(studentData);
      
      await new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(connectTimeout);
          socket.off('connect', handleConnect);
          socket.off('connect_error', handleConnectError);
          socket.off('reconnect_failed', handleReconnectFailed);
        };

        const handleConnect = () => {
          cleanup();
          resolve();
        };

        const handleConnectError = (err) => {
          cleanup();
          reject(err || new Error('Failed to connect to proctoring server'));
        };

        const handleReconnectFailed = () => {
          cleanup();
          reject(new Error('Failed to reconnect to proctoring server'));
        };

        const connectTimeout = setTimeout(() => {
          cleanup();
          reject(new Error('Timed out connecting to proctoring server'));
        }, SOCKET_CONNECT_TIMEOUT_MS);

        if (socket.connected) {
          cleanup();
          resolve();
        } else {
          socket.once('connect', handleConnect);
          socket.once('connect_error', handleConnectError);
          socket.once('reconnect_failed', handleReconnectFailed);
        }
      });
      
      startFrameCapture(mediaStream, socket, studentData);
      
      // Monitor camera and microphone status
      cameraCheckIntervalRef.current = setInterval(() => {
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length === 0 || !videoTracks[0].enabled || videoTracks[0].readyState === 'ended') {
          console.error('[Proctoring] Camera lost or disabled!');
          if (onCameraLost) {
            onCameraLost('Camera was disabled or disconnected. Exam terminated.');
          }
          stopProctoring();
        }
        
        // Check microphone status
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          if (!audioTracks[0].enabled || audioTracks[0].readyState === 'ended') {
            console.error('[Proctoring] Microphone lost or disabled!');
            if (onCameraLost) {
              onCameraLost('Microphone was disabled or disconnected. Exam terminated.');
            }
            stopProctoring();
          }
        }
      }, 2000);
      
      return { success: true };
    } catch (err) {
      console.error('[Proctoring] Start error:', err);
      const normalizedMessage = err?.message || 'Failed to start proctoring';
      setError(normalizedMessage);
      stopProctoring();
      return { success: false, error: normalizedMessage };
    }
  };

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    // Stop AI detection
    stopDetection();
    
    // Clear all intervals
    if (cameraCheckIntervalRef.current) {
      clearInterval(cameraCheckIntervalRef.current);
      cameraCheckIntervalRef.current = null;
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (voiceAnalysisIntervalRef.current) {
      clearInterval(voiceAnalysisIntervalRef.current);
      voiceAnalysisIntervalRef.current = null;
    }

    if (audioChunkIntervalRef.current) {
      clearInterval(audioChunkIntervalRef.current);
      audioChunkIntervalRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current.onaudioprocess = null;
      audioProcessorRef.current = null;
    }

    if (silentGainRef.current) {
      silentGainRef.current.disconnect();
      silentGainRef.current = null;
    }

    audioSampleBufferRef.current = [];
    
    if (blurDetectionIntervalRef.current) {
      clearInterval(blurDetectionIntervalRef.current);
      blurDetectionIntervalRef.current = null;
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Stop audio stream
    if (audioStream) {
      const audioTracks = audioStream.getTracks();
      audioTracks.forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('student:leave-proctoring', studentDataRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStream(null);
    setIsConnected(false);
    setPermissionGranted(false);
    setMicrophonePermissionGranted(false);
  }, [stopDetection, audioStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, [stopProctoring]);

  return {
    stream,
    isConnected,
    error,
    permissionGranted,
    microphonePermissionGranted,
    isModelLoaded,
    detectionActive,
    violations,
    aiViolations,
    startProctoring,
    stopProctoring,
    // Messaging functionality
    messages,
    currentMessage,
    unreadCount,
    dismissCurrentMessage,
    markAllAsRead,
    acknowledgeMessage,
  };
};

