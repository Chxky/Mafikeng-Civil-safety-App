import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import Icon from './Icon';

const navItems = [
  { path: '/', labelKey: 'nav_home', icon: 'home' },
  { path: '/report', labelKey: 'nav_report', icon: 'addCircle' },
  { path: '/map', labelKey: 'nav_map', icon: 'map' },
  { path: '/profile', labelKey: 'nav_profile', icon: 'user' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ path, labelKey, icon: iconName }) => {
          const isActive = location.pathname === path;
          const label = t(labelKey);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon name={iconName} className={`w-6 h-6 ${isActive ? 'text-civic-600' : 'text-gray-400'}`} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-civic-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


