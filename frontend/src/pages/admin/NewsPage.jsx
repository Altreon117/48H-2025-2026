import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import Modal from '../../components/Modal';
import './CrudPage.css';

const EMPTY_FORM = { title: '', content: '', category: 'general', eventDate: '' };

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

function toInputDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get('/admin/news');
      setNews(res.news);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };

  const openEdit = (item) => {
    setSelectedNews(item);
    setForm({ title: item.title, content: item.content, category: item.category, eventDate: toInputDate(item.event_date) });
    setError('');
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title || !form.content) { setError('Titre et contenu requis'); return; }
    setError('');
    setIsSaving(true);
    try {
      if (modal === 'create') {
        await adminApi.post('/admin/news', { title: form.title, content: form.content, category: form.category, eventDate: form.eventDate || null });
      } else {
        await adminApi.put(`/admin/news/${selectedNews.id}`, { title: form.title, content: form.content, category: form.category, eventDate: form.eventDate || null });
      }
      setModal(null);
      loadNews();
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminApi.delete(`/admin/news/${selectedNews.id}`);
      setModal(null);
      loadNews();
    } catch (err) { alert(err.message); }
  };

  const categoryLabel = { challenge: 'Challenge', bds: 'BDS', bde: 'BDE', general: 'Campus' };
  const categoryBadge = { challenge: 'badge-turquoise', bds: 'badge-green', bde: 'badge-gray', general: 'badge-gray' };

  return (
    <div className="crud-page">
      <div className="page-header-row" style={{ marginBottom: '12px' }}>
        <div className="page-header">
          <h1 className="page-title">Actualités</h1>
          <p className="page-sub">{news.length} actualité{news.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ borderRadius: '50px', padding: '8px 20px' }}>
          + Nouvelle actualité
        </button>
      </div>

      <div className="card crud-table-card">
        {isLoading ? <div className="loading-container"><div className="loading-spinner" /></div> : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Titre</th><th>Catégorie</th><th>Date événement</th><th>Créé le</th><th>Actions</th></tr></thead>
              <tbody>
                {news.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>
                      <span className="table-content-preview" style={{ maxWidth: '280px' }}>{item.title}</span>
                    </td>
                    <td><span className={`badge ${categoryBadge[item.category] || 'badge-gray'}`}>{categoryLabel[item.category] || item.category}</span></td>
                    <td className="table-dim">{formatDate(item.event_date)}</td>
                    <td className="table-dim">{formatDate(item.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-action btn-edit" onClick={() => openEdit(item)}>Modifier</button>
                        <button className="btn-action btn-delete" onClick={() => { setSelectedNews(item); setModal('delete'); }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Nouvelle actualité' : 'Modifier l\'actualité'} onClose={() => setModal(null)}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'actualité" />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Contenu *</label>
            <textarea className="input-field" rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Décrivez l'actualité…" />
          </div>

          <div className="modal-form-grid" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="general">Campus (général)</option>
                <option value="challenge">Challenge</option>
                <option value="bds">BDS — Sport</option>
                <option value="bde">BDE — Événements</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date de l'événement</label>
              <input type="date" className="input-field" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ borderRadius: '50px' }}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ borderRadius: '50px' }}>
              {isSaving ? 'Sauvegarde…' : modal === 'create' ? 'Créer' : 'Sauvegarder'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Confirmer la suppression" onClose={() => setModal(null)} size="sm">
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Supprimer <strong>"{selectedNews?.title}"</strong> ? Action irréversible.
          </p>
          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setModal(null)} style={{ borderRadius: '50px' }}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete} style={{ borderRadius: '50px' }}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}