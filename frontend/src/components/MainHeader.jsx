import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import './MainHeader.css';

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

function userDisplayName(u) {
  return u.fullName || u.full_name || u.username || '';
}

export default function MainHeader() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.get('/users');
        if (!cancelled && response?.users) {
          setUsers(response.users);
        }
      } catch {
        if (!cancelled) setUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) => {
        if (u.id === currentUser?.id) return false;
        const name = (userDisplayName(u) || '').toLowerCase();
        const un = (u.username || '').toLowerCase();
        const campus = (u.campus || '').toLowerCase();
        const promo = (u.promotion || '').toLowerCase();
        return name.includes(q) || un.includes(q) || campus.includes(q) || promo.includes(q);
      })
      .slice(0, 8);
  }, [users, query, currentUser?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const exact = users.find(
      (u) => (u.username || '').toLowerCase() === query.trim().toLowerCase()
    );
    if (exact) {
      navigate(`/profile/${exact.username}`);
      setOpen(false);
      setQuery('');
    } else if (filtered.length === 1) {
      navigate(`/profile/${filtered[0].username}`);
      setOpen(false);
      setQuery('');
    }
  };

  const goProfile = (username) => {
    navigate(`/profile/${username}`);
    setOpen(false);
    setQuery('');
  };

  return (
    <header className="main-header" role="banner">
      <div className="main-header-inner">
        <div className="main-header-search-wrap" ref={wrapRef}>
          <form className="main-header-search-form" onSubmit={handleSubmit} role="search">
            <label htmlFor="global-search" className="visually-hidden">
              Rechercher un étudiant
            </label>
            <span className="main-header-search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              id="global-search"
              type="search"
              className="main-header-search-input input-field"
              placeholder="Rechercher par nom, @pseudo, campus…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
              spellCheck="false"
            />
          </form>
          {open && query.trim() && (
            <div className="main-header-dropdown card" role="listbox">
              {filtered.length === 0 ? (
                <p className="main-header-dropdown-empty">Aucun résultat</p>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="main-header-result"
                    role="option"
                    onClick={() => goProfile(u.username)}
                  >
                    <span className="main-header-result-name">{userDisplayName(u)}</span>
                    <span className="main-header-result-meta">@{u.username}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
