import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ynov.preferences';

const defaultPreferences = {
  theme: 'light',
  language: 'fr',
  notifications: {
    messages: true,
    forum: true,
    jobs: true,
    emailDigest: false,
  },
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultPreferences;

    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultPreferences,
        ...parsed,
        notifications: {
          ...defaultPreferences.notifications,
          ...(parsed.notifications || {}),
        },
      };
    } catch {
      return defaultPreferences;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
    document.documentElement.setAttribute('lang', preferences.language);
  }, [preferences.theme, preferences.language]);

  const value = useMemo(() => ({
    preferences,
    setTheme: (theme) => setPreferences(prev => ({ ...prev, theme })),
    setLanguage: (language) => setPreferences(prev => ({ ...prev, language })),
    setNotification: (key, enabled) => setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: enabled,
      },
    })),
  }), [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences doit être utilisé dans PreferencesProvider');
  return context;
}
