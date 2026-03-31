import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { t } from '../services/i18n';
import './ForumPage.css';

const FORUM_CONDITIONS = {
  campus: [
    'paris', 'bordeaux', 'lyon', 'nantes', 'toulouse', 'montpellier',
    'aix-en-provence', 'sophia antipolis', 'rennes', 'strasbourg', 'nanterre', 'lille',
  ],
  filiere: [
    'informatique', 'creation & design', 'marketing & communication',
    'audiovisuel', '3d, animation & jeux video', 'architecture d\'interieur',
  ],
  perso: ['projet', 'stage', 'alternance'],
};

const CHANNEL_GROUPS = [
  { type: 'campus', labelKey: 'forum.channelCampus', values: FORUM_CONDITIONS.campus },
  { type: 'filiere', labelKey: 'forum.channelFiliere', values: FORUM_CONDITIONS.filiere },
  { type: 'perso', labelKey: 'forum.channelPerso', values: FORUM_CONDITIONS.perso },
];

const FORUM_THREADS = [
  {
    id: 1,
    title: 'Recherche mate pour projet React + Node',
    author: 'Noah',
    excerpt: 'Je cherche une personne motivee pour un projet full-stack oriente portfolio etudiant.',
    body: 'Objectif: monter une app complete en 6 semaines. Stack React/Node/PostgreSQL. Je peux gerer API + auth. Qui veut prendre front design ou tests ?',
    campus: 'paris',
    filiere: 'informatique',
    perso: 'projet',
    votes: 28,
    createdAt: '2026-03-30T09:30:00.000Z',
    comments: [
      { id: 11, author: 'Mila', content: 'Partante pour front + design system, DM-moi.', createdAt: '2026-03-30T10:01:00.000Z' },
      { id: 12, author: 'Alex', content: 'Je peux aider sur les tests E2E si besoin.', createdAt: '2026-03-30T10:18:00.000Z' },
    ],
  },
  {
    id: 2,
    title: 'Retours entretien stage marketing digital',
    author: 'Lea',
    excerpt: 'Je partage mes questions d\'entretien et je cherche vos conseils pour progresser.',
    body: 'On ma pose beaucoup de questions KPI et attribution. Si vous avez un template de preparation, je prends.',
    campus: 'bordeaux',
    filiere: 'marketing & communication',
    perso: 'stage',
    votes: 15,
    createdAt: '2026-03-31T07:25:00.000Z',
    comments: [
      { id: 21, author: 'Yanis', content: 'Prepare CAC/LTV et ROAS, ca revient souvent.', createdAt: '2026-03-31T08:04:00.000Z' },
    ],
  },
  {
    id: 3,
    title: 'Alternance UX en agence: qui a des pistes ?',
    author: 'Mina',
    excerpt: 'Je vise une alternance en UX/UI, si vous avez des boites qui recrutent je prends.',
    body: 'Je prefere Paris/Lyon. Je peux envoyer portfolio et etudes de cas en DM.',
    campus: 'lyon',
    filiere: 'creation & design',
    perso: 'alternance',
    votes: 21,
    createdAt: '2026-03-29T18:40:00.000Z',
    comments: [
      { id: 31, author: 'Ilyes', content: 'Regarde les agences produit a Part-Dieu.', createdAt: '2026-03-29T19:03:00.000Z' },
      { id: 32, author: 'Nina', content: 'Doctolib a ouvert un cycle alternance UX.', createdAt: '2026-03-29T20:14:00.000Z' },
    ],
  },
  {
    id: 4,
    title: 'Collab animation 3D pour court metrage',
    author: 'Tom',
    excerpt: 'Projet perso en 3D, besoin de feedback sur rigging et compositing.',
    body: 'J\'ai deja la DA. Il me manque quelqu\'un sur le lighting et compositing final.',
    campus: 'montpellier',
    filiere: '3d, animation & jeux video',
    perso: 'projet',
    votes: 9,
    createdAt: '2026-03-28T15:10:00.000Z',
    comments: [],
  },
  {
    id: 5,
    title: 'Liste entreprises alternance audiovisuel',
    author: 'Ines',
    excerpt: 'Je compile les studios/agences qui prennent en alternance cette annee.',
    body: 'Je mets a jour un doc partage avec studios, chaines et boites de prod. Je peux ajouter vos contacts verifies.',
    campus: 'lille',
    filiere: 'audiovisuel',
    perso: 'alternance',
    votes: 36,
    createdAt: '2026-03-27T11:05:00.000Z',
    comments: [
      { id: 51, author: 'Sara', content: 'Merci ! Ajoute aussi W9 prod stp.', createdAt: '2026-03-27T12:22:00.000Z' },
    ],
  },
];

function buildChannelId(type, value) {
  return `${type}:${value}`;
}

function parseChannelId(channelId) {
  const splitIndex = channelId.indexOf(':');
  if (splitIndex === -1) return { type: 'campus', value: FORUM_CONDITIONS.campus[0] };
  return {
    type: channelId.slice(0, splitIndex),
    value: channelId.slice(splitIndex + 1),
  };
}

function getRelativeTime(isoDate) {
  const diffMinutes = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} j`;
}

function toYpostSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function ForumPage() {
  const { preferences } = usePreferences();
  const language = preferences.language;
  const [posts, setPosts] = useState(FORUM_THREADS);
  const [activeChannel, setActiveChannel] = useState(buildChannelId('campus', FORUM_CONDITIONS.campus[0]));
  const [campus, setCampus] = useState('all');
  const [filiere, setFiliere] = useState('all');
  const [perso, setPerso] = useState('all');
  const [sortMode, setSortMode] = useState('hot');
  const [query, setQuery] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composePerso, setComposePerso] = useState('projet');
  const channelInfo = useMemo(() => parseChannelId(activeChannel), [activeChannel]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = posts.filter((post) => {
      if (channelInfo.type === 'campus' && post.campus !== channelInfo.value) return false;
      if (channelInfo.type === 'filiere' && post.filiere !== channelInfo.value) return false;
      if (channelInfo.type === 'perso' && post.perso !== channelInfo.value) return false;
      if (campus !== 'all' && post.campus !== campus) return false;
      if (filiere !== 'all' && post.filiere !== filiere) return false;
      if (perso !== 'all' && post.perso !== perso) return false;
      if (!q) return true;

      const joined = `${post.title} ${post.excerpt} ${post.body} ${post.author}`.toLowerCase();
      return joined.includes(q);
    });

    const scored = [...list].sort((a, b) => {
      if (sortMode === 'new') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortMode === 'top') return b.votes - a.votes;

      const hoursA = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
      const hoursB = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
      const hotA = a.votes + a.comments.length * 2 - hoursA * 0.5;
      const hotB = b.votes + b.comments.length * 2 - hoursB * 0.5;
      return hotB - hotA;
    });

    return scored;
  }, [posts, channelInfo.type, channelInfo.value, campus, filiere, perso, query, sortMode]);

  useEffect(() => {
    if (!filteredPosts.length) {
      setSelectedPostId(null);
      return;
    }

    const exists = filteredPosts.some((post) => post.id === selectedPostId);
    if (!exists) setSelectedPostId(filteredPosts[0].id);
  }, [filteredPosts, selectedPostId]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  const handleVote = (postId, delta) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, votes: Math.max(0, post.votes + delta) } : post
    )));
  };

  const handleCreatePost = (event) => {
    event.preventDefault();
    const title = composeTitle.trim();
    const body = composeBody.trim();
    if (!title || !body) return;

    const post = {
      id: Date.now(),
      title,
      author: 'Toi',
      excerpt: body.slice(0, 140),
      body,
      campus: channelInfo.type === 'campus' ? channelInfo.value : (campus === 'all' ? 'paris' : campus),
      filiere: channelInfo.type === 'filiere' ? channelInfo.value : (filiere === 'all' ? 'informatique' : filiere),
      perso: composePerso,
      votes: 1,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    setPosts((prev) => [post, ...prev]);
    setSelectedPostId(post.id);
    setComposeTitle('');
    setComposeBody('');
  };

  const handleAddComment = (event) => {
    event.preventDefault();
    const content = newComment.trim();
    if (!content || !selectedPostId) return;

    setPosts((prev) => prev.map((post) => {
      if (post.id !== selectedPostId) return post;
      return {
        ...post,
        comments: [
          ...post.comments,
          { id: Date.now(), author: 'Toi', content, createdAt: new Date().toISOString() },
        ],
      };
    }));

    setNewComment('');
  };

  return (
    <div className="forum-discord-wrap">
      <aside className="forum-channel-sidebar">
        <div className="forum-sidebar-header">
          <div>
            <h2>{t(language, 'forum.heading')}</h2>
            <p>{t(language, 'forum.subheading')}</p>
          </div>
        </div>

        <div className="forum-channel-list">
          {CHANNEL_GROUPS.map((group) => (
            <div key={group.type} className="forum-channel-group">
              <h4>{t(language, group.labelKey)}</h4>
              <div className="forum-channel-group-list">
                {group.values.map((value) => {
                  const id = buildChannelId(group.type, value);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`forum-channel-btn ${activeChannel === id ? 'active' : ''}`}
                      onClick={() => setActiveChannel(id)}
                    >
                      <span>#{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="forum-filter-panel">
          <h3>{t(language, 'forum.filters')}</h3>
          <div className="forum-filter-buttons">
            <strong>{t(language, 'forum.channelCampus')}</strong>
            <div className="forum-chip-list">
              <button type="button" className={`forum-chip ${campus === 'all' ? 'forum-chip-active' : ''}`} onClick={() => setCampus('all')}>{t(language, 'forum.all')}</button>
              {FORUM_CONDITIONS.campus.map((item) => (
                <button key={item} type="button" className={`forum-chip ${campus === item ? 'forum-chip-active' : ''}`} onClick={() => setCampus(item)}>{item}</button>
              ))}
            </div>
            <strong>{t(language, 'forum.channelFiliere')}</strong>
            <div className="forum-chip-list">
              <button type="button" className={`forum-chip ${filiere === 'all' ? 'forum-chip-active' : ''}`} onClick={() => setFiliere('all')}>{t(language, 'forum.all')}</button>
              {FORUM_CONDITIONS.filiere.map((item) => (
                <button key={item} type="button" className={`forum-chip ${filiere === item ? 'forum-chip-active' : ''}`} onClick={() => setFiliere(item)}>{item}</button>
              ))}
            </div>
            <strong>{t(language, 'forum.channelPerso')}</strong>
            <div className="forum-chip-list">
              <button type="button" className={`forum-chip ${perso === 'all' ? 'forum-chip-active' : ''}`} onClick={() => setPerso('all')}>{t(language, 'forum.all')}</button>
              {FORUM_CONDITIONS.perso.map((item) => (
                <button key={item} type="button" className={`forum-chip ${perso === item ? 'forum-chip-active' : ''}`} onClick={() => setPerso(item)}>{item}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="forum-feed-area">
        <header className="forum-feed-header">
          <div>
            <h1>#{channelInfo.value}</h1>
            <p>{t(language, CHANNEL_GROUPS.find((g) => g.type === channelInfo.type)?.labelKey || 'forum.channelCampus')}</p>
          </div>
          <div className="forum-toolbar">
            <input
              className="input-field"
              placeholder={t(language, 'forum.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="forum-sort-buttons">
              <button type="button" className={`forum-chip ${sortMode === 'hot' ? 'forum-chip-active' : ''}`} onClick={() => setSortMode('hot')}>{t(language, 'forum.sortHot')}</button>
              <button type="button" className={`forum-chip ${sortMode === 'new' ? 'forum-chip-active' : ''}`} onClick={() => setSortMode('new')}>{t(language, 'forum.sortNew')}</button>
              <button type="button" className={`forum-chip ${sortMode === 'top' ? 'forum-chip-active' : ''}`} onClick={() => setSortMode('top')}>{t(language, 'forum.sortTop')}</button>
            </div>
          </div>
        </header>

        <form className="forum-compose card" onSubmit={handleCreatePost}>
          <h3>{t(language, 'forum.composeTitle')}</h3>
          <input
            className="input-field"
            placeholder={t(language, 'forum.composePlaceholderTitle')}
            value={composeTitle}
            onChange={(e) => setComposeTitle(e.target.value)}
          />
          <textarea
            className="input-field forum-compose-body"
            placeholder={t(language, 'forum.composePlaceholderBody')}
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
          />
          <div className="forum-compose-actions">
            <div className="forum-sort-buttons">
              {FORUM_CONDITIONS.perso.map((item) => (
                <button key={item} type="button" className={`forum-chip ${composePerso === item ? 'forum-chip-active' : ''}`} onClick={() => setComposePerso(item)}>{item}</button>
              ))}
            </div>
            <button className="btn btn-primary" type="submit">{t(language, 'forum.publish')}</button>
          </div>
        </form>

        <section className="forum-post-list">
          {filteredPosts.length === 0 && (
            <div className="card forum-empty">
              <p>{t(language, 'forum.noPosts')}</p>
            </div>
          )}

          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className={`card forum-post-card ${selectedPostId === post.id ? 'active' : ''}`}
              onClick={() => setSelectedPostId(post.id)}
            >
              <div className="forum-vote-col">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleVote(post.id, 1); }}>▲</button>
                <strong>{post.votes}</strong>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleVote(post.id, -1); }}>▼</button>
              </div>

              <div className="forum-post-main">
                <div className="forum-post-meta">
                  <span>Ypost/{toYpostSlug(post.title)}</span>
                  <span>•</span>
                  <span>{getRelativeTime(post.createdAt)}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="forum-post-tags">
                  <span className="badge badge-gray">{post.campus}</span>
                  <span className="badge badge-gray">{post.filiere}</span>
                  <span className="badge badge-turquoise">{post.perso}</span>
                  <span className="forum-comments-count">{post.comments.length} {t(language, 'forum.comments')}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <aside className="forum-thread-panel">
        {!selectedPost && (
          <div className="card forum-thread-empty">
            <p>{t(language, 'forum.noThread')}</p>
          </div>
        )}

        {selectedPost && (
          <div className="forum-thread-card card">
            <header>
              <h3>{selectedPost.title}</h3>
              <p>{selectedPost.body}</p>
            </header>

            <div className="forum-thread-comments">
              {selectedPost.comments.length === 0 && <p className="text-muted">{t(language, 'forum.noComments')}</p>}
              {selectedPost.comments.map((comment) => (
                <div key={comment.id} className="forum-comment-item">
                  <strong>u/{comment.author}</strong>
                  <small>{getRelativeTime(comment.createdAt)}</small>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>

            <form className="forum-comment-form" onSubmit={handleAddComment}>
              <textarea
                className="input-field"
                placeholder={t(language, 'forum.addReply')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">{t(language, 'forum.replies')}</button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}
