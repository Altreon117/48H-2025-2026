import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import Modal from '../../components/Modal';
import './AdminCards.css';
import './CrudPage.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="ac-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editPost, setEditPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [editForm, setEditForm] = useState({ content: '', category: 'general' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deleteComment, setDeleteComment] = useState(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
      const res = await adminApi.get(`/admin/posts?${params}`);
      setPosts(res.posts);
      setTotal(res.total);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, search]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openEdit = (post) => {
    setEditPost(post);
    setEditForm({ content: post.content, category: post.category || 'general' });
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      await adminApi.put(`/admin/posts/${editPost.id}`, editForm);
      setEditPost(null);
      loadPosts();
    } catch (err) { setSaveError(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminApi.delete(`/admin/posts/${deletePost.id}`);
      setDeletePost(null);
      loadPosts();
    } catch (err) { alert(err.message); }
  };

  const openComments = async (post) => {
    setCommentsPost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await adminApi.get(`/admin/posts/${post.id}/comments`);
      setComments(res.comments);
    } catch (err) { console.error(err); }
    finally { setCommentsLoading(false); }
  };

  const handleDeleteComment = async () => {
    try {
      await adminApi.delete(`/admin/posts/${commentsPost.id}/comments/${deleteComment.id}`);
      setComments(prev => prev.filter(c => c.id !== deleteComment.id));
      setDeleteComment(null);
      setPosts(prev => prev.map(p =>
        p.id === commentsPost.id ? { ...p, comments_count: p.comments_count - 1 } : p
      ));
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1 className="page-title">Publications</h1>
        <p className="page-sub">{total} publication{total > 1 ? 's' : ''}</p>
      </div>

      <div className="crud-toolbar card">
        <input
          type="text"
          className="input-field crud-search"
          placeholder="Rechercher dans le contenu…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <div className="ac-list">
          {posts.map(post => (
            <div key={post.id} className="ac-post-card card">
              <div className="ac-post-header">
                <Avatar name={post.full_name || post.username} size={36} />
                <div className="ac-card-identity">
                  <span className="ac-card-name">{post.full_name || post.username}</span>
                  <span className="ac-card-username">@{post.username}</span>
                </div>
                <span className="ac-post-date">{formatDate(post.created_at)}</span>
              </div>

              <p className="ac-post-content">{post.content}</p>

              <div className="ac-post-footer">
                <div className="ac-post-meta">
                  <span className="badge badge-gray">{post.category || 'general'}</span>
                  <span className="ac-meta-stat">♥ {post.likes_count || 0}</span>
                  <button className="ac-comments-btn" onClick={() => openComments(post)}>
                    💬 {post.comments_count || 0} commentaire{post.comments_count !== 1 ? 's' : ''}
                  </button>
                </div>
                <div className="ac-card-actions">
                  <button className="btn-action btn-edit" onClick={() => openEdit(post)}>Modifier</button>
                  <button className="btn-action btn-delete" onClick={() => setDeletePost(post)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="crud-pagination card">
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span className="pagination-info">Page {page} / {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      {/* ── Modal modifier ── */}
      {editPost && (
        <Modal title="Modifier la publication" onClose={() => setEditPost(null)}>
          {saveError && <div className="error-msg">{saveError}</div>}
          <div className="form-group">
            <label className="form-label">Contenu</label>
            <textarea className="input-field" rows={6} value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select className="input-field" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
              <option value="general">General</option>
              <option value="projet">Projet</option>
              <option value="recherche">Recherche</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setEditPost(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
          </div>
        </Modal>
      )}

      {/* ── Modal supprimer post ── */}
      {deletePost && (
        <Modal title="Confirmer la suppression" onClose={() => setDeletePost(null)} size="sm">
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Supprimer ce post de <strong>@{deletePost.username}</strong> ? Action irréversible.
          </p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setDeletePost(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
          </div>
        </Modal>
      )}

      {/* ── Modal commentaires ── */}
      {commentsPost && (
        <Modal title={`Commentaires — @${commentsPost.username}`} onClose={() => { setCommentsPost(null); setDeleteComment(null); }} size="md">
          <div className="post-preview-block">
            <p className="post-preview-content">{commentsPost.content}</p>
          </div>

          {commentsLoading ? (
            <div className="loading-container" style={{ padding: '24px 0' }}><div className="loading-spinner" /></div>
          ) : comments.length === 0 ? (
            <p className="comments-admin-empty">Aucun commentaire sur ce post.</p>
          ) : (
            <div className="comments-admin-list">
              {comments.map(comment => (
                <div key={comment.id} className="comments-admin-item">
                  <div className="comments-admin-meta">
                    <span className="comments-admin-author">{comment.full_name || comment.username}</span>
                    <span className="comments-admin-username">@{comment.username}</span>
                    <span className="comments-admin-date">{formatDate(comment.created_at)}</span>
                    <button className="btn-action btn-delete comments-admin-delete" onClick={() => setDeleteComment(comment)}>
                      Supprimer
                    </button>
                  </div>
                  <p className="comments-admin-content">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => { setCommentsPost(null); setDeleteComment(null); }}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* ── Modal confirmer suppression commentaire ── */}
      {deleteComment && (
        <Modal title="Supprimer le commentaire ?" onClose={() => setDeleteComment(null)} size="sm">
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Supprimer le commentaire de <strong>@{deleteComment.username}</strong> ? Action irréversible.
          </p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setDeleteComment(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDeleteComment}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
