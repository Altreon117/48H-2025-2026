import { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { t } from '../services/i18n';
import './Sidebar.css';

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IconForum = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" />
  </svg>
);
const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15.4a1.65 1.65 0 00-1.51-1H3.4a2 2 0 110-4h.09A1.65 1.65 0 005 8.9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009.1 5c.2-.5.31-1.03.33-1.56V3.4a2 2 0 114 0v.09c.02.53.13 1.06.33 1.56a1.65 1.65 0 001.51 1 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9.1c.5.2 1.03.31 1.56.33h.04a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconAdmin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function AvatarInitials({ name, size = 34 }) {
  const initials = (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { preferences } = usePreferences();
  const language = preferences.language;
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('ynov.sidebar.collapsed') === 'true');

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '78px' : '256px');
    localStorage.setItem('ynov.sidebar.collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/feed', label: t(language, 'nav.feed'), mobileLabel: t(language, 'nav.feed'), icon: <IconHome /> },
    { to: `/profile/${currentUser?.username}`, label: t(language, 'nav.profile'), mobileLabel: t(language, 'nav.profile'), icon: <IconUser /> },
    { to: '/messages', label: t(language, 'nav.messages'), mobileLabel: t(language, 'nav.messages'), icon: <IconMessage /> },
    { to: '/forum', label: t(language, 'nav.forum'), mobileLabel: t(language, 'nav.forum'), icon: <IconForum /> },
    { to: '/jobs', label: t(language, 'nav.jobs'), mobileLabel: t(language, 'nav.jobs'), icon: <IconBriefcase /> },
  ];

  const userSubline = [currentUser?.promotion, currentUser?.campus].filter(Boolean).join(' · ') || 'Ynov Campus';

  return (
    <>
      <aside className="sidebar">
        <div className={`sidebar-logo ${isCollapsed ? 'sidebar-logo-collapsed' : ''}`}>
          <img
            src="/logo-ynovconnect.png"
            alt="YnovConnect"
            className="sidebar-logo-img"
          />
          {!isCollapsed && <span className="logo-text">Ynov<span className="logo-accent">Connect</span></span>}
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
            aria-label={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {isCollapsed ? '▸' : '◂'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && <span className="sidebar-section-label">{t(language, 'nav.navigation')}</span>}
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} title={item.label} className={({ isActive }) => `nav-item ${isCollapsed ? 'nav-item-collapsed' : ''} ${isActive ? 'nav-item-active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && item.label}
            </NavLink>
          ))}

          {/* Zone réservée aux administrateurs */}
          {currentUser?.isAdmin && (
            <>
              {!isCollapsed && <span className="sidebar-section-label" style={{ marginTop: '20px' }}>{t(language, 'nav.administration')}</span>}
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isCollapsed ? 'nav-item-collapsed' : ''} ${isActive || location.pathname.includes('/admin') ? 'nav-item-active' : ''}`}>
                <span className="nav-icon"><IconAdmin /></span>
                {!isCollapsed && 'Panel Admin'}
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-settings-link-wrap">
          <NavLink to="/settings" title={t(language, 'nav.settings')} className={({ isActive }) => `nav-item ${isCollapsed ? 'nav-item-collapsed' : ''} ${isActive ? 'nav-item-active' : ''}`}>
            <span className="nav-icon"><IconSettings /></span>
            {!isCollapsed && t(language, 'nav.settings')}
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <Link to={`/profile/${currentUser?.username}`} className="sidebar-user">
            <AvatarInitials name={currentUser?.fullName || currentUser?.username} size={34} />
            {!isCollapsed && <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser?.fullName || currentUser?.username}</span>
              <span className="sidebar-user-sub">{userSubline}</span>
            </div>}
          </Link>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout} title="Se déconnecter">
            <IconLogout />
          </button>
        </div>
      </aside>

      <nav className="mobile-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            {item.icon}
            <span>{item.mobileLabel}</span>
          </NavLink>
        ))}
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <IconSettings />
          <span>{t(language, 'nav.settingsMobile')}</span>
        </NavLink>
        {/* Lien admin sur mobile */}
        {currentUser?.isAdmin && (
          <NavLink to="/admin/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive || location.pathname.includes('/admin') ? 'active' : ''}`}>
            <IconAdmin /><span>Admin</span>
          </NavLink>
        )}
        <button className="mobile-nav-item" onClick={handleLogout}>
          <IconLogout /><span>{t(language, 'nav.logout')}</span>
        </button>
      </nav>
    </>
  );
}