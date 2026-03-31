import { useState } from 'react';
import adminApi from '../../services/adminApi';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await adminApi.post('/auth/login', { email, password });
      if (!res.user?.isAdmin) {
        setError("Votre compte n'a pas les droits administrateur");
        return;
      }
      onLogin(res.user, res.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="admin-login-title">YnovConnect</h1>
            <p className="admin-login-sub">Panneau d'administration</p>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">Email administrateur</label>
            <input type="email" className="input-field" placeholder="admin@ynov.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 14 }} disabled={isLoading}>
            {isLoading ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> : 'Accéder au panel admin'}
          </button>
        </form>

        <p className="admin-login-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Accès réservé aux comptes avec droits admin
        </p>
      </div>
    </div>
  );
}
