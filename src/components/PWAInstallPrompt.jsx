import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  // Check if dismissed in last 7 days
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  // eslint-disable-next-line react-hooks/purity
  if (dismissed && (Date.now() - parseInt(dismissed)) < 7 * 86400000) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in" role="dialog" aria-label="Install app prompt">
      <div className="card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 border border-civic-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-civic-100 dark:bg-civic-900/30 flex items-center justify-center shrink-0" aria-hidden="true">
            <svg className="w-6 h-6 text-civic-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-3-3m3 3l3-3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {t('install_app_title') || 'Install Mahikeng App'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('install_app_desc') || 'Get faster access and offline support'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              aria-label="Dismiss install prompt"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 rounded-xl bg-civic-600 text-white text-sm font-medium hover:bg-civic-700 transition-colors"
              aria-label="Install Mahikeng app"
            >
              {t('install') || 'Install'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
