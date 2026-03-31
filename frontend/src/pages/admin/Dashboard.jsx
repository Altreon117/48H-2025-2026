import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import './CrudPage.css';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-icon" style={{ background: color + '18', color, boxShadow: `0 4px 12px ${color}33` }}>
        {icon}
      </div>
      <div className="stat-card-info">
        <div className="stat-card-value">{value ?? '—'}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="loading-container"><div className="loading-spinner" /></div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Vue d'ensemble de la plateforme YnovConnect</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Utilisateurs" value={data?.stats.users} color="#1cb1b3"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>}
        />
        <StatCard label="Publications" value={data?.stats.posts} color="#6f42c1"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
        />
        <StatCard label="Messages" value={data?.stats.messages} color="#fd7e14"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
        />
        <StatCard label="Actualités" value={data?.stats.news} color="#28a745"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>}
        />
        <StatCard label="Likes" value={data?.stats.likes} color="#dc3545"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>}
        />
      </div>

      <div className="dashboard-tables">
        <div className="card dashboard-table-card">
          <div className="dashboard-table-header">
            <h2 className="dashboard-table-title">Derniers utilisateurs inscrits</h2>
          </div>
          <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Utilisateur</th><th>Email</th><th>Campus</th><th>Admin</th><th>Inscrit le</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.recentUsers.map(user => (
                <tr key={user.id}>
                  <td><div className="table-user"><div className="table-avatar">{(user.username || 'U')[0].toUpperCase()}</div><span>{user.full_name || user.username}</span></div></td>
                  <td>{user.email}</td>
                  <td><span className="badge badge-gray">{user.campus || '—'}</span></td>
                  <td>{user.is_admin ? <span className="badge badge-turquoise">Admin</span> : <span className="badge badge-gray">User</span>}</td>
                  <td className="table-dim">{formatDate(user.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-action btn-edit" onClick={() => navigate('/admin/users')} title="Gérer l'utilisateur">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="card dashboard-table-card">
          <div className="dashboard-table-header">
            <h2 className="dashboard-table-title">Dernières publications</h2>
          </div>
          <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Auteur</th><th>Contenu</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.recentPosts.map(post => (
                <tr key={post.id}>
                  <td><span className="table-username">@{post.username}</span></td>
                  <td><span className="table-content-preview">{post.content}</span></td>
                  <td className="table-dim">{formatDate(post.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-action btn-delete" onClick={() => navigate('/admin/posts')} title="Voir pour supprimer">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}