import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import { CAMPUS_LIST, FILIERE_LIST, PROMOTION_LIST, USERNAME_REGEX, validatePasswordClient, getPasswordStrength } from '../services/constants';
import './AuthPage.css';

/* ===== ICONS ===== */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconEye = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ===== OPTION PICKER (pills) ===== */
function OptionPicker({ label, placeholder, options, value, onChange, name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt } });
    setOpen(false);
  };

  return (
    <div className="option-picker" ref={ref}>
      <button
        type="button"
        className={`option-picker-trigger ${value ? 'option-picker-trigger--selected' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className={value ? '' : 'option-picker-placeholder'}>
          {value || placeholder}
        </span>
        <svg className={`option-picker-chevron ${open ? 'option-picker-chevron--open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="option-picker-dropdown">
          <div className="option-picker-pills">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                className={`option-pill ${value === opt ? 'option-pill--active' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {value === opt && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function AuthHeader({ campus }) {
  return (
    <div className="auth-topbar">
      <div className="auth-topbar-logo">
        <img
          src="/logo-ynovconnect.png"
          alt="YnovConnect"
          className="auth-logo-img"
        />
        <span className="auth-logo-name">YnovConnect</span>
      </div>
      {campus && <span className="auth-topbar-campus">{campus}</span>}
    </div>
  );
}

function AuthAvatar({ tab }) {
  return (
    <div className="auth-hero">
      <div className="auth-avatar-ring">
        <div className="auth-avatar-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>
      <h1 className="auth-hero-title">
        {tab === 'login' ? 'Bon retour 👋' : 'Rejoins le campus 🎓'}
      </h1>
      <p className="auth-hero-sub">
        {tab === 'login'
          ? 'Connecte-toi avec ton adresse Ynov'
          : 'Crée ton profil étudiant en 30 secondes'}
      </p>
    </div>
  );
}

function TabToggle({ active, onChange }) {
  return (
    <div className="auth-tabs">
      <button
        type="button"
        className={`auth-tab ${active === 'login' ? 'auth-tab-active' : ''}`}
        onClick={() => onChange('login')}
      >
        Connexion
      </button>
      <button
        type="button"
        className={`auth-tab ${active === 'register' ? 'auth-tab-active' : ''}`}
        onClick={() => onChange('register')}
      >
        Inscription
      </button>
    </div>
  );
}

function InputField({ icon, type = 'text', placeholder, value, onChange, name, required, autoComplete, rightElement, className = '' }) {
  return (
    <div className={`auth-input-wrapper ${className}`}>
      {icon && <span className="auth-input-icon">{icon}</span>}
      <input
        type={type}
        name={name}
        className="auth-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
      {rightElement && <span className="auth-input-right">{rightElement}</span>}
    </div>
  );
}

/* ===== LOGIN FORM ===== */
function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@ynov.com')) {
      return setError('Uniquement les adresses @ynov.com sont acceptées');
    }

    setIsLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="auth-error">{error}</div>}

      <div className="form-group">
        <label className="auth-label">Adresse e-mail</label>
        <InputField
          icon={<IconMail />}
          type="email"
          name="email"
          placeholder="prenom.nom@ynov.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <span className="auth-hint">Uniquement les adresses @ynov.com</span>
      </div>

      <div className="form-group">
        <div className="auth-label-row">
          <label className="auth-label">Mot de passe</label>
          <button type="button" className="auth-forgot">Mot de passe oublié ?</button>
        </div>
        <InputField
          icon={<IconLock />}
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="••••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          rightElement={
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
              <IconEye open={showPassword} />
            </button>
          }
        />
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
        {isLoading
          ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} />
          : '→ Se connecter'}
      </button>

      <div className="auth-security-badge">
        <IconShield />
        <div>
          <strong>Accès sécurisé</strong>
          <span>Hachage bcrypt — Réservé aux étudiants Ynov</span>
        </div>
      </div>
    </form>
  );
}

/* ===== REGISTER FORM ===== */
function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    username: '', email: '', password: '',
    promotion: '', campus: '', filiere: '',
    acceptCGU: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const usernameDebounce = useRef(null);
  const { register } = useAuth();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'username') {
      const cleaned = value.replace(/\s/g, '');
      setFormData(prev => ({ ...prev, username: cleaned }));
      checkUsername(cleaned);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'password') {
      setPasswordStrength(value ? getPasswordStrength(value) : null);
    }
  };

  const checkUsername = (username) => {
    clearTimeout(usernameDebounce.current);
    if (username.length < 3) { setUsernameStatus(null); return; }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus({ available: false, message: 'Format invalide' });
      return;
    }
    usernameDebounce.current = setTimeout(async () => {
      try {
        const res = await apiService.get(`/auth/check-username/${username}`);
        setUsernameStatus(res);
      } catch { setUsernameStatus(null); }
    }, 500);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email.toLowerCase().endsWith('@ynov.com')) {
      return setError("L'adresse email doit être @ynov.com");
    }
    if (!USERNAME_REGEX.test(formData.username)) {
      return setError("Nom d'utilisateur invalide");
    }
    if (usernameStatus && !usernameStatus.available) {
      return setError(usernameStatus.message);
    }
    const pwErrors = validatePasswordClient(formData.password);
    if (pwErrors.length > 0) {
      return setError(`Mot de passe : ${pwErrors.join(', ')}`);
    }
    if (!formData.acceptCGU) {
      return setError("Vous devez accepter les conditions d'utilisation");
    }

    setIsLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        promotion: formData.promotion,
        campus: formData.campus,
        filiere: formData.filiere,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const strengthColors = { weak: '#dc3545', medium: '#fd7e14', strong: '#1cb1b3' };
  const strengthWidth = { weak: '33%', medium: '66%', strong: '100%' };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-form-row">
        <div className="form-group">
          <label className="auth-label">Prénom</label>
          <input type="text" name="firstName" className="auth-input auth-input-solo" placeholder="Marie" value={formData.firstName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="auth-label">Nom</label>
          <input type="text" name="lastName" className="auth-input auth-input-solo" placeholder="Dupont" value={formData.lastName} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label className="auth-label">Adresse e-mail Ynov</label>
        <InputField
          icon={<IconMail />}
          type="email"
          name="email"
          placeholder="prenom.nom@ynov.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label className="auth-label">Filière</label>
        <OptionPicker
          name="filiere"
          placeholder="Informatique / Design / …"
          options={FILIERE_LIST}
          value={formData.filiere}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="auth-label">Campus</label>
        <OptionPicker
          name="campus"
          placeholder="Sélectionne ton campus"
          options={CAMPUS_LIST}
          value={formData.campus}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="auth-label">Niveau d'études</label>
        <OptionPicker
          name="promotion"
          placeholder="B1 / B2 / M1 / …"
          options={PROMOTION_LIST}
          value={formData.promotion}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="auth-label">Nom d'utilisateur</label>
        <InputField
          icon={<IconUser />}
          name="username"
          placeholder="marie.dupont"
          value={formData.username}
          onChange={handleChange}
          required
          autoComplete="username"
          className={usernameStatus ? (usernameStatus.available ? 'input-valid' : 'input-invalid') : ''}
        />
        {usernameStatus && (
          <span className={`auth-field-status ${usernameStatus.available ? 'status-ok' : 'status-error'}`}>
            {usernameStatus.available ? '✓' : '✗'} {usernameStatus.message}
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="auth-label">Mot de passe</label>
        <InputField
          icon={<IconLock />}
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Min. 8 caractères"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          className={passwordStrength && formData.password.length > 0 && validatePasswordClient(formData.password).length > 0 ? 'input-invalid' : ''}
          rightElement={
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
              <IconEye open={showPassword} />
            </button>
          }
        />
        {passwordStrength && (
          <div className="auth-strength">
            <div className="auth-strength-bar">
              <div className="auth-strength-fill" style={{ width: strengthWidth[passwordStrength.level], background: strengthColors[passwordStrength.level] }} />
            </div>
            <span className="auth-strength-label" style={{ color: strengthColors[passwordStrength.level] }}>
              {passwordStrength.label}
            </span>
          </div>
        )}
        {passwordStrength && validatePasswordClient(formData.password).length > 0 && (
          <span className="auth-hint auth-hint-error">
            Ajoute {validatePasswordClient(formData.password)[0]}
          </span>
        )}
      </div>

      <label className="auth-cgu">
        <input type="checkbox" name="acceptCGU" checked={formData.acceptCGU} onChange={handleChange} />
        <span>
          J'accepte les <button type="button" className="auth-cgu-link">conditions d'utilisation</button> et la{' '}
          <button type="button" className="auth-cgu-link">politique de confidentialité</button>
        </span>
      </label>

      <button type="submit" className="auth-submit-btn" disabled={isLoading || (usernameStatus && !usernameStatus.available)}>
        {isLoading
          ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} />
          : '→ Créer mon compte'}
      </button>

      <div className="auth-security-badge">
        <IconShield />
        <div>
          <strong>Mot de passe haché (bcrypt)</strong>
          <span>Jamais stocké en clair</span>
        </div>
      </div>
    </form>
  );
}

/* ===== PAGE PRINCIPALE ===== */
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  // Récupérer le campus depuis l'URL ou le localStorage
  const campus = localStorage.getItem('selectedCampus') || '';

  const handleSuccess = () => {
    navigate('/feed');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthHeader campus={campus || 'Paris Ynov'} />
        <div className="auth-card-body">
          <AuthAvatar tab={activeTab} />
          <TabToggle active={activeTab} onChange={setActiveTab} />

          <div className="auth-form-panel">
            {activeTab === 'login'
              ? <LoginForm key="login" onSuccess={handleSuccess} />
              : <RegisterForm key="register" onSuccess={handleSuccess} />
            }
          </div>

          <p className="auth-switch-text">
            {activeTab === 'login'
              ? <>Pas encore de compte ? <button type="button" className="auth-switch-btn" onClick={() => setActiveTab('register')}>Créer un compte</button></>
              : <>Déjà un compte ? <button type="button" className="auth-switch-btn" onClick={() => setActiveTab('login')}>Se connecter</button></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
