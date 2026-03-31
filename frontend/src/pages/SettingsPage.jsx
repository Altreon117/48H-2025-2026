import { usePreferences } from '../context/PreferencesContext';
import { t } from '../services/i18n';
import './SettingsPage.css';

function NotificationRow({ label, description, value, onChange }) {
  return (
    <label className="settings-switch-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function SettingsPage() {
  const { preferences, setTheme, setLanguage, setNotification } = usePreferences();
  const language = preferences.language;

  return (
    <div className="page-container settings-page">
      <header className="settings-header">
        <h1 className="font-display">{t(language, 'settings.title')}</h1>
        <p>{t(language, 'settings.subtitle')}</p>
      </header>

      <section className="settings-card card">
        <h3>{t(language, 'settings.theme')}</h3>
        <div className="settings-inline-options">
          <button
            type="button"
            className={`btn ${preferences.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('light')}
          >
            {t(language, 'settings.themeLight')}
          </button>
          <button
            type="button"
            className={`btn ${preferences.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('dark')}
          >
            {t(language, 'settings.themeDark')}
          </button>
        </div>
      </section>

      <section className="settings-card card">
        <h3>{t(language, 'settings.language')}</h3>
        <select
          className="input-field"
          value={preferences.language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="fr">Francais</option>
          <option value="en">English</option>
          <option value="es">Espanol</option>
        </select>
      </section>

      <section className="settings-card card">
        <h3>{t(language, 'settings.notifications')}</h3>
        <div className="settings-switch-list">
          <NotificationRow
            label={t(language, 'settings.notifMessages')}
            description={t(language, 'settings.notifMessagesDesc')}
            value={preferences.notifications.messages}
            onChange={(value) => setNotification('messages', value)}
          />
          <NotificationRow
            label={t(language, 'settings.notifForum')}
            description={t(language, 'settings.notifForumDesc')}
            value={preferences.notifications.forum}
            onChange={(value) => setNotification('forum', value)}
          />
          <NotificationRow
            label={t(language, 'settings.notifJobs')}
            description={t(language, 'settings.notifJobsDesc')}
            value={preferences.notifications.jobs}
            onChange={(value) => setNotification('jobs', value)}
          />
          <NotificationRow
            label={t(language, 'settings.notifDigest')}
            description={t(language, 'settings.notifDigestDesc')}
            value={preferences.notifications.emailDigest}
            onChange={(value) => setNotification('emailDigest', value)}
          />
        </div>
      </section>
    </div>
  );
}
