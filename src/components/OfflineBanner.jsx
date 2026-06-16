import { useLanguage } from '../hooks/useLanguage';

export default function OfflineBanner() {
  const { t } = useLanguage();

  return (
    <div className="offline-banner dark:bg-warning-700">
      <span className="mr-2">📡</span>
      {t('you_are_offline')} — {t('offline_message')}
    </div>
  );
}
