import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import Modal from '../../components/Modal';
import './CrudPage.css';

function formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 30;

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
      const res = await adminApi.get(`/admin/messages?${params}`);
      setMessages(res.messages);
      setTotal(res.total);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, search]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleDelete = async () => {
    try {
      await adminApi.delete(`/admin/messages/${deleteMsg.id}`);
      setDeleteMsg(null);
      loadMessages();
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1 className="page-title">Messages privés</h1>
        <p className="page-sub">{total} message{total > 1 ? 's' : ''} — lecture et modération uniquement</p>
      </div>

      <div className="crud-toolbar card">
        <input type="text" className="input-field crud-search" placeholder="Rechercher dans le contenu…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <div className="moderation-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          Accès modération uniquement — les messages ne peuvent pas être modifiés
        </div>
      </div>

      <div className="card crud-table-card">
        {isLoading ? <div className="loading-container"><div className="loading-spinner" /></div> : (
          <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Expéditeur</th><th>Destinataire</th><th>Message</th><th>Lu</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg.id}>
                  <td><div className="table-user"><div className="table-avatar">{(msg.sender_username || 'S')[0].toUpperCase()}</div><div><div style={{ fontWeight: 600 }}>{msg.sender_full_name || msg.sender_username}</div><div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>@{msg.sender_username}</div></div></div></td>
                  <td><div className="table-user"><div className="table-avatar">{(msg.receiver_username || 'R')[0].toUpperCase()}</div><div><div style={{ fontWeight: 600 }}>{msg.receiver_full_name || msg.receiver_username}</div><div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>@{msg.receiver_username}</div></div></div></td>
                  <td><span className="table-content-preview">{msg.content}</span></td>
                  <td>{msg.is_read ? <span className="badge badge-green">Lu</span> : <span className="badge badge-gray">Non lu</span>}</td>
                  <td className="table-dim">{formatDate(msg.created_at)}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteMsg(msg)}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="crud-pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
            <span className="pagination-info">Page {page} / {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
          </div>
        )}
      </div>

      {deleteMsg && (
        <Modal title="Supprimer ce message" onClose={() => setDeleteMsg(null)} size="sm">
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Supprimer ce message de <strong>@{deleteMsg.sender_username}</strong> ? Action irréversible.</p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setDeleteMsg(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
