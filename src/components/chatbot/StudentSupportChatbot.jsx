import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, ChevronLeft, Send, Upload, Image, AlertCircle, Check, RefreshCw, Bell } from 'lucide-react';
import { CHATBOT_TOPICS, CHATBOT_QA, TOPIC_ICONS } from '../../data/chatbotData';
import { apiFetch } from '../../config/api';
import { useSupportSocket } from '../../hooks/useSupportSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const StudentSupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [feedbackState, setFeedbackState] = useState({
    active: false,
    step: null,
    data: {
      rating: null,
      helpful: null,
      responseTime: null,
      comments: null
    }
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const processedNotificationsRef = useRef(new Set());
  const currentViewRef = useRef(currentView);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const studentName = localStorage.getItem('studentName') || 'Student';
  const studentEmail = localStorage.getItem('studentEmail') || '';
  const studentId = localStorage.getItem('rollNumber') || '';
  const institute = localStorage.getItem('institute') || '';

  const {
    notifications,
    markAllRead: socketMarkAllRead,
    notificationPermission,
    requestPermission,
    getSocket
  } = useSupportSocket({
    isAdmin: false,
    rollNumber: studentId,
    studentName,
    enabled: !!studentId,
    enableBrowserNotifications: true
  });

  // Mark messages as read when opening contact view
  const markMessagesAsRead = useCallback(async () => {
    if (!studentId) return;

    try {
      const token = localStorage.getItem('studentAuthToken');
      await apiFetch('api/student-messages/mark-student-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUnreadCount(0);
      socketMarkAllRead();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [studentId, socketMarkAllRead]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAdminReply = (data) => {
      setConversationHistory(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, {
          id: data.id,
          message: data.messagePreview,
          sender_type: 'admin',
          created_at: data.createdAt,
          image_path: data.imagePath || null
        }];
      });

      if (isOpenRef.current && currentViewRef.current === 'contact') {
        markMessagesAsRead();
      } else {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleStudentMessageEcho = (data) => {
      if (data.studentId === studentId) {
        setConversationHistory(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            message: data.messagePreview,
            sender_type: 'student',
            created_at: data.createdAt,
            image_path: data.imagePath || null
          }];
        });
      }
    };

    const handleConversationClosed = (data) => {
      if (data.requestFeedback && data.studentId === studentId) {
        setFeedbackState({
          active: true,
          step: 'rating',
          data: { rating: null, helpful: null, responseTime: null, comments: null }
        });

        setTimeout(() => {
          setConversationHistory(prev => {
            const newMessages = [...prev, {
              id: `feedback-start-${Date.now()}`,
              message: "Thank you for contacting support! 🎉\n\nYour conversation has been closed. We'd love to hear your feedback to help us improve our service.\n\nLet's start with a simple question:",
              sender_type: 'system',
              created_at: new Date().toISOString(),
              image_path: null
            }, {
              id: `feedback-q1-${Date.now()}`,
              message: "How would you rate your support experience?\n\nReply with:\n⭐ 1 - Poor\n⭐⭐ 2 - Fair\n⭐⭐⭐ 3 - Good\n⭐⭐⭐⭐ 4 - Very Good\n⭐⭐⭐⭐⭐ 5 - Excellent",
              sender_type: 'system',
              created_at: new Date().toISOString(),
              image_path: null,
              feedbackStep: 'rating'
            }];
            return newMessages;
          });
        }, 500);
      }
    };

    socket.on('support:new-admin-reply', handleAdminReply);
    socket.on('support:student-message-echo', handleStudentMessageEcho);
    socket.on('support:conversation-closed', handleConversationClosed);

    return () => {
      socket.off('support:new-admin-reply', handleAdminReply);
      socket.off('support:student-message-echo', handleStudentMessageEcho);
      socket.off('support:conversation-closed', handleConversationClosed);
    };
  }, [getSocket, markMessagesAsRead, studentId]);

  useEffect(() => {
    if (notificationPermission === 'default') {
      const handleClick = () => {
        requestPermission();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick, { once: true });
    }
  }, [notificationPermission, requestPermission]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!studentId) return;
      try {
        const token = localStorage.getItem('studentAuthToken');
        const response = await apiFetch('api/student-messages/student-unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) return;
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.count);
          }
        }
      } catch (error) {
        if (!error.message?.includes('401')) console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [studentId]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const notificationId = latestNotification.id;
      if (!latestNotification.read && !processedNotificationsRef.current.has(notificationId)) {
        processedNotificationsRef.current.add(notificationId);
        setToastMessage(latestNotification);
        setShowToastNotification(true);
        const timer = setTimeout(() => {
          setShowToastNotification(false);
          setToastMessage(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, conversationHistory]);

  useEffect(() => {
    if (sendStatus) {
      const timer = setTimeout(() => setSendStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  const fetchConversationHistory = useCallback(async () => {
    if (!studentId) return;

    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('studentAuthToken');
      const response = await apiFetch(`api/student-messages/conversation`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversationHistory(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [studentId]);

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setSendStatus(null);
  };

  const openContactView = () => {
    handleOpen();
    setSelectedTopic({ id: 'contact' });
    setCurrentView('contact');
    fetchConversationHistory();
    markMessagesAsRead();
  };

  // The header bell (and ?support=open deep links) ask the widget to open the chat
  const openContactViewRef = useRef(openContactView);
  openContactViewRef.current = openContactView;

  useEffect(() => {
    const handleOpenRequest = () => openContactViewRef.current();
    window.addEventListener('student-support:open', handleOpenRequest);
    return () => window.removeEventListener('student-support:open', handleOpenRequest);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setSendStatus(null);
    setConversationHistory([]);
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);

    if (topic.id === 'contact') {
      setCurrentView('contact');
      fetchConversationHistory();
      setUnreadCount(0);
      markMessagesAsRead();
    } else {
      setCurrentView('questions');
      setMessages([{
        type: 'bot',
        content: `You selected "${topic.title}". Here are some common questions:`
      }]);
    }
  };

  const handleQuestionClick = (qa) => {
    setMessages(prev => [
      ...prev,
      { type: 'user', content: qa.question },
      { type: 'bot', content: qa.answer }
    ]);
    setCurrentView('chat');
  };

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setConversationHistory([]);
  };

  const handleBackToQuestions = () => {
    setCurrentView('questions');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedImage) {
      return;
    }

    if (feedbackState.active) {
      handleFeedbackResponse(newMessage.trim());
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const token = localStorage.getItem('studentAuthToken');
      const formData = new FormData();
      formData.append('name', studentName);
      formData.append('email', studentEmail);
      formData.append('studentId', studentId);
      formData.append('college', institute);
      formData.append('message', newMessage.trim());
      formData.append('topic', 'Contact / Support');

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const messageCopy = newMessage.trim();
      setNewMessage('');
      removeImage();

      const response = await fetch(`${API_URL}/api/student-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSendStatus('success');
        setConversationHistory(prev => {
          if (prev.find(m => m.id === data.data?.id)) return prev;
          return [...prev, {
            id: data.data?.id,
            message: messageCopy,
            sender_type: 'student',
            created_at: data.data?.createdAt || new Date().toISOString(),
            image_path: data.data?.imagePath || null
          }];
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedbackResponse = async (response) => {
    const { step } = feedbackState;

    // Add user response to chat
    setConversationHistory(prev => [...prev, {
      id: `feedback-response-${Date.now()}`,
      message: response,
      sender_type: 'student',
      created_at: new Date().toISOString()
    }]);

    setNewMessage('');

    if (step === 'rating') {
      const rating = parseInt(response);

      if (rating >= 1 && rating <= 5) {
        setFeedbackState(prev => ({
          ...prev,
          step: 'helpful',
          data: { ...prev.data, rating }
        }));

        setTimeout(() => {
          setConversationHistory(prev => [...prev, {
            id: `feedback-q2-${Date.now()}`,
            message: "Great! Was the admin's help useful to you?\n\nReply with:\n👍 Yes\n👎 No",
            sender_type: 'system',
            created_at: new Date().toISOString(),
            feedbackStep: 'helpful'
          }]);
        }, 500);
      } else {
        setConversationHistory(prev => [...prev, {
          id: `feedback-error-${Date.now()}`,
          message: "Please reply with a number between 1 and 5 ⭐",
          sender_type: 'system',
          created_at: new Date().toISOString()
        }]);
      }
    } else if (step === 'helpful') {
      const helpful = response.toLowerCase().includes('yes') || response.includes('👍');

      setFeedbackState(prev => ({
        ...prev,
        step: 'responseTime',
        data: { ...prev.data, helpful }
      }));

      setTimeout(() => {
        setConversationHistory(prev => [...prev, {
          id: `feedback-q3-${Date.now()}`,
          message: "How was the response time?\n\nReply with:\n1️⃣ Very Fast\n2️⃣ Fast\n3️⃣ Average\n4️⃣ Slow\n5️⃣ Very Slow",
          sender_type: 'system',
          created_at: new Date().toISOString(),
          feedbackStep: 'responseTime'
        }]);
      }, 500);
    } else if (step === 'responseTime') {
      const timeMap = {
        '1': 'very_fast',
        '2': 'fast',
        '3': 'average',
        '4': 'slow',
        '5': 'very_slow',
        'very fast': 'very_fast',
        'fast': 'fast',
        'average': 'average',
        'slow': 'slow',
        'very slow': 'very_slow'
      };

      const responseTime = timeMap[response.toLowerCase()] || timeMap[response];

      if (responseTime) {
        setFeedbackState(prev => ({
          ...prev,
          step: 'comments',
          data: { ...prev.data, responseTime }
        }));

        setTimeout(() => {
          setConversationHistory(prev => [...prev, {
            id: `feedback-q4-${Date.now()}`,
            message: "Almost done! 🎉\n\nAny additional comments or suggestions?\n\n(Type 'skip' if you don't want to add comments)",
            sender_type: 'system',
            created_at: new Date().toISOString(),
            feedbackStep: 'comments'
          }]);
        }, 500);
      } else {
        setConversationHistory(prev => [...prev, {
          id: `feedback-error-${Date.now()}`,
          message: "Please reply with a number between 1 and 5",
          sender_type: 'system',
          created_at: new Date().toISOString()
        }]);
      }
    } else if (step === 'comments') {
      const comments = response.toLowerCase() === 'skip' ? '' : response;
      const finalData = {
        ...feedbackState.data,
        comments
      };

      try {
        const token = localStorage.getItem('studentAuthToken');
        const submitResponse = await fetch(
          `${API_URL}/api/student-messages/conversation/${encodeURIComponent(studentId)}/feedback`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalData)
          }
        );

        const result = await submitResponse.json();

        if (result.success) {
          setConversationHistory(prev => [...prev, {
            id: `feedback-complete-${Date.now()}`,
            message: "Thank you so much for your feedback! 🙏\n\nYour input helps us improve our support service. Have a great day! ✨",
            sender_type: 'system',
            created_at: new Date().toISOString()
          }]);

          setFeedbackState({
            active: false,
            step: null,
            data: { rating: null, helpful: null, responseTime: null, comments: null }
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('[StudentChatbot] Error submitting feedback:', error);
        setConversationHistory(prev => [...prev, {
          id: `feedback-error-${Date.now()}`,
          message: "Sorry, there was an error submitting your feedback. Please try again later.",
          sender_type: 'system',
          created_at: new Date().toISOString()
        }]);
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Render topic selection
  const renderTopics = () => (
    <div className="p-4 space-y-3">
      <p className="text-sm text-shnoor-soft mb-4">
        Hi {studentName}! 👋 How can I help you today? Select a topic below:
      </p>
      {CHATBOT_TOPICS.map((topic) => (
        <button
          key={topic.id}
          onClick={() => handleTopicSelect(topic)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group ${topic.id === 'contact'
            ? 'border-shnoor-indigo bg-shnoor-lavender hover:bg-shnoor-indigo/20'
            : 'border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30'
            }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${topic.id === 'contact'
            ? 'bg-shnoor-indigo/20 group-hover:bg-shnoor-indigo/30'
            : 'bg-shnoor-lavender group-hover:bg-shnoor-indigo/20'
            }`}>
            <Icon d={TOPIC_ICONS[topic.icon]} className="w-5 h-5 text-shnoor-indigo" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-shnoor-navy">{topic.title}</p>
            <p className="text-xs text-shnoor-soft">{topic.description}</p>
          </div>
        </button>
      ))}
    </div>
  );

  // Render questions for selected topic (no Contact Admin option)
  const renderQuestions = () => {
    const questions = CHATBOT_QA[selectedTopic.id] || [];

    return (
      <div className="p-4 space-y-2">
        {questions.map((qa, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(qa)}
            className="w-full text-left p-3 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30 transition-all text-sm text-shnoor-navy"
          >
            {qa.question}
          </button>
        ))}
      </div>
    );
  };

  // Render chat messages (FAQ answers)
  const renderChat = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${msg.type === 'user'
              ? 'bg-shnoor-indigo text-white rounded-tr-none'
              : 'bg-shnoor-lavender text-shnoor-navy rounded-tl-none'
              }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />

      {/* Show more questions button */}
      {currentView === 'chat' && selectedTopic && (
        <div className="pt-4">
          <button
            onClick={handleBackToQuestions}
            className="w-full text-center p-2 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender text-sm text-shnoor-indigo font-medium"
          >
            Show more questions
          </button>
        </div>
      )}
    </div>
  );

  // Render Contact/Support chat interface
  const renderContactSupport = () => (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin"></div>
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto mb-4 text-shnoor-soft opacity-30" />
            <p className="text-sm text-shnoor-soft">No messages yet.</p>
            <p className="text-xs text-shnoor-soft mt-1">Send your first message to get support!</p>
          </div>
        ) : (
          <>
            {conversationHistory.map((msg, index) => {
              const isStudent = msg.sender_type === 'student';
              const isSystem = msg.sender_type === 'system';
              const showDate = index === 0 ||
                formatDate(msg.created_at) !== formatDate(conversationHistory[index - 1].created_at);

              return (
                <div key={msg.id || index}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-shnoor-soft bg-shnoor-lavender px-3 py-1 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isStudent ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
                    <div className={`${isSystem ? 'w-full' : 'max-w-[85%]'} ${isStudent ? 'order-2' : 'order-1'}`}>
                      {!isStudent && !isSystem && (
                        <p className="text-xs text-shnoor-indigo font-medium mb-1 ml-1">Admin</p>
                      )}
                      <div
                        className={`p-3 rounded-xl text-sm ${isSystem
                            ? 'bg-yellow-50 border border-yellow-200 text-gray-800'
                            : isStudent
                              ? 'bg-shnoor-indigo text-white rounded-tr-none'
                              : 'bg-shnoor-lavender text-shnoor-navy rounded-tl-none'
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.image_path && (
                          <div className="mt-2 relative group inline-block max-w-full">
                            <img
                              src={`${API_URL}${msg.image_path}`}
                              alt="Attachment"
                              className="max-h-52 sm:max-h-60 w-auto max-w-full rounded-lg object-contain bg-black/5 border border-shnoor-mist/50 cursor-pointer transition-all hover:opacity-90 hover:scale-[1.01]"
                              onClick={() => window.open(`${API_URL}${msg.image_path}`, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      {!isSystem && (
                        <p className={`text-xs text-shnoor-soft mt-1 ${isStudent ? 'text-right mr-1' : 'ml-1'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-shnoor-mist p-4 bg-white">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-shnoor-mist"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Status messages */}
        {sendStatus === 'success' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-xs mb-2">
            <Check size={14} />
            Message sent!
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs mb-2">
            <AlertCircle size={14} />
            Failed to send. Try again.
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full h-11 min-h-[44px] max-h-24 py-2.5 pl-3.5 pr-10 rounded-xl border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm resize-none leading-5 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-shnoor-soft hover:text-shnoor-indigo transition-colors flex items-center justify-center p-1 rounded-md"
              title="Attach image"
            >
              <Image size={18} />
            </button>
          </div>
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !selectedImage)}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-shnoor-indigo text-white hover:bg-shnoor-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notification for New Admin Reply - positioned at top for global visibility */}
      {showToastNotification && toastMessage && (
        <div className="fixed top-4 left-4 sm:left-auto right-4 z-[9999] animate-slide-in-right">
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-full sm:max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setShowToastNotification(false);
              setToastMessage(null);
              openContactView();
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-shnoor-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-shnoor-navy">
                  New Reply from Support
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {toastMessage.messagePreview}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToastNotification(false);
                  setToastMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-shnoor-indigo text-white shadow-lg hover:bg-shnoor-navy transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Open support chat"
      >
        <MessageCircle size={24} />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[360px] h-[500px] sm:h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-shnoor-indigo text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {(currentView !== 'topics') && (
                <button
                  onClick={handleBackToTopics}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h3 className="font-bold text-base">
                  {currentView === 'topics' && 'Help Center'}
                  {currentView === 'questions' && selectedTopic?.title}
                  {currentView === 'chat' && selectedTopic?.title}
                  {currentView === 'contact' && 'Contact / Support'}
                </h3>
                <p className="text-xs text-white/70">
                  {currentView === 'topics' && 'SHNOOR Assessment Portal'}
                  {currentView === 'contact' && 'Chat with Admin'}
                  {(currentView === 'questions' || currentView === 'chat') && 'Frequently asked questions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentView === 'contact' && (
                <button
                  onClick={fetchConversationHistory}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Refresh messages"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-gray-50/50 flex flex-col">
            {currentView === 'topics' && (
              <div className="overflow-y-auto">{renderTopics()}</div>
            )}
            {currentView === 'questions' && (
              <div className="overflow-y-auto">{renderQuestions()}</div>
            )}
            {currentView === 'chat' && renderChat()}
            {currentView === 'contact' && renderContactSupport()}
          </div>

          {/* Footer */}
          {currentView !== 'contact' && (
            <div className="p-3 border-t border-shnoor-mist bg-white text-center flex-shrink-0">
              <p className="text-xs text-shnoor-soft">
                Powered by SHNOOR Assessments
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StudentSupportChatbot;