import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MailOpen, Trash2, Image, Filter, RefreshCw, CheckCheck, User, AlertCircle, X, Send, Building, MessageCircle, Paperclip, Smile, CheckCircle, Clock, BarChart3, TrendingUp, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useSupportSocket } from '../../hooks/useSupportSocket';
import { API_URL } from '../../config/api';

const EMOJI_OPTIONS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '🙂', '🙃', '😉', '😍', '🥰', '😘',
  '😎', '🤩', '🥳', '🤗', '🤔', '🤝', '🙏', '👍', '👎', '👌', '👏', '🙌', '👋', '✌️', '🤞', '💪',
  '✅', '❌', '⚠️', '🚫', '⏳', '⌛', '🕒', '🕔', '📝', '📌', '📎', '📍', '📣', '🔔', '🔕', '💡',
  '📷', '🖼️', '📁', '📂', '🗂️', '🧾', '📊', '📈', '📉', '💬', '🗨️', '📨', '📩', '✉️', '📮', '📬',
  '🌟', '⭐', '✨', '🔥', '💯', '🎯', '🎉', '🎊', '🏁', '🚀', '🧠', '🔍', '🔒', '🔓', '🛡️', '⚙️',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💬', '🙇', '🙋', '🤷', '😇', '😌', '😴',
  '😐', '😑', '😶', '😬', '😮', '😯', '😲', '😳', '🥲', '😭', '😤', '😓', '😰', '😵', '🤯', '😇'
];

const StudentMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [conversationThread, setConversationThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // New states for bulk delete and analytics
  const [selectedConversations, setSelectedConversations] = useState(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [closingConversation, setClosingConversation] = useState(false);


  const messagesEndRef = useRef(null);
  const selectedMessageRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const showAlert = (message) => alert(message);
  const showConfirm = (message) => window.confirm(message);

  // Keep ref in sync with state so socket handler always has latest value
  useEffect(() => {
    selectedMessageRef.current = selectedMessage;
  }, [selectedMessage]);

  const dedupeById = useCallback((items = []) => {
    const map = new Map();
    items.forEach((item) => {
      if (item?.id === undefined || item?.id === null) return;
      if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, []);

  const buildUniqueThreads = useCallback((items = []) => {
    const threadMap = new Map();
    items.forEach((msg) => {
      const threadKey = msg.student_id
        ? `student-${msg.student_id}`
        : `fallback-${msg.email || ''}-${msg.name || ''}-${msg.college || ''}`;
      const current = threadMap.get(threadKey);
      const msgTime = new Date(msg.created_at).getTime();
      const currentTime = current ? new Date(current.created_at).getTime() : -1;
      if (!current) {
        threadMap.set(threadKey, { ...msg, _hasUnread: msg.status === 'unread' });
        return;
      }
      const hasUnread = current._hasUnread || msg.status === 'unread';
      if (msgTime >= currentTime) {
        threadMap.set(threadKey, { ...msg, _hasUnread: hasUnread });
      } else {
        threadMap.set(threadKey, { ...current, _hasUnread: hasUnread });
      }
    });
    return Array.from(threadMap.values())
      .map((thread) => ({ ...thread, status: thread._hasUnread ? 'unread' : 'read' }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, []);

  // Real-time socket for new student messages
  const { getSocket } = useSupportSocket({ isAdmin: true, enabled: true });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewStudentMessage = (data) => {
      setMessages(prev => {
        const exists = prev.find(m => m.student_id === data.studentId);
        if (exists) {
          return prev.map(m =>
            m.student_id === data.studentId
              ? { ...m, message: data.messagePreview, unread_count: (parseInt(m.unread_count) || 0) + 1, created_at: data.createdAt }
              : m
          );
        }
        return prev;
      });

      const current = selectedMessageRef.current;
      if (current && current.student_id === data.studentId) {
        // Real-time: Add message to conversation thread
        setConversationThread(prev => [...prev, {
          id: data.id,
          message: data.messagePreview,
          sender_type: 'student',
          created_at: data.createdAt,
          image_path: data.imagePath || null
        }]);
      }
    };

    socket.on('support:new-student-message', handleNewStudentMessage);
    return () => socket.off('support:new-student-message', handleNewStudentMessage);
  }, [getSocket]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = `${API_URL}/api/student-messages?page=${pagination.page}&limit=${pagination.limit}`;
      if (filter !== 'all') url += `&status=${filter}`;
      if (selectedCollege) url += `&college=${encodeURIComponent(selectedCollege)}`;

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();

      if (data.success) {
        const uniqueRows = dedupeById(data.messages || []);
        setMessages(buildUniqueThreads(uniqueRows));
        setColleges(data.colleges || []);
        setPagination(prev => ({ ...prev, total: data.pagination.total, pages: data.pagination.pages }));
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedCollege, pagination.page, pagination.limit, dedupeById, buildUniqueThreads]);

  const fetchConversationThread = useCallback(async (messageId) => {
    try {
      setLoadingThread(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/${messageId}/thread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setConversationThread(dedupeById(data.messages || []));
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setLoadingThread(false);
    }
  }, [dedupeById]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/login'); return; }
    fetchMessages();
  }, [fetchMessages, navigate]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [conversationThread]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);



  const markConversationAsRead = async (msg) => {
    if (!msg.student_id || !parseInt(msg.unread_count)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/student-messages/conversation/${encodeURIComponent(msg.student_id)}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(prev =>
        prev.map(m => m.student_id === msg.student_id ? { ...m, unread_count: 0, status: 'read' } : m)
      );
      const countRes = await fetch(`${API_URL}/api/student-messages/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const countData = await countRes.json();
      if (countData.success && countData.count === 0) {
        window.dispatchEvent(new Event('admin-messages-all-read'));
      }
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!showConfirm('Are you sure you want to delete this message?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) { setSelectedMessage(null); setConversationThread([]); }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const deleteConversation = async () => {
    if (!selectedMessage) return;
    if (!selectedMessage.student_id) { deleteMessage(selectedMessage.id); return; }
    const confirmed = showConfirm(
      `Delete entire conversation for ${selectedMessage.name || 'this student'}? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/api/student-messages/conversation/${encodeURIComponent(selectedMessage.student_id)}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.student_id !== selectedMessage.student_id));
        setSelectedMessage(null);
        setConversationThread([]);
        setReplyMessage('');
        fetchMessages();
      } else {
        throw new Error(data.message || 'Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      showAlert('Failed to delete conversation. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/mark-all-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) { window.dispatchEvent(new Event('admin-messages-all-read')); fetchMessages(); }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showAlert('Please upload an image file only'); return; }
    if (file.size > 5 * 1024 * 1024) { showAlert('Image size should be less than 5MB'); return; }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => handleImageSelect(e.target.files?.[0]);

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji) => {
    setReplyMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if ((!replyMessage.trim() && !selectedImage) || !selectedMessage) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('message', replyMessage.trim());
      if (selectedImage) formData.append('image', selectedImage);

      const response = await fetch(`${API_URL}/api/student-messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        const optimisticReply = {
          id: data.data.id,
          message: replyMessage.trim(),
          sender_type: 'admin',
          created_at: data.data.createdAt,
          image_path: data.data.imagePath || null
        };
        setConversationThread(prev => {
          if (prev.some(msg => msg.id === optimisticReply.id)) return prev;
          return [...prev, optimisticReply];
        });
        setReplyMessage('');
        removeImage();
        setShowEmojiPicker(false);
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showAlert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSelectMessage = async (msg) => {
    // Toggle: if clicking the same message, close it
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(null);
      setConversationThread([]);
      setReplyMessage('');
      removeImage();
      return;
    }

    setSelectedMessage(msg);
    markConversationAsRead(msg);
    fetchConversationThread(msg.id);
  };

  const openImageModal = (imagePath) => {
    setImageUrl(`${API_URL}${imagePath}`);
    setImageModalOpen(true);
  };

  // New functions for bulk delete
  const toggleConversationSelection = (studentId) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAllConversations = () => {
    if (selectedConversations.size === messages.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(messages.map(m => m.student_id).filter(Boolean)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.size === 0) return;

    const confirmed = showConfirm(
      `Delete ${selectedConversations.size} selected conversations? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: Array.from(selectedConversations) })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => !selectedConversations.has(msg.student_id)));
        setSelectedConversations(new Set());
        setBulkDeleteMode(false);
        if (selectedMessage && selectedConversations.has(selectedMessage.student_id)) {
          setSelectedMessage(null);
          setConversationThread([]);
        }
        showAlert(`Successfully deleted ${data.deletedMessages} messages from ${selectedConversations.size} conversations`);
        fetchMessages();
      } else {
        throw new Error(data.message || 'Failed to delete conversations');
      }
    } catch (err) {
      console.error('Error bulk deleting:', err);
      showAlert('Failed to delete conversations. Please try again.');
    }
  };

  // Close conversation function
  const closeConversation = async () => {
    if (!selectedMessage || !selectedMessage.student_id) {
      showAlert('Cannot close this conversation');
      return;
    }

    const confirmed = showConfirm(
      `Close conversation with ${selectedMessage.name}? The student will be asked to provide feedback.`
    );
    if (!confirmed) return;

    setClosingConversation(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/api/student-messages/conversation/${encodeURIComponent(selectedMessage.student_id)}/close`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        showAlert('Conversation closed successfully. Student will be notified to provide feedback.');
        setSelectedMessage(null);
        setConversationThread([]);
        fetchMessages();
      } else {
        throw new Error(data.message || 'Failed to close conversation');
      }
    } catch (err) {
      console.error('Error closing conversation:', err);
      showAlert('Failed to close conversation. Please try again.');
    } finally {
      setClosingConversation(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/analytics/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const unreadCount = messages.reduce((total, msg) => total + (parseInt(msg.unread_count) || 0), 0);


  return (
    <AdminLayout title="Student Support">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-shnoor-soft hover:text-shnoor-indigo transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-shnoor-navy">Student Support</h1>
            <p className="text-shnoor-soft text-sm mt-1">
              Manage student support messages and inquiries
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${showAnalytics
                  ? 'bg-shnoor-indigo text-white border-shnoor-indigo'
                  : 'bg-white border-shnoor-mist hover:bg-shnoor-lavender'
                }`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button
              onClick={() => {
                setBulkDeleteMode(!bulkDeleteMode);
                setSelectedConversations(new Set());
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${bulkDeleteMode
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white border-shnoor-mist hover:bg-shnoor-lavender'
                }`}
            >
              <Trash2 size={16} />
              {bulkDeleteMode ? 'Cancel' : 'Bulk Delete'}
            </button>
            <button
              onClick={fetchMessages}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-shnoor-mist rounded-lg hover:bg-shnoor-lavender transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-colors"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="bg-white rounded-xl border border-shnoor-mist p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-shnoor-navy flex items-center gap-2">
              <TrendingUp size={24} />
              Feedback Analytics
            </h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-shnoor-soft hover:text-shnoor-navy"
            >
              <X size={20} />
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle size={20} className="text-blue-600" />
                    <p className="text-sm text-blue-600 font-medium">Closed Conversations</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{analytics.overview.totalClosedConversations}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <p className="text-sm text-green-600 font-medium">Feedback Received</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{analytics.overview.conversationsWithFeedback}</p>
                  <p className="text-xs text-green-600 mt-1">{analytics.overview.feedbackResponseRate}% response rate</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} className="text-yellow-600" />
                    <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{analytics.overview.averageRating.toFixed(1)} / 5.0</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp size={20} className="text-purple-600" />
                    <p className="text-sm text-purple-600 font-medium">Helpful</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{analytics.overview.helpfulCount}</p>
                  <p className="text-xs text-purple-600 mt-1">{analytics.overview.notHelpfulCount} not helpful</p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-shnoor-navy mb-4">Rating Distribution</h3>
                <div className="space-y-2">
                  {[
                    { stars: 5, count: analytics.ratingDistribution.fiveStar, color: 'bg-green-500' },
                    { stars: 4, count: analytics.ratingDistribution.fourStar, color: 'bg-lime-500' },
                    { stars: 3, count: analytics.ratingDistribution.threeStar, color: 'bg-yellow-500' },
                    { stars: 2, count: analytics.ratingDistribution.twoStar, color: 'bg-orange-500' },
                    { stars: 1, count: analytics.ratingDistribution.oneStar, color: 'bg-red-500' }
                  ].map(({ stars, count, color }) => {
                    const total = Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{stars}</span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`${color} h-full flex items-center justify-end px-2 transition-all`}
                            style={{ width: `${percentage}%` }}
                          >
                            {count > 0 && <span className="text-xs font-medium text-white">{count}</span>}
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Response Time Distribution */}
              {analytics.responseTimeDistribution.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-shnoor-navy mb-4 flex items-center gap-2">
                    <Clock size={18} />
                    Response Time Feedback
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {analytics.responseTimeDistribution.map(({ feedback_response_time, count }) => (
                      <div key={feedback_response_time} className="bg-white rounded-lg p-3 border border-shnoor-mist text-center">
                        <p className="text-2xl font-bold text-shnoor-navy">{count}</p>
                        <p className="text-xs text-shnoor-soft capitalize mt-1">
                          {feedback_response_time.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feedback */}
              {analytics.recentFeedback.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-shnoor-navy mb-4">Recent Feedback</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analytics.recentFeedback.map((feedback, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-shnoor-mist">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-shnoor-navy">{feedback.name}</p>
                            {feedback.college && (
                              <p className="text-xs text-shnoor-soft flex items-center gap-1">
                                <Building size={10} />
                                {feedback.college}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < feedback.feedback_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-shnoor-soft mb-2">
                          <span className="flex items-center gap-1">
                            {feedback.feedback_helpful ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                            {feedback.feedback_helpful ? 'Helpful' : 'Not Helpful'}
                          </span>
                          {feedback.feedback_response_time && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {feedback.feedback_response_time.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {feedback.feedback_comments && (
                          <p className="text-sm text-gray-700 italic">"{feedback.feedback_comments}"</p>
                        )}
                        <p className="text-xs text-shnoor-soft mt-2">
                          Submitted {new Date(feedback.feedback_submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-shnoor-soft">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
              <p>No analytics data available</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-shnoor-mist p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-shnoor-soft" />
            <span className="text-sm font-medium text-shnoor-navy">Filter:</span>
          </div>
          <div className="flex gap-2">
            {[{ key: 'all', label: 'All Messages' }, { key: 'unread', label: 'Unread' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPagination(prev => ({ ...prev, page: 1 })); }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${filter === key ? 'bg-shnoor-indigo text-white' : 'bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-indigo/10'
                  }`}
              >
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${filter === 'unread' ? 'bg-white text-shnoor-indigo' : 'bg-red-500 text-white'
                    }`}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Building size={16} className="text-shnoor-soft" />
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="px-3 py-1.5 text-sm border border-shnoor-mist rounded-lg focus:border-shnoor-indigo outline-none min-w-[200px]"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => <option key={college} value={college}>{college}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-shnoor-mist overflow-hidden">
          <div className="p-4 border-b border-shnoor-mist bg-shnoor-lavender">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-shnoor-navy">Messages ({pagination.total})</h2>
              {bulkDeleteMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllConversations}
                    className="text-xs px-2 py-1 bg-shnoor-indigo text-white rounded hover:bg-shnoor-navy"
                  >
                    {selectedConversations.size === messages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedConversations.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete ({selectedConversations.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="divide-y divide-shnoor-mist max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-shnoor-soft">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={32} className="text-shnoor-soft mx-auto mb-2" />
                <p className="text-sm text-shnoor-soft">No messages found</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-4 cursor-pointer hover:bg-shnoor-lavender/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-shnoor-lavender' : ''
                    } ${msg.unread_count > 0 ? 'bg-shnoor-indigo/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {bulkDeleteMode && msg.student_id && (
                      <input
                        type="checkbox"
                        checked={selectedConversations.has(msg.student_id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleConversationSelection(msg.student_id);
                        }}
                        className="mt-1 w-4 h-4 text-shnoor-indigo rounded focus:ring-shnoor-indigo"
                      />
                    )}
                    <div
                      onClick={() => !bulkDeleteMode && handleSelectMessage(msg)}
                      className="flex items-start gap-3 flex-1"
                    >
                      <div className="relative">
                        <div className={`p-2 rounded-lg ${msg.unread_count > 0 ? 'bg-shnoor-indigo/10' : 'bg-shnoor-mist'}`}>
                          {msg.unread_count > 0 ? <Mail size={16} className="text-shnoor-indigo" /> : <MailOpen size={16} className="text-shnoor-soft" />}
                        </div>
                        {msg.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm truncate ${msg.unread_count > 0 ? 'font-semibold text-shnoor-navy' : 'text-shnoor-navy'}`}>{msg.name}</p>
                          <span className="text-xs text-shnoor-soft flex-shrink-0 ml-2">{formatDate(msg.created_at)}</span>
                        </div>
                        {msg.college && (
                          <p className="text-xs text-shnoor-indigo mb-1 flex items-center gap-1"><Building size={10} />{msg.college}</p>
                        )}
                        <p className="text-sm text-shnoor-soft truncate">{msg.message}</p>
                        {parseInt(msg.unread_count) > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {parseInt(msg.unread_count)} new
                            </span>
                          </div>
                        )}
                        {msg.image_path && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-shnoor-indigo"><Image size={12} />Attachment</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-shnoor-mist flex items-center justify-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-shnoor-mist rounded hover:bg-shnoor-lavender disabled:opacity-50"
              >Prev</button>
              <span className="text-sm text-shnoor-soft">Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-shnoor-mist rounded hover:bg-shnoor-lavender disabled:opacity-50"
              >Next</button>
            </div>
          )}
        </div>


        {/* Message detail / Conversation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-shnoor-mist overflow-hidden flex flex-col" style={{ height: '700px' }}>
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-shnoor-mist bg-shnoor-lavender flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-shnoor-indigo/10 flex items-center justify-center">
                    <User size={20} className="text-shnoor-indigo" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-shnoor-navy">{selectedMessage.name}</h2>
                    {selectedMessage.college && (
                      <p className="text-xs text-shnoor-soft flex items-center gap-1">
                        <Building size={10} />{selectedMessage.college}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMessage.student_id && (
                    <button
                      onClick={closeConversation}
                      disabled={closingConversation}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Close conversation and request feedback"
                    >
                      {closingConversation ? (
                        <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={deleteConversation}
                    className="p-2 text-shnoor-soft hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setConversationThread([]);
                      setReplyMessage('');
                      removeImage();
                    }}
                    className="p-2 text-shnoor-soft hover:text-shnoor-navy hover:bg-white rounded-lg transition-colors"
                    title="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin"></div>
                  </div>
                ) : conversationThread.length === 0 ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-white border border-shnoor-mist p-4 rounded-xl rounded-tl-none shadow-sm">
                        <p className="text-shnoor-navy whitespace-pre-wrap">{selectedMessage.message}</p>
                        {selectedMessage.image_path && (
                          <img
                            src={`${API_URL}${selectedMessage.image_path}`}
                            alt="Attachment"
                            className="mt-3 max-w-full rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => openImageModal(selectedMessage.image_path)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-shnoor-soft mt-1 ml-1">{formatTime(selectedMessage.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  conversationThread.map((msg, index) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div key={msg.id || index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                          {!isAdmin && <p className="text-xs text-shnoor-navy font-medium mb-1 ml-1">{selectedMessage.name}</p>}
                          {isAdmin && <p className="text-xs text-shnoor-indigo font-medium mb-1 mr-1 text-right">Admin</p>}
                          <div className={`p-4 rounded-xl shadow-sm ${isAdmin ? 'bg-shnoor-indigo text-white rounded-tr-none' : 'bg-white border border-shnoor-mist text-shnoor-navy rounded-tl-none'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            {msg.image_path && (
                              <img
                                src={`${API_URL}${msg.image_path}`}
                                alt="Attachment"
                                className="mt-3 max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => openImageModal(msg.image_path)}
                              />
                            )}
                          </div>
                          <p className={`text-xs text-shnoor-soft mt-1 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="border-t border-shnoor-mist p-4 bg-white flex-shrink-0">
                <form onSubmit={sendReply} className="space-y-3">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Reply attachment preview" className="h-24 w-auto rounded-lg border border-shnoor-mist" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-white border border-shnoor-mist text-shnoor-soft hover:text-red-600"
                        title="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="p-3 rounded-xl border border-shnoor-mist text-shnoor-soft hover:text-shnoor-indigo hover:border-shnoor-indigo transition-colors"
                        title="Add emoji"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 bg-white border border-shnoor-mist rounded-xl p-2 shadow-lg w-80 max-h-56 overflow-y-auto z-20">
                          <div className="grid grid-cols-8 gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="h-8 w-8 rounded-md hover:bg-shnoor-lavender text-lg"
                              >{emoji}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl border border-shnoor-mist text-shnoor-soft hover:text-shnoor-indigo hover:border-shnoor-indigo transition-colors"
                      title="Upload file or screenshot"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <div className="flex-1">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onPaste={(e) => {
                          const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
                          const pastedFile = item?.getAsFile();
                          if (pastedFile) { e.preventDefault(); handleImageSelect(pastedFile); }
                        }}
                        placeholder="Type your reply..."
                        rows={2}
                        className="w-full p-3 rounded-xl border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingReply || (!replyMessage.trim() && !selectedImage)}
                      className="p-3 rounded-xl bg-shnoor-indigo text-white hover:bg-shnoor-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-shnoor-soft">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a message to view conversation</p>
                <p className="text-sm mt-1">Click on a message to view details and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setImageModalOpen(false)}
          >
            <X size={32} />
          </button>
          <img
            src={imageUrl}
            alt="Full size attachment"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default StudentMessages;
