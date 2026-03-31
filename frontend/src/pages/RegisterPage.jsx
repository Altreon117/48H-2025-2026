import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import { CAMPUS_LIST, FILIERE_LIST, PROMOTION_LIST, USERNAME_REGEX, validatePasswordClient, getPasswordStrength } from '../services/constants';
import './AuthPage.css';

const IconYnov = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '',
        fullName: '', promotion: '', campus: '', filiere: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const usernameDebounceRef = useRef(null);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;

        // Bloquer les espaces pour le username
        if (name === 'username') {
            const cleaned = value.replace(/\s/g, '');
            setFormData(prev => ({ ...prev, username: cleaned }));
            checkUsernameAvailability(cleaned);
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordStrength(value ? getPasswordStrength(value) : null);
        }
    };

    const checkUsernameAvailability = (username) => {
        clearTimeout(usernameDebounceRef.current);
        if (username.length < 3) { setUsernameStatus(null); return; }

        if (!USERNAME_REGEX.test(username)) {
            setUsernameStatus({ available: false, message: 'Format invalide (lettres, chiffres, . - _)' });
            return;
        }

        usernameDebounceRef.current = setTimeout(async () => {
            try {
                const response = await apiService.get(`/auth/check-username/${username}`);
                setUsernameStatus(response);
            } catch { setUsernameStatus(null); }
        }, 500);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        if (!formData.email.toLowerCase().endsWith('@ynov.com')) {
            return setErrorMessage("L'adresse email doit être une adresse @ynov.com");
        }

        if (!USERNAME_REGEX.test(formData.username)) {
            return setErrorMessage("Le nom d'utilisateur est invalide (3-30 caractères, pas d'espaces)");
        }

        if (usernameStatus && !usernameStatus.available) {
            return setErrorMessage(usernameStatus.message);
        }

        const passwordErrors = validatePasswordClient(formData.password);
        if (passwordErrors.length > 0) {
            return setErrorMessage(`Mot de passe trop faible. Il faut : ${passwordErrors.join(', ')}.`);
        }

        setIsLoading(true);
        try {
            await register(formData);
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
                    <p className="auth-brand-tagline">Rejoins la communauté <span className="auth-brand-accent">exclusive</span> de ton campus.</p>
                    <p className="auth-brand-sub">Connecte-toi avec tes camarades, partage tes projets et explore les opportunités Ynov.</p>
                    <div className="auth-features">
                        <div className="auth-feature"><span className="auth-feature-dot" />Réservé aux adresses @ynov.com</div>
                        <div className="auth-feature"><span className="auth-feature-dot" />13 campus disponibles</div>
                        <div className="auth-feature"><span className="auth-feature-dot" />10 filières reconnues</div>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-container fade-in">
                    <div className="auth-header">
                        <h2 className="auth-title">Créer un compte</h2>
                        <p className="auth-subtitle">Adresse @ynov.com obligatoire</p>
                    </div>

                    {errorMessage && <div className="error-message">{errorMessage}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nom complet</label>
                                <input type="text" name="fullName" className="input-field" placeholder="Jean Dupont" value={formData.fullName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Promotion</label>
                                <select name="promotion" className="input-field" value={formData.promotion} onChange={handleChange}>
                                    <option value="">Promo</option>
                                    {PROMOTION_LIST.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nom d'utilisateur *</label>
                            <div className="input-with-status">
                                <input
                                    type="text"
                                    name="username"
                                    className={`input-field ${usernameStatus ? (usernameStatus.available ? 'input-valid' : 'input-invalid') : ''}`}
                                    placeholder="jean.dupont (sans espaces)"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    autoComplete="username"
                                />
                                {usernameStatus && (
                                    <span className={`input-status-text ${usernameStatus.available ? 'status-ok' : 'status-error'}`}>
                                        {usernameStatus.available ? '✓' : '✗'} {usernameStatus.message}
                                    </span>
                                )}
                            </div>
                            <span className="form-hint">Lettres, chiffres, point, tiret, underscore uniquement</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email @ynov.com *</label>
                            <input type="email" name="email" className="input-field" placeholder="prenom.nom@ynov.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mot de passe *</label>
                            <input type="password" name="password" className="input-field" placeholder="Min. 8 car., maj., chiffre, symbole" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                            {passwordStrength && (
                                <div className="password-strength">
                                    <div className="password-strength-bar">
                                        <div className="password-strength-fill" style={{ width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%', background: passwordStrength.color }} />
                                    </div>
                                    <span className="password-strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                                </div>
                            )}
                            <span className="form-hint">8+ caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Campus *</label>
                            <select name="campus" className="input-field" value={formData.campus} onChange={handleChange} required>
                                <option value="">Sélectionne ton campus</option>
                                {CAMPUS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Filière</label>
                            <select name="filiere" className="input-field" value={formData.filiere} onChange={handleChange}>
                                <option value="">Sélectionne ta filière</option>
                                {FILIERE_LIST.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading || (usernameStatus && !usernameStatus.available)}>
                            {isLoading ? <span className="loading-spinner" style={{ width: 17, height: 17, borderWidth: 2 }} /> : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="auth-switch">Déjà un compte ? <Link to="/login" className="auth-link">Se connecter</Link></p>
                </div>
            </div>
        </div>
    );
}
