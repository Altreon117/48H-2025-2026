import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import PostCard from '../components/PostCard';
import SuggestionPanel from './SuggestionPanel';
import MainHeader from '../components/MainHeader';
import './FeedPage.css';

function AvatarInitials({ name, size = 38 }) {
  const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

function NewsCard({ newsItem }) {
  const categoryLabels = { challenge: 'Challenge', bds: 'BDS', bde: 'BDE', general: 'Campus' };
  const categoryBadge = { challenge: 'badge-turquoise', bds: 'badge-blue', bde: 'badge-purple', general: 'badge-gray' };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
  return (
    <div className="news-card">
      <div className="news-card-header">
        <span className={`badge ${categoryBadge[newsItem.category] || 'badge-gray'}`}>{categoryLabels[newsItem.category] || 'News'}</span>
        {newsItem.eventDate && <span className="news-date">{formatDate(newsItem.eventDate)}</span>}
      </div>
      <h4 className="news-title">{newsItem.title}</h4>
      <p className="news-content">{newsItem.content}</p>
    </div>
  );
}

export default function FeedPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [news, setNews] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postError, setPostError] = useState('');
  const [pendingPosts, setPendingPosts] = useState([]);

  useEffect(() => {
    loadFeedData();
  }, []);

  useEffect(() => {
    socketService.onFeedNewPost((newPost) => {
      setPendingPosts(prev => [newPost, ...prev]);
    });
    return () => socketService.off('feed_new_post');
  }, []);

  const loadFeedData = async () => {
    try {
      const [postsResponse, newsResponse] = await Promise.all([
        apiService.get('/posts'),
        apiService.get('/news'),
      ]);
      setPosts(postsResponse.posts);
      setNews(newsResponse.news);
    } catch (error) {
      console.error('Erreur chargement feed:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const showPendingPosts = () => {
    setPosts(prev => [...pendingPosts, ...prev]);
    setPendingPosts([]);
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!newPostContent.trim()) return;
    setPostError('');
    setIsSubmitting(true);
    try {
      const response = await apiService.post('/posts', { content: newPostContent.trim() });
      setPosts(prev => [response.post, ...prev]);
      socketService.emitNewPost(response.post);
      setNewPostContent('');
    } catch (error) {
      setPostError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await apiService.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) { console.error(error); }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await apiService.post(`/posts/${postId}/like`, {});
      setPosts(prev => prev.map(post => post.id !== postId ? post : {
        ...post,
        likesCount: response.liked ? post.likesCount + 1 : post.likesCount - 1,
        isLikedByCurrentUser: response.liked ? 1 : 0,
      }));
    } catch (error) { console.error(error); }
  };

  const characterCount = newPostContent.length;
  const maxCharacters = 1000;

  return (
    <div className="feed-page-root">
      <MainHeader />
      <div className="page-container">
      {pendingPosts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <button className="new-posts-banner" onClick={showPendingPosts}>
            ↑ {pendingPosts.length} nouvelle{pendingPosts.length > 1 ? 's' : ''} publication{pendingPosts.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <div className="feed-layout">
        <aside className="feed-sidebar-left">
          <SuggestionPanel />
        </aside>

        <div className="feed-main">
          <div className="post-composer card">
            <div className="composer-top">
              <AvatarInitials name={currentUser?.fullName || currentUser?.username} size={38} />
              <textarea
                className="composer-textarea"
                placeholder="Partage une actualité, un projet ou une recherche..."
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                maxLength={maxCharacters}
              />
            </div>
            {postError && <div className="error-message" style={{ margin: '0 0 12px' }}>{postError}</div>}
            <div className="composer-footer">
              <span className={`char-count ${characterCount > 900 ? 'char-count-warning' : ''}`}>{characterCount}/{maxCharacters}</span>
              <button className="btn btn-primary" onClick={handleCreatePost} disabled={isSubmitting || !newPostContent.trim()}>
                {isSubmitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>

          {isLoadingPosts ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <p>Aucune publication pour l'instant.</p>
              <span>Sois le premier à partager quelque chose !</span>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={currentUser?.id} onDelete={handleDeletePost} onLike={handleLikePost} />
              ))}
            </div>
          )}
        </div>

        <aside className="feed-sidebar">
          <div className="news-panel card">
            <div className="news-panel-header">
              <h3 className="news-panel-title"><span className="news-indicator" />News Ynov Campus</h3>
            </div>
            <div className="news-list">
              {news.length === 0
                ? <p className="text-muted" style={{ padding: '14px 16px', fontSize: 13 }}>Aucune actualité</p>
                : news.map(item => <NewsCard key={item.id} newsItem={item} />)
              }
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
