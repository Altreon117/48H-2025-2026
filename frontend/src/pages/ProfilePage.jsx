import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import PostCard from '../components/PostCard';
import { CAMPUS_LIST, FILIERE_LIST, PROMOTION_LIST } from '../services/constants';
import './ProfilePage.css';

function AvatarInitials({ name, size = 72 }) {
    const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const IconMapPin = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
);
const IconMessage = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
);
const IconBook = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
);

export default function ProfilePage() {
    const { username } = useParams();
    const { currentUser, updateCurrentUser } = useAuth();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => { loadProfile(); }, [username]);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.get(`/users/${username}`);
            const user = response.user;
            setProfileUser(user);
            setUserPosts(response.posts);
            // Pré-remplissage garanti depuis les données serveur
            setEditForm({
                fullName: user.fullName || '',
                bio: user.bio || '',
                skills: user.skills || '',
                promotion: user.promotion || '',
                campus: user.campus || '',
                filiere: user.filiere || '',
            });
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditChange = (event) => {
        setEditForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleSaveProfile = async () => {
        setSaveError('');
        setIsSaving(true);
        try {
            const response = await apiService.put('/profile', editForm);
            const updatedUser = response.user;
            setProfileUser(updatedUser);
            updateCurrentUser(updatedUser);
            // Resync editForm avec les nouvelles données
            setEditForm({
                fullName: updatedUser.fullName || '',
                bio: updatedUser.bio || '',
                skills: updatedUser.skills || '',
                promotion: updatedUser.promotion || '',
                campus: updatedUser.campus || '',
                filiere: updatedUser.filiere || '',
            });
            setIsEditing(false);
        } catch (error) {
            setSaveError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (!profileUser) return;
        setEditForm({
            fullName: profileUser.fullName || '',
            bio: profileUser.bio || '',
            skills: profileUser.skills || '',
            promotion: profileUser.promotion || '',
            campus: profileUser.campus || '',
            filiere: profileUser.filiere || '',
        });
        setSaveError('');
        setIsEditing(false);
    };

    const handleDeletePost = async (postId) => {
        try {
            await apiService.delete(`/posts/${postId}`);
            setUserPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) { console.error(error); }
    };

    const handleLikePost = async (postId) => {
        try {
            const response = await apiService.post(`/posts/${postId}/like`, {});
            setUserPosts(prev => prev.map(post => post.id !== postId ? post : {
                ...post,
                likesCount: response.liked ? post.likesCount + 1 : post.likesCount - 1,
                isLikedByCurrentUser: response.liked ? 1 : 0,
            }));
        } catch (error) { console.error(error); }
    };

    if (isLoading) return <div className="loading-container"><div className="loading-spinner" /></div>;
    if (!profileUser) return <div className="page-container"><p className="text-muted">Utilisateur introuvable.</p></div>;

    const skillsList = profileUser.skills
        ? profileUser.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    return (
        <div className="page-container profile-page">
            {/* Header card — sans barre noire */}
            <div className="profile-header-card card">
                <div className="profile-header-body">
                    <div className="profile-avatar-row">
                        <AvatarInitials name={profileUser.fullName || profileUser.username} size={72} />
                        <div className="profile-header-actions">
                            {isOwnProfile ? (
                                <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                                    <IconEdit /> {isEditing ? 'Annuler' : 'Modifier'}
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={() => navigate(`/messages/${profileUser.id}`)}>
                                    <IconMessage /> Message
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="profile-identity">
                        <h1 className="profile-fullname">{profileUser.fullName || profileUser.username}</h1>
                        <span className="profile-username">@{profileUser.username}</span>

                        <div className="profile-tags-row">
                            {profileUser.promotion && <span className="badge badge-turquoise">{profileUser.promotion}</span>}
                            {profileUser.campus && (
                                <span className="profile-info-chip"><IconMapPin />{profileUser.campus}</span>
                            )}
                            {profileUser.filiere && (
                                <span className="profile-info-chip"><IconBook />{profileUser.filiere}</span>
                            )}
                        </div>

                        {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
                    </div>
                </div>

                {skillsList.length > 0 && (
                    <div className="profile-skills-row">
                        {skillsList.map((skill, i) => <span key={i} className="skill-tag">{skill}</span>)}
                    </div>
                )}

                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="profile-stat-value">{userPosts.length}</span>
                        <span className="profile-stat-label">Publications</span>
                    </div>
                    <div className="profile-stat">
                        <span className="profile-stat-value">{userPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0)}</span>
                        <span className="profile-stat-label">Likes reçus</span>
                    </div>
                    <div className="profile-stat">
                        <span className="profile-stat-value">{profileUser.promotion || '—'}</span>
                        <span className="profile-stat-label">Promotion</span>
                    </div>
                </div>
            </div>

            {/* Edit form */}
            {isEditing && (
                <div className="profile-edit-card card fade-in">
                    <h3 className="edit-card-title">Modifier mon profil</h3>
                    {saveError && <div className="error-message" style={{ marginBottom: 14 }}>{saveError}</div>}
                    <div className="edit-form-grid">
                        <div className="form-group">
                            <label className="form-label">Nom complet</label>
                            <input name="fullName" className="input-field" value={editForm.fullName} onChange={handleEditChange} placeholder="Jean Dupont" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Promotion</label>
                            <select name="promotion" className="input-field" value={editForm.promotion} onChange={handleEditChange}>
                                <option value="">Sélectionner</option>
                                {PROMOTION_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Campus</label>
                            <select name="campus" className="input-field" value={editForm.campus} onChange={handleEditChange}>
                                <option value="">Sélectionne ton campus</option>
                                {CAMPUS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filière</label>
                            <select name="filiere" className="input-field" value={editForm.filiere} onChange={handleEditChange}>
                                <option value="">Sélectionne ta filière</option>
                                {FILIERE_LIST.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Bio</label>
                            <textarea name="bio" className="input-field" rows={3} value={editForm.bio} onChange={handleEditChange} placeholder="Parle un peu de toi..." style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Compétences <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(séparées par des virgules)</span></label>
                            <input name="skills" className="input-field" value={editForm.skills} onChange={handleEditChange} placeholder="React, Node.js, Python..." />
                        </div>
                    </div>
                    <div className="edit-form-footer">
                        <button className="btn btn-secondary" onClick={handleCancelEdit}>Annuler</button>
                        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                    </div>
                </div>
            )}

            {/* Posts */}
            <div className="profile-posts">
                <div className="profile-posts-header">
                    <h2 className="profile-posts-title">Publications</h2>
                    <span className="profile-posts-count">{userPosts.length}</span>
                </div>
                {userPosts.length === 0 ? (
                    <div className="feed-empty">
                        <p>Aucune publication pour l'instant</p>
                        {isOwnProfile && <span>Partage quelque chose depuis le fil d'actualité !</span>}
                    </div>
                ) : (
                    <div className="posts-list">
                        {userPosts.map(post => (
                            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} onDelete={handleDeletePost} onLike={handleLikePost} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
