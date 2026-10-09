import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MailOpen, Trash2, ChevronDown, RefreshCw, CheckCheck, User, AlertCircle, X, Send, Building, MessageCircle, Paperclip, Smile, CheckCircle, Clock, BarChart3, TrendingUp, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
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

const StudentMessages = ({ isEmbedded = false }) => {
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


  const messagesContainerRef = useRef(null);
  const selectedMessageRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  const showAlert = (message) => alert(message);
  const showConfirm = (message) => window.confirm(message);

  // Keep ref in sync with state so socket handler always has latest value
  useEffect(() => {
    selectedMessageRef.current = selectedMessage;
  }, [selectedMessage]);

  // Dynamically auto-resize reply textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      if (textareaRef.current.scrollHeight > 48) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
      }
    }
  }, [replyMessage]);

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

  // Mark a student's conversation read in the DB and tell the header bell the new unread total
  const markStudentRead = useCallback(async (studentId) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`${API_URL}/api/student-messages/conversation/${encodeURIComponent(studentId)}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const countRes = await fetch(`${API_URL}/api/student-messages/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const countData = await countRes.json();
    if (countData.success) {
      window.dispatchEvent(new CustomEvent('admin-conversation-read', { detail: { studentId, count: countData.count } }));
      if (countData.count === 0) {
        window.dispatchEvent(new Event('admin-messages-all-read'));
      }
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewStudentMessage = (data) => {
      const current = selectedMessageRef.current;
      const isOpenConversation = !!current && current.student_id === data.studentId;

      setMessages(prev => {
        const exists = prev.find(m => m.student_id === data.studentId);
        if (exists) {
          return prev.map(m =>
            m.student_id === data.studentId
              ? { ...m, message: data.messagePreview, unread_count: isOpenConversation ? 0 : (parseInt(m.unread_count) || 0) + 1, created_at: data.createdAt }
              : m
          );
        }
        return prev;
      });

      // The admin is already viewing this conversation, so the new message is read right away
      if (isOpenConversation) {
        markStudentRead(data.studentId).catch(err => console.error('Error marking new message as read:', err));
      }

      if (isOpenConversation) {
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
  }, [getSocket, markStudentRead]);

  // An open conversation is always read: clear any unread count it picks up (live message, list refresh, reconnect)
  const markingReadRef = useRef(new Set());
  useEffect(() => {
    const studentId = selectedMessage?.student_id;
    if (!studentId || markingReadRef.current.has(studentId)) return;
    const thread = messages.find(m => m.student_id === studentId);
    if (!thread || !(parseInt(thread.unread_count) > 0)) return;

    markingReadRef.current.add(studentId);
    setMessages(prev =>
      prev.map(m => m.student_id === studentId ? { ...m, unread_count: 0, status: 'read' } : m)
    );
    markStudentRead(studentId)
      .catch(err => console.error('Error marking open conversation as read:', err))
      .finally(() => markingReadRef.current.delete(studentId));
  }, [messages, selectedMessage, markStudentRead]);

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
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
      setMessages(prev =>
        prev.map(m => m.student_id === msg.student_id ? { ...m, unread_count: 0, status: 'read' } : m)
      );
      await markStudentRead(msg.student_id);
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

        // Replying means the admin has seen every student message in this conversation
        const repliedStudentId = selectedMessage.student_id;
        if (repliedStudentId) {
          setMessages(prev =>
            prev.map(m => m.student_id === repliedStudentId ? { ...m, unread_count: 0, status: 'read' } : m)
          );
          markStudentRead(repliedStudentId).catch(err => console.error('Error marking conversation as read after reply:', err));
        }
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
    // Below lg the list is replaced by the conversation, so bring it into view
    if (window.matchMedia('(max-width: 1023px)').matches) window.scrollTo({ top: 0 });
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


  const content = (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className={`section-header ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
        <div className="section-header-left">
          <div className="flex items-center gap-3">
            {!isEmbedded && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 h-10 px-4 border border-[#D1D1E6] dark:border-slate-700 bg-white dark:bg-[#1E1E38] text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="section-title">Student Support</h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded-full text-xs font-bold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="section-subtitle">Review student inquiries, resolve support tickets, and manage real-time communication</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center justify-center gap-2 h-10 px-4 text-sm whitespace-nowrap rounded-xl transition-all font-semibold cursor-pointer border ${showAnalytics
              ? 'bg-[#403f75] dark:bg-indigo-600 text-white border-transparent shadow-sm'
              : 'bg-white dark:bg-[#1E1E38] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
          >
            <BarChart3 size={16} className={showAnalytics ? '' : 'text-[#403f75] dark:text-indigo-400'} />
            Analytics
          </button>
          <button
            onClick={fetchMessages}
            className="flex items-center justify-center gap-2 h-10 px-4 text-sm whitespace-nowrap bg-white dark:bg-[#1E1E38] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all font-semibold cursor-pointer shadow-2xs"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => {
              setBulkDeleteMode(!bulkDeleteMode);
              setSelectedConversations(new Set());
            }}
            className={`flex items-center justify-center gap-2 h-10 px-4 text-sm whitespace-nowrap rounded-xl transition-all font-semibold cursor-pointer border ${bulkDeleteMode
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white dark:bg-[#1E1E38] text-red-600 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-2xs'
              }`}
          >
            <Trash2 size={16} />
            {bulkDeleteMode ? 'Cancel' : 'Bulk Delete'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center justify-center gap-2 h-10 px-4 text-sm bg-[#403f75] dark:bg-indigo-600 text-white hover:bg-[#343360] dark:hover:bg-indigo-700 rounded-xl transition-all font-semibold cursor-pointer shadow-sm"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className={`bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex flex-wrap items-center gap-2">
          {[{ key: 'all', label: 'All Messages' }, { key: 'unread', label: 'Unread' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-1.5 font-semibold cursor-pointer ${
                filter === key
                  ? 'bg-[#403f75] dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
              {key === 'unread' && unreadCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'unread' ? 'bg-white text-[#403f75]' : 'bg-red-500 text-white'
                }`}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {colleges.length > 0 && (
          <div className="relative flex items-center gap-2 w-full sm:w-auto min-w-0 min-h-[40px] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800">
            <Building size={14} className="text-[#9A9AC9] dark:text-slate-400 shrink-0" />
            <select
              value={selectedCollege}
              onChange={(e) => { setSelectedCollege(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="appearance-none text-sm text-slate-800 dark:text-slate-200 focus:outline-none bg-transparent w-full min-w-0 sm:w-auto sm:min-w-[200px] sm:max-w-xs truncate pr-6 cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white">All Colleges</option>
              {colleges.map(college => <option key={college} value={college} className="bg-white dark:bg-[#1E1E38] text-slate-900 dark:text-white">{college}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-[#9A9AC9] dark:text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className={`bg-theme-card rounded-xl border border-theme-border p-4 sm:p-6 mb-4 sm:mb-6 ${selectedMessage ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
              <TrendingUp size={24} />
              Feedback Analytics
            </h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-theme-muted hover:text-theme-text"
            >
              <X size={20} />
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-theme-panel rounded-xl p-5 border border-theme-border">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={18} className="text-theme-accent" />
                    <p className="text-sm text-theme-muted font-medium">Closed Conversations</p>
                  </div>
                  <p className="text-2xl font-bold text-theme-text">{analytics.overview.totalClosedConversations}</p>
                </div>
                <div className="bg-theme-panel rounded-xl p-5 border border-theme-border">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-sm text-theme-muted font-medium">Feedback Received</p>
                  </div>
                  <p className="text-2xl font-bold text-theme-text">{analytics.overview.conversationsWithFeedback}</p>
                  <p className="text-xs text-green-500 mt-1 font-medium">{analytics.overview.feedbackResponseRate}% response rate</p>
                </div>
                <div className="bg-theme-panel rounded-xl p-5 border border-theme-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={18} className="text-yellow-500" />
                    <p className="text-sm text-theme-muted font-medium">Average Rating</p>
                  </div>
                  <p className="text-2xl font-bold text-theme-text">{analytics.overview.averageRating.toFixed(1)} / 5.0</p>
                </div>
                <div className="bg-theme-panel rounded-xl p-5 border border-theme-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp size={18} className="text-theme-accent" />
                    <p className="text-sm text-theme-muted font-medium">Helpful</p>
                  </div>
                  <p className="text-2xl font-bold text-theme-text">{analytics.overview.helpfulCount}</p>
                  <p className="text-xs text-theme-muted mt-1 font-medium">{analytics.overview.notHelpfulCount} not helpful</p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="mt-8">
                <h3 className="font-semibold text-theme-text mb-4 text-sm">Rating Distribution</h3>
                <div className="space-y-3">
                  {[
                    { stars: 5, count: analytics.ratingDistribution.fiveStar, color: 'bg-[#22c55e]', defaultWidth: 100 },
                    { stars: 4, count: analytics.ratingDistribution.fourStar, color: 'bg-[#84cc16]', defaultWidth: 80 },
                    { stars: 3, count: analytics.ratingDistribution.threeStar, color: 'bg-[#eab308]', defaultWidth: 60 },
                    { stars: 2, count: analytics.ratingDistribution.twoStar, color: 'bg-[#f97316]', defaultWidth: 40 },
                    { stars: 1, count: analytics.ratingDistribution.oneStar, color: 'bg-[#ef4444]', defaultWidth: 10 }
                  ].map(({ stars, count, color, defaultWidth }) => {
                    const total = Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0);
                    const actualPercentage = total > 0 ? (count / total) * 100 : 0;
                    const barWidth = total > 0 ? actualPercentage : defaultWidth;
                    return (
                      <div key={stars} className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 w-10">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-theme-text">{stars}</span>
                        </div>
                        <div className="flex-1 bg-theme-panel rounded-full h-4 overflow-hidden border border-theme-border">
                          <div
                            className={`${color} h-full transition-all`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-sm text-theme-muted w-8 text-right">{actualPercentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Response Time Distribution */}
              {analytics.responseTimeDistribution.length > 0 && (
                <div className="bg-theme-panel rounded-lg p-4 border border-theme-border">
                  <h3 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Clock size={18} />
                    Response Time Feedback
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {analytics.responseTimeDistribution.map(({ feedback_response_time, count }) => (
                      <div key={feedback_response_time} className="bg-theme-card rounded-lg p-3 border border-theme-border text-center">
                        <p className="text-2xl font-bold text-theme-text">{count}</p>
                        <p className="text-xs text-theme-muted capitalize mt-1">
                          {feedback_response_time.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feedback */}
              {analytics.recentFeedback.length > 0 && (
                <div className="bg-theme-panel rounded-lg p-4 border border-theme-border">
                  <h3 className="font-semibold text-theme-text mb-4">Recent Feedback</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analytics.recentFeedback.map((feedback, idx) => (
                      <div key={idx} className="bg-theme-card rounded-lg p-4 border border-theme-border">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-theme-text">{feedback.name}</p>
                            {feedback.college && (
                              <p className="text-xs text-theme-muted flex items-center gap-1">
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
                        <div className="flex items-center gap-4 text-xs text-theme-muted mb-2">
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
                          <p className="text-sm text-theme-text italic break-words">"{feedback.feedback_comments}"</p>
                        )}
                        <p className="text-xs text-theme-muted mt-2">
                          Submitted {new Date(feedback.feedback_submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-theme-muted">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
              <p>No analytics data available</p>
            </div>
          )}
        </div>
      )}

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages sidebar */}
        <div className={`lg:col-span-1 bg-theme-card rounded-xl border border-theme-border overflow-hidden flex-col shadow-sm lg:h-[700px] ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 bg-theme-accent text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-white flex items-center">
                Messages
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-theme-accent text-xs font-bold">{pagination.total}</span>
              </h2>
              {bulkDeleteMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllConversations}
                    className="text-xs px-3 py-2 lg:px-2 lg:py-1 bg-white/20 hover:bg-white/30 text-white rounded font-medium"
                  >
                    {selectedConversations.size === messages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedConversations.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-xs px-3 py-2 lg:px-2 lg:py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                    >
                      Delete ({selectedConversations.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-theme-border lg:overflow-y-auto">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-8 h-8 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-theme-muted">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Mail size={40} strokeWidth={1.5} className="text-theme-muted/50 mx-auto mb-3" />
                <p className="text-theme-muted font-medium">No messages found</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`px-5 py-3.5 h-[114px] shrink-0 overflow-hidden cursor-pointer hover:bg-theme-panel transition-colors ${selectedMessage?.id === msg.id ? 'bg-[#F1F0FA] dark:bg-theme-panel' : msg.unread_count > 0 ? 'bg-theme-accent/5' : ''
                    }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {bulkDeleteMode && msg.student_id && (
                      <input
                        type="checkbox"
                        checked={selectedConversations.has(msg.student_id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleConversationSelection(msg.student_id);
                        }}
                        className="mt-1 w-4 h-4 text-theme-accent rounded focus:ring-theme-accent shrink-0"
                      />
                    )}
                    <div
                      onClick={() => !bulkDeleteMode && handleSelectMessage(msg)}
                      className="flex items-start gap-3 flex-1 min-w-0"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F1F0FA] dark:bg-theme-panel text-theme-accent">
                          {msg.unread_count > 0 ? <Mail size={18} /> : <MailOpen size={18} />}
                        </div>
                        {msg.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-theme-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-[15px] leading-5 truncate min-w-0 text-theme-text ${msg.unread_count > 0 ? 'font-bold' : 'font-semibold'}`}>{msg.name}</p>
                          <div className="shrink-0 ml-2 flex items-center gap-1.5">
                            {msg.image_path && <Paperclip size={12} className="text-theme-accent" />}
                            {parseInt(msg.unread_count) > 0 && (
                              <span className="px-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-[10px] leading-4 font-semibold">
                                {parseInt(msg.unread_count)} new
                              </span>
                            )}
                            <span className="text-xs text-theme-muted">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                        {msg.college && (
                          <p className="text-[12.5px] leading-[17px] mt-0.5 text-theme-accent flex items-center gap-1 font-medium min-w-0"><Building size={12} className="shrink-0" /><span className="truncate">{msg.college}</span></p>
                        )}
                        <p className="text-[13.5px] leading-5 mt-1 text-theme-muted line-clamp-2 break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {pagination.pages > 1 && (
            <div className="px-3 sm:px-4 py-3 border-t border-theme-border flex items-center justify-between sm:justify-center gap-3 flex-shrink-0 bg-theme-panel">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="min-h-[40px] px-4 py-2 text-sm font-semibold border border-theme-border rounded-lg bg-theme-card hover:bg-theme-panel disabled:opacity-50 text-theme-text"
              >Prev</button>
              <span className="text-sm text-theme-muted">Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="min-h-[40px] px-4 py-2 text-sm font-semibold border border-theme-border rounded-lg bg-theme-card hover:bg-theme-panel disabled:opacity-50 text-theme-text"
              >Next</button>
            </div>
          )}
        </div>


        {/* Message detail / Conversation */}
        <div className={`lg:col-span-2 bg-theme-card rounded-xl border border-theme-border overflow-hidden flex-col shadow-sm h-[calc(100dvh-7rem)] min-h-[420px] sm:h-[calc(100dvh-9rem)] lg:h-[700px] lg:min-h-0 ${selectedMessage ? 'flex' : 'hidden lg:flex'}`}>
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-theme-border bg-theme-panel flex items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setConversationThread([]);
                      setReplyMessage('');
                      removeImage();
                    }}
                    className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-theme-accent hover:bg-theme-card transition-colors"
                    aria-label="Back to messages"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-theme-accent/15 flex items-center justify-center text-theme-accent">
                    <User size={20} className="text-theme-accent" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-theme-text truncate">{selectedMessage.name}</h2>
                    {selectedMessage.college && (
                      <p className="text-xs text-theme-muted flex items-center gap-1 min-w-0">
                        <Building size={10} className="shrink-0" /><span className="truncate">{selectedMessage.college}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {selectedMessage.student_id && (
                    <button
                      onClick={closeConversation}
                      disabled={closingConversation}
                      className="p-3 lg:p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors disabled:opacity-50"
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
                    className="p-3 lg:p-2 text-theme-muted hover:text-red-600 hover:bg-theme-card rounded-lg transition-colors"
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
                    className="hidden lg:block p-2 text-theme-muted hover:text-theme-text hover:bg-theme-card rounded-lg transition-colors"
                    title="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4 bg-theme-page">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin"></div>
                  </div>
                ) : conversationThread.length === 0 ? (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-theme-card border border-theme-border p-4 rounded-xl rounded-tl-none shadow-sm">
                        <p className="text-theme-text whitespace-pre-wrap break-words">{selectedMessage.message}</p>
                        {selectedMessage.image_path && (
                          <div className="mt-3 relative group inline-block max-w-full">
                            <img
                              src={`${API_URL}${selectedMessage.image_path}`}
                              alt="Attachment"
                              className="max-h-60 sm:max-h-72 w-auto max-w-full rounded-lg object-contain bg-black/5 dark:bg-black/20 border border-theme-border cursor-pointer transition-all hover:opacity-90 hover:scale-[1.01]"
                              onClick={() => openImageModal(selectedMessage.image_path)}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-theme-muted mt-1 ml-1">{formatTime(selectedMessage.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  conversationThread.map((msg, index) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div key={msg.id || index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[80%] min-w-0 ${isAdmin ? 'order-2' : 'order-1'}`}>
                          {!isAdmin && <p className="text-xs text-theme-text font-medium mb-1 ml-1">{selectedMessage.name}</p>}
                          {isAdmin && <p className="text-xs text-theme-accent font-semibold mb-1 mr-1 text-right">Admin</p>}
                          <div className={`p-3 sm:p-4 rounded-xl shadow-sm ${isAdmin ? 'bg-theme-accent text-white rounded-tr-none' : 'bg-theme-card border border-theme-border text-theme-text rounded-tl-none'
                            }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            {msg.image_path && (
                              <div className="mt-3 relative group inline-block max-w-full">
                                <img
                                  src={`${API_URL}${msg.image_path}`}
                                  alt="Attachment"
                                  className="max-h-60 sm:max-h-72 w-auto max-w-full rounded-lg object-contain bg-black/5 dark:bg-black/20 border border-theme-border cursor-pointer transition-all hover:opacity-90 hover:scale-[1.01]"
                                  onClick={() => openImageModal(msg.image_path)}
                                />
                              </div>
                            )}
                          </div>
                          <p className={`text-xs text-theme-muted mt-1 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input */}
              <div className="border-t border-theme-border p-3 sm:p-4 bg-theme-card flex-shrink-0">
                <form onSubmit={sendReply} className="space-y-3">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Reply attachment preview" className="h-24 w-auto rounded-lg border border-theme-border" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-theme-card border border-theme-border text-theme-muted hover:text-red-600"
                        title="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative shrink-0 flex items-center" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="h-11 w-11 flex items-center justify-center rounded-xl border border-theme-border text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-colors cursor-pointer bg-theme-card shrink-0 box-border"
                        title="Add emoji"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 bg-theme-card border border-theme-border rounded-xl p-2 shadow-lg w-72 sm:w-80 max-w-[calc(100vw-3rem)] max-h-56 overflow-y-auto z-20">
                          <div className="grid grid-cols-8 gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="h-8 w-full rounded-md hover:bg-theme-panel text-lg"
                              >{emoji}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 w-11 flex items-center justify-center rounded-xl border border-theme-border text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-colors shrink-0 cursor-pointer bg-theme-card box-border"
                      title="Upload file or screenshot"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <div className="flex-1 min-w-0 flex items-center">
                      <textarea
                        ref={textareaRef}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onPaste={(e) => {
                          const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
                          const pastedFile = item?.getAsFile();
                          if (pastedFile) { e.preventDefault(); handleImageSelect(pastedFile); }
                        }}
                        placeholder="Type your reply..."
                        rows={1}
                        className="w-full h-11 py-2.5 px-3.5 rounded-xl border border-theme-border focus:border-theme-accent focus:ring-1 focus:ring-theme-accent outline-none text-sm resize-none bg-theme-card text-theme-text placeholder:text-theme-muted/70 block leading-normal box-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingReply || (!replyMessage.trim() && !selectedImage)}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-theme-accent text-white hover:bg-theme-accent2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer shrink-0 box-border"
                    >
                      {sendingReply ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-theme-card">
              <MessageCircle size={64} strokeWidth={1.5} className="text-theme-muted/40 mx-auto mb-4" />
              <p className="text-theme-text text-lg font-bold">Select a message to view conversation</p>
              <p className="text-theme-muted text-sm mt-1">Click on a message to view details and reply</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              onClick={() => setImageModalOpen(false)}
              aria-label="Close image preview"
            >
              <X size={22} />
            </button>
            <img
              src={imageUrl}
              alt="Full size attachment"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AdminLayout title="Student Support">
      {content}
    </AdminLayout>
  );
};

export default StudentMessages;
