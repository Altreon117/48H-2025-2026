import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
import './PostCard.css';

function AvatarInitials({ name, size = 40 }) {
  const initials = (name || '?').split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

const IconHeart = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const IconComment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

const IconSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function PostCard({ post, currentUserId, onDelete, onLike }) {
  const isOwner = post.userId === currentUserId || post.user_id === currentUserId;
  const isLiked = Boolean(post.isLikedByCurrentUser);
  const displayName = post.authorFullName || post.authorUsername;

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const inputRef = useRef(null);

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const res = await apiService.get(`/posts/${post.id}/comments`);
        setComments(res.comments);
        setCommentsLoaded(true);
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }
    if (next) setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiService.post(`/posts/${post.id}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, res.comment]);
      setCommentsCount(c => c + 1);
      setCommentText('');
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiService.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(c => c - 1);
    } catch {
      // fail silently
    }
  };

  return (
    <div className="post-card card fade-in">
      <div className="post-header">
        <Link to={`/profile/${post.authorUsername}`} className="post-author-link">
          <AvatarInitials name={displayName} size={40} />
          <div className="post-author-info">
            <span className="post-author-name">{displayName}</span>
            <div className="post-meta">
              {post.authorPromotion && (
                <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 7px' }}>{post.authorPromotion}</span>
              )}
              <span className="post-time">{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </Link>
        {isOwner && (
          <button className="btn btn-ghost post-delete-btn" onClick={() => onDelete(post.id)} title="Supprimer">
            <IconTrash />
          </button>
        )}
      </div>

      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button
          className={`post-action-btn ${isLiked ? 'post-action-liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          <IconHeart filled={isLiked} />
          <span>{post.likesCount || 0}</span>
        </button>
        <button
          className={`post-action-btn ${commentsOpen ? 'post-action-active' : ''}`}
          onClick={toggleComments}
        >
          <IconComment />
          <span>{commentsCount}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="post-comments">
          {commentsLoading ? (
            <div className="comments-loading">
              <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="comments-empty">Aucun commentaire. Sois le premier !</p>
              )}
              <div className="comments-list">
                {comments.map(comment => {
                  const isCommentOwner = comment.userId === currentUserId;
                  const commentName = comment.authorFullName || comment.authorUsername;
                  return (
                    <div key={comment.id} className="comment-item">
                      <AvatarInitials name={commentName} size={30} />
                      <div className="comment-body">
                        <div className="comment-header">
                          <Link to={`/profile/${comment.authorUsername}`} className="comment-author">
                            {commentName}
                          </Link>
                          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                          {isCommentOwner && (
                            <button
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                              title="Supprimer"
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <AvatarInitials name={displayName} size={30} />
            <div className="comment-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="comment-input"
                placeholder="Écrire un commentaire…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                autoComplete="off"
              />
              <button
                type="submit"
                className="comment-send-btn"
                disabled={!commentText.trim() || submitting}
                title="Envoyer"
              >
                <IconSend />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
