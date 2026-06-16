import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/languages';
import { saveUserData, getUserData } from '../db/offline';
import en from '../i18n/translations/en';

const LanguageContext = createContext(null);

const translationCache = {};

async function loadTranslation(code) {
  if (code === DEFAULT_LANGUAGE) return en;
  if (translationCache[code]) return translationCache[code];

  try {
    const mod = await import(`../i18n/translations/${code}.js`);
    translationCache[code] = mod.default;
    return mod.default;
  } catch (err) {
    console.error(`Failed to load translations for ${code}:`, err);
    return en;
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState(en);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    initLanguage();
  }, []);

  async function initLanguage() {
    try {
      const saved = await getUserData('language');
      const code = saved || DEFAULT_LANGUAGE;
      setLanguage(code);
      const trans = await loadTranslation(code);
      setTranslations(trans);
    } catch (err) {
      console.error('Failed to load language preference:', err);
    } finally {
      setLoading(false);
    }
  }

  const changeLanguage = useCallback(async (code) => {
    setLanguage(code);
    const trans = await loadTranslation(code);
    setTranslations(trans);
    await saveUserData('language', code);
  }, []);

  const t = useCallback((key, params = {}) => {
    let str = translations[key] || en[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  }, [translations]);

  const value = {
    language,
    changeLanguage,
    t,
    loading,
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
