import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const IconYnov = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/feed');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-icon"><IconYnov /></div>
            <span className="auth-brand-title">Ynov<span>Connect</span></span>
          </div>
          <p className="auth-brand-tagline">Le réseau social <span className="auth-brand-accent">exclusif</span> de ton campus.</p>
          <p className="auth-brand-sub">Connecte-toi avec tes camarades, partage tes projets et explore les opportunités Ynov.</p>
          <div className="auth-features">
            <div className="auth-feature"><span className="auth-feature-dot" /> Fil d'actualité en temps réel</div>
            <div className="auth-feature"><span className="auth-feature-dot" /> Messagerie privée instantanée</div>
            <div className="auth-feature"><span className="auth-feature-dot" /> Offres stages & alternances Ymatch</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container fade-in">
          <div className="auth-header">
            <h2 className="auth-title">Bon retour 👋</h2>
            <p className="auth-subtitle">Connecte-toi à ton espace campus</p>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input-field" placeholder="ton.email@ynov.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner" style={{ width: 17, height: 17, borderWidth: 2 }} /> : 'Se connecter'}
            </button>
          </form>

          <p className="auth-switch">Pas encore de compte ? <Link to="/register" className="auth-link">Créer un compte</Link></p>
        </div>
      </div>
    </div>
  );
}
