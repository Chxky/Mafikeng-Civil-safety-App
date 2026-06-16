import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Icon from './Icon';

export default function LanguageSelector({ variant = 'page' }) {
  // eslint-disable-next-line no-unused-vars
  const { language, changeLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language);

  if (variant === 'inline') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="card w-full flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-civic-100 flex items-center justify-center">
            <Icon name="globe" className="w-5 h-5 text-civic-600" />
          </div>
          <div>
            <span className="text-sm font-medium">{t('language')}</span>
            <p className="text-xs text-gray-400">{currentLang?.nativeName}</p>
          </div>
        </div>
        <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
        {isOpen && (
          <LanguageModal onClose={() => setIsOpen(false)} />
        )}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
      >
        <Icon name="globe" className="w-4 h-4" />
        {currentLang?.code.toUpperCase()}
      </button>

      {isOpen && (
        <LanguageModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

function LanguageModal({ onClose }) {
  const { language, changeLanguage, languages, t } = useLanguage();

  async function handleSelect(code) {
    await changeLanguage(code);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('select_language')}</h2>
            <button onClick={onClose} className="p-2">
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between py-3 px-2 rounded-xl transition-colors ${
                language === lang.code ? 'bg-civic-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-sm font-medium ${language === lang.code ? 'text-civic-700' : 'text-gray-900'}`}>
                  {lang.nativeName}
                </span>
                <span className="text-xs text-gray-400">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Icon name="check" className="w-5 h-5 text-civic-600" strokeWidth={2} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
