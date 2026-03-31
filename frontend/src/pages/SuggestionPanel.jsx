import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './SuggestionPanel.css';

function AvatarInitials({ name, size = 38 }) {
    const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>
            {initials}
        </div>
    );
}

const IconSparkle = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
);

const IconUser = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);

function SuggestionSkeleton() {
    return (
        <div className="suggestion-item suggestion-skeleton">
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
                <div className="skeleton-line skeleton-line-long" />
                <div className="skeleton-line skeleton-line-short" />
            </div>
            <div className="skeleton-btn" />
        </div>
    );
}

export default function SuggestionPanel() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        apiService.get('/suggestions')
            .then(res => setSuggestions(res.suggestions || []))
            .catch(() => setSuggestions([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="suggestion-panel card">
            <div className="suggestion-panel-header">
                <h3 className="suggestion-panel-title">
                    <span className="suggestion-sparkle"><IconSparkle /></span>
                    Suggestions pour toi
                </h3>
            </div>

            <div className="suggestion-list">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SuggestionSkeleton key={i} />)
                ) : suggestions.length === 0 ? (
                    <div className="suggestion-empty">
                        <IconUser />
                        <p>Aucune suggestion pour l'instant.<br/>Complète ton profil pour en recevoir.</p>
                    </div>
                ) : (
                    suggestions.map(user => (
                        <div key={user.id} className="suggestion-item">
                            <AvatarInitials name={user.fullName || user.username} size={38} />
                            <div className="suggestion-info">
                                <span className="suggestion-name">
                                    {user.fullName || user.username}
                                </span>
                                <span className="suggestion-sub">
                                    {[user.filiere, user.promotion].filter(Boolean).join(' · ') || user.campus || '@' + user.username}
                                </span>
                                <div className="suggestion-score">
                                    <div className="suggestion-score-bar">
                                        <div
                                            className="suggestion-score-fill"
                                            style={{ width: `${user.similarityScore}%` }}
                                        />
                                    </div>
                                    <span className="suggestion-score-label">{user.similarityScore}% compatibilité</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-secondary suggestion-btn"
                                onClick={() => navigate(`/profile/${user.username}`)}
                            >
                                Voir
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
