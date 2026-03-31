import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import Modal from '../../components/Modal';
import { CAMPUS_LIST, FILIERE_LIST, PROMOTION_LIST } from '../../services/constants';
import './AdminCards.css';
import './CrudPage.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ name, size = 38 }) {
  const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="ac-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
      const res = await adminApi.get(`/admin/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      fullName: user.full_name || '',
      email: user.email || '',
      campus: user.campus || '',
      promotion: user.promotion || '',
      filiere: user.filiere || '',
      bio: user.bio || '',
      skills: user.skills || '',
      isAdmin: !!user.is_admin,
      newPassword: '',
    });
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      await adminApi.put(`/admin/users/${editUser.id}`, editForm);
      setEditUser(null);
      loadUsers();
    } catch (err) { setSaveError(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminApi.delete(`/admin/users/${deleteUser.id}`);
      setDeleteUser(null);
      loadUsers();
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1 className="page-title">Utilisateurs</h1>
        <p className="page-sub">{total} compte{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
      </div>

      <div className="crud-toolbar card">
        <input
          type="text"
          className="input-field crud-search"
          placeholder="Rechercher par nom, email, @pseudo…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <div className="ac-grid">
          {users.map(user => (
            <div key={user.id} className="ac-card card">
              <div className="ac-card-top">
                <Avatar name={user.full_name || user.username} size={42} />
                <div className="ac-card-identity">
                  <span className="ac-card-name">{user.full_name || user.username}</span>
                  <span className="ac-card-username">@{user.username}</span>
                </div>
                {user.is_admin
                  ? <span className="badge badge-turquoise ac-badge-role">Admin</span>
                  : <span className="badge badge-gray ac-badge-role">User</span>
                }
              </div>

              <div className="ac-card-meta">
                <span className="ac-meta-item">✉ {user.email}</span>
                {user.campus && <span className="ac-meta-item">📍 {user.campus}</span>}
                {user.promotion && <span className="badge badge-green ac-meta-badge">{user.promotion}</span>}
                {user.filiere && <span className="ac-meta-item ac-meta-dim">{user.filiere}</span>}
              </div>

              <div className="ac-card-footer">
                <span className="ac-card-date">Inscrit le {formatDate(user.created_at)}</span>
                <div className="ac-card-actions">
                  <button className="btn-action btn-edit" onClick={() => openEdit(user)}>Modifier</button>
                  <button className="btn-action btn-delete" onClick={() => setDeleteUser(user)}>Supprimer</button>
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

      {editUser && (
        <Modal title={`Modifier — @${editUser.username}`} onClose={() => setEditUser(null)} size="lg">
          {saveError && <div className="error-msg">{saveError}</div>}
          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="input-field" value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input-field" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Campus</label>
              <select className="input-field" value={editForm.campus} onChange={e => setEditForm(p => ({ ...p, campus: e.target.value }))}>
                <option value="">—</option>
                {CAMPUS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Promotion</label>
              <select className="input-field" value={editForm.promotion} onChange={e => setEditForm(p => ({ ...p, promotion: e.target.value }))}>
                <option value="">—</option>
                {PROMOTION_LIST.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Filière</label>
              <select className="input-field" value={editForm.filiere} onChange={e => setEditForm(p => ({ ...p, filiere: e.target.value }))}>
                <option value="">—</option>
                {FILIERE_LIST.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Bio</label>
              <textarea className="input-field" rows={3} value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Compétences</label>
              <input className="input-field" value={editForm.skills} onChange={e => setEditForm(p => ({ ...p, skills: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">
                Nouveau mot de passe <span style={{ fontWeight: 400, color: 'var(--color-text-dim)' }}>(vide = inchangé)</span>
              </label>
              <input type="password" className="input-field" value={editForm.newPassword} onChange={e => setEditForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm(p => ({ ...p, isAdmin: e.target.checked }))} />
                Droits administrateur
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
          </div>
        </Modal>
      )}

      {deleteUser && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteUser(null)} size="sm">
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Supprimer <strong>@{deleteUser.username}</strong> ? Action irréversible — tous ses posts et messages seront supprimés.
          </p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setDeleteUser(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
