import { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, Clock, Send } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [helpful, setHelpful] = useState(null);
  const [responseTime, setResponseTime] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    if (helpful === null) {
      alert('Please let us know if the help was useful');
      return;
    }

    if (!responseTime) {
      alert('Please rate the response time');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ rating, helpful, responseTime, comments });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-shnoor-indigo text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Help Us Improve</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Your conversation with support has been closed
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your support experience? <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Very Good'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Helpful */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Was the admin's help useful? <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHelpful(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  helpful === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <ThumbsUp size={20} />
                <span className="font-medium">Yes, helpful</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpful(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  helpful === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <ThumbsDown size={20} />
                <span className="font-medium">Not helpful</span>
              </button>
            </div>
          </div>

          {/* Response Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How was the response time? <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'very_fast', label: 'Very Fast', emoji: '⚡' },
                { value: 'fast', label: 'Fast', emoji: '🚀' },
                { value: 'average', label: 'Average', emoji: '👍' },
                { value: 'slow', label: 'Slow', emoji: '🐌' },
                { value: 'very_slow', label: 'Very Slow', emoji: '😴' }
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResponseTime(value)}
                  className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 transition-all ${
                    responseTime === value
                      ? 'border-shnoor-indigo bg-shnoor-indigo/10 text-shnoor-indigo'
                      : 'border-gray-300 hover:border-shnoor-indigo/50'
                  }`}
                >
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-xs font-medium text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comments.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0 || helpful === null || !responseTime}
              className="flex-1 px-4 py-3 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
