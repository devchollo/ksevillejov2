import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Mail, User, Image as ImageIcon, X, Lock } from 'lucide-react';

const CommentSection = ({ 
  blogPostSlug, // Use slug - we'll convert to ID on backend
  commentType = 'blog', // 'blog' or 'transparency'
  userEmail = null, // For transparency pages
  onNeedVerification = null // Callback to trigger parent's verification modal
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canComment, setCanComment] = useState(true);
  const [canViewComments, setCanViewComments] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [commenterData, setCommenterData] = useState({
    name: '',
    email: '',
    image: '',
    notifyOnReplies: false
  });
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchComments();
  }, [blogPostSlug, commentType, userEmail]);

  const fetchComments = async () => {
    if (!blogPostSlug) return;
    
    try {
      setLoading(true);
      const url = `https://ksevillejov2.onrender.com/api/comments/${blogPostSlug}/${commentType}${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments || []);
        setCanComment(data.canComment);
        setCanViewComments(data.canViewComments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

const checkCommenterExists = async (email) => {
  if (!email || !blogPostSlug) return false;

  try {
    const response = await fetch('https://ksevillejov2.onrender.com/api/comments/check-commenter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, blogPostId: blogPostSlug, commentType })
    });

    const data = await response.json();
    if (data.success && data.exists) {
      setIsRegistered(true);
      setCommenterData(data.commenterData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Check commenter error:', error);
    return false;
  }
};

  const handleStartComment = () => {
    if (!blogPostSlug) {
      setError('Blog post not loaded yet. Please wait...');
      return;
    }

    // IMPROVED UX: For transparency pages, trigger parent verification modal if not verified
    if (commentType === 'transparency' && !userEmail) {
      if (onNeedVerification) {
        onNeedVerification(); // Trigger parent's verification modal
      } else {
        setError('Only donors can comment on transparency pages');
      }
      return;
    }

    if (commentType === 'transparency') {
      // Auto-fill email for transparency pages
      checkCommenterExists(userEmail).then(exists => {
        if (!exists) {
          setCommenterData({ ...commenterData, email: userEmail });
          setShowRegistrationModal(true);
        }
      });
    } else {
      setShowRegistrationModal(true);
    }
  };

 const handleRegisterCommenter = async () => {
  if (!blogPostSlug) {
    setError('Blog post not loaded yet');
    return;
  }

  try {
    setError('');

    if (!commenterData.name && !commenterData.email) {
      setError('Please provide at least a name or email');
      return;
    }

    if (commenterData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(commenterData.email)) {
        setError('Invalid email format');
        return;
      }

      // ✅ FIX: Check if email exists and auto-populate if so
      const exists = await checkCommenterExists(commenterData.email);
      if (exists) {
        // User already registered, just close modal
        return;
      }
    }

    // New user - validate and register
    const response = await fetch('https://ksevillejov2.onrender.com/api/comments/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...commenterData,
        blogPostId: blogPostSlug,
        commentType
      })
    });

    const data = await response.json();
    if (data.success) {
      setIsRegistered(true);
      setCommenterData(data.commenterData);
      setShowRegistrationModal(false);
    } else {
      setError(data.error || 'Registration failed');
    }
  } catch (error) {
    setError('Failed to register. Please try again.');
  }
};

  const handleSubmitComment = async () => {
    if (!blogPostSlug) {
      setError('Blog post not loaded yet');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSubmitting(true);

      if (!newComment.trim()) {
        setError('Comment cannot be empty');
        return;
      }

      if (newComment.length > 1000) {
        setError('Comment is too long (max 1000 characters)');
        return;
      }

      const response = await fetch('https://ksevillejov2.onrender.com/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPostSlug,
          commentType,
          commenterName: commenterData.name || 'Anonymous',
          commenterEmail: commenterData.email,
          commenterImage: commenterData.image,
          commentText: newComment,
          notifyOnReplies: commenterData.notifyOnReplies
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Comment posted successfully!');
        setNewComment('');
        fetchComments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (error) {
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render restriction message for transparency pages
  if (commentType === 'transparency' && !canComment && !canViewComments) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold">Donor Comments</h2>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-900 mb-2 font-semibold">
            🔒 Comments on transparency pages are visible only to donors
          </p>
          <p className="text-amber-800 text-sm mb-4">
            Donors who contributed to this campaign can share their thoughts and see other donor comments here.
          </p>
          {onNeedVerification && (
            <button
              onClick={onNeedVerification}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Verify as Donor
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold">
            {commentType === 'transparency' ? 'Donor Comments' : 'Comments'}
          </h2>
          {comments.length > 0 && (
            <span className="px-3 py-1 bg-stone-100 rounded-full text-sm font-semibold text-stone-600">
              {comments.length}
            </span>
          )}
        </div>
        {commentType === 'transparency' && canViewComments && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <Lock size={12} />
            Donor Only
          </span>
        )}
      </div>

      {/* Comment Form */}
      {canComment && (
        <div className="mb-8">
          {!isRegistered ? (
            <button
              onClick={handleStartComment}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Write a Comment
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {commenterData.image ? (
                    <img
                      src={commenterData.image}
                      alt={commenterData.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials(commenterData.name)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows="3"
                    maxLength="1000"
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-stone-500">
                      {newComment.length}/1000 characters
                    </span>
                    <button
                      onClick={handleSubmitComment}
                      disabled={submitting || !newComment.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send size={16} />
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-green-800 text-sm">
                  {success}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-stone-500 text-sm">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">
            {canComment ? 'Be the first to comment!' : 'No comments yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
              <div className="flex-shrink-0">
                {comment.commenterImage ? (
                  <img
                    src={comment.commenterImage}
                    alt={comment.commenterName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-stone-400 to-stone-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(comment.commenterName)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-stone-900">
                    {comment.commenterName}
                  </span>
                  <span className="text-xs text-stone-500">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {comment.commentText}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Join the Conversation</h3>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-stone-600 mb-6">
              Set up your profile to start commenting. Your email is optional but required for comment notifications.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <User size={16} />
                  Name {!commenterData.email && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={commenterData.name}
                  onChange={(e) => setCommenterData({ ...commenterData, name: e.target.value })}
                  placeholder="Your name or 'Anonymous'"
                  className="w-full px-4 py-2 bg-stone-50 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email <span className="text-stone-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={commenterData.email}
                  onChange={(e) => setCommenterData({ ...commenterData, email: e.target.value })}
                  placeholder="your@email.com"
                  disabled={commentType === 'transparency'}
                  className="w-full px-4 py-2 bg-stone-50 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors disabled:bg-stone-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Required for notifications. Not displayed publicly.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} />
                  Profile Image URL <span className="text-stone-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={commenterData.image}
                  onChange={(e) => setCommenterData({ ...commenterData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-stone-50 border-2 border-stone-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={commenterData.notifyOnReplies}
                  onChange={(e) => setCommenterData({ ...commenterData, notifyOnReplies: e.target.checked })}
                  disabled={!commenterData.email}
                  className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900">
                  <strong>Notify me of new comments</strong>
                  <br />
                  <span className="text-stone-500 text-xs">Receive email notifications when someone else comments on this {commentType === 'blog' ? 'post' : 'transparency page'}</span>
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleRegisterCommenter}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Continue to Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;