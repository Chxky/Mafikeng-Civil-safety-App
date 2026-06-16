import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SOSButton from '../components/SOSButton';
import PowerWidget from '../components/PowerWidget';
import TransportWidget from '../components/TransportWidget';
import DisasterWidget from '../components/DisasterWidget';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Icon from '../components/Icon';
import { getCivicReports, getDashboardStats } from '../db/mockApi';
import { CATEGORIES, STATUSES, timeAgo } from '../utils/helpers';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          getCivicReports(),
          getDashboardStats(),
        ]);
        setRecentReports(reportsRes.data?.slice(0, 5) || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-br from-civic-600 via-indigo-700 to-civic-900 text-white px-5 pt-8 pb-12 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-civic-400 rounded-full mix-blend-screen filter blur-[60px] animate-float"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[60px] animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-md">{t('home_greeting')}</h1>
            <p className="text-civic-200 text-sm mt-1 font-medium tracking-wide">
              {user?.displayName || t('community_member')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="page" />
            <button
              onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-lg active:scale-95"
            >
              <Icon name="user" className="w-5 h-5 drop-shadow-md" />
            </button>
          </div>
        </div>

        {/* SOS Button */}
        <div className="flex justify-center -mb-24 relative z-20">
          <SOSButton />
        </div>
      </div>

      {/* Mahikeng Power Widget */}
      <PowerWidget />

      {/* Quick Stats */}
      {stats && (
        <div className="px-5 mt-24">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card text-center py-5">
              <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-civic-500 to-indigo-600 drop-shadow-sm">{stats.totalReports}</p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mt-1">{t('reports')}</p>
            </div>
            <div className="glass-card text-center py-5">
              <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-safety-400 to-safety-600 drop-shadow-sm">{stats.resolutionRate}%</p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mt-1">{t('resolved')}</p>
            </div>
            <div className="glass-card text-center py-5">
              <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-warning-500 to-danger-500 drop-shadow-sm">{stats.totalIncidents}</p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mt-1">{t('incidents')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Hub */}
      <div className="px-5 mt-8">
        <h2 className="section-title">{t('services_hub')}</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
            { label: t('service_power'), icon: '⚡', path: '/power', color: 'from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40', text: 'text-purple-600 dark:text-purple-300' },
            { label: t('service_report'), icon: '📝', path: '/report', color: 'from-civic-100 to-civic-200 dark:from-civic-900/40 dark:to-civic-800/40', text: 'text-civic-600 dark:text-civic-300' },
            { label: t('service_safety'), icon: '🛡️', path: '/safety', color: 'from-danger-100 to-danger-200 dark:from-danger-900/40 dark:to-danger-800/40', text: 'text-danger-600 dark:text-danger-300' },
            { label: t('service_map'), icon: '🗺️', path: '/map', color: 'from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40', text: 'text-green-600 dark:text-green-300' },
            { label: t('service_edutrans'), icon: '🚌', path: '/edutrans', color: 'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40', text: 'text-blue-600 dark:text-blue-300' },
            { label: t('service_disaster'), icon: '🌊', path: '/disaster', color: 'from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40', text: 'text-red-600 dark:text-red-300' },
            { label: t('service_leaders'), icon: '👥', path: '/leaders', color: 'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40', text: 'text-amber-600 dark:text-amber-300' },
            { label: t('service_healthcare'), icon: '🏥', path: '/healthcare', color: 'from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40', text: 'text-teal-600 dark:text-teal-300' },
            { label: t('service_water'), icon: '💧', path: '/water', color: 'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40', text: 'text-blue-600 dark:text-blue-300' },
            { label: t('service_jobs'), icon: '📋', path: '/jobs', color: 'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40', text: 'text-amber-600 dark:text-amber-300' },
            { label: t('service_marketplace'), icon: '🏪', path: '/marketplace', color: 'from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40', text: 'text-green-600 dark:text-green-300' },
            { label: t('service_documents'), icon: '📚', path: '/documents', color: 'from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40', text: 'text-indigo-600 dark:text-indigo-300' },
            { label: t('service_saps'), icon: '📞', path: 'tel:10111', color: 'from-danger-100 to-danger-200 dark:from-danger-900/40 dark:to-danger-800/40', text: 'text-danger-600 dark:text-danger-300', external: true },
          ].map(service => (
            <button
              key={service.label}
              onClick={() => service.external ? (window.location.href = service.path) : navigate(service.path)}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 active:scale-95 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-2xl shadow-sm border border-white/50 dark:border-white/5 group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300`}>
                <span className="drop-shadow-sm">{service.icon}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide text-center ${service.text}`}>{service.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module Widgets */}
      <TransportWidget />
      <DisasterWidget />

      {/* Emergency Hotline */}
      <div className="px-4 mt-6">
        <h2 className="section-title">{t('emergency_numbers')}</h2>
        <div className="card bg-danger-50 border-danger-200">
          <div className="space-y-3">
            {[
              { name: t('saps_emergency'), number: '10111', desc: t('saps_emergency_desc') },
              { name: t('mahikeng_saps'), number: '018 381 8200', desc: t('mahikeng_saps_desc') },
              { name: t('ambulance_fire'), number: '10177', desc: t('ambulance_fire_desc') },
              { name: t('municipality_hotline'), number: '018 381 8200', desc: t('municipality_hotline_desc') },
            ].map(emergency => (
              <button
                key={emergency.name}
                onClick={() => window.location.href = `tel:${emergency.number.replace(/\s/g, '')}`}
                className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <Icon name="phone" className="w-5 h-5 text-danger-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-900">{emergency.name}</p>
                    <p className="text-xs text-gray-500">{emergency.desc}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-danger-600">{emergency.number}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">{t('recent_reports')}</h2>
          <button
            onClick={() => navigate('/my-reports')}
            className="text-sm text-civic-600 font-medium"
          >
            {t('view_all')}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">{t('no_reports_yet')}</p>
            <button
              onClick={() => navigate('/report')}
              className="btn-primary mt-3 text-sm"
            >
              {t('report_an_issue')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.map(report => {
              const cat = CATEGORIES[report.category] || CATEGORIES.other;
              const status = STATUSES[report.status] || STATUSES.pending;

              return (
                <div key={report.id} className="feed-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {report.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {report.address || 'Mahikeng'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Municipality Scorecard Preview */}
      {stats && (
        <div className="px-4 mt-6 mb-6">
          <h2 className="section-title">{t('municipality_scorecard')}</h2>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">{t('overall_resolution_rate')}</span>
              <span className="text-lg font-bold text-safety-600">{stats.resolutionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
              <div
                className="bg-safety-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${stats.resolutionRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">{t('avg_resolution')}</span>
                <p className="font-semibold">{stats.avgResolutionDays} {t('days')}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('active_alerts')}</span>
                <p className="font-semibold text-danger-600">{stats.activeAlerts}</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">{t('by_category')}</p>
              {Object.entries(stats.byCategory || {}).map(([cat, data]) => {
                const catInfo = CATEGORIES[cat] || CATEGORIES.other;
                const rate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span>{catInfo.icon}</span>
                      <span className="text-xs text-gray-700">{catInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-safety-400 h-1.5 rounded-full"
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
