import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Settings, LogOut, Users, HeartHandshake, Video, Moon, Sun } from 'lucide-react';
import { useAdminTheme } from '../AdminThemeContext';
import { ADMIN_NAME, BRAND_NAME } from '../branding';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sermons', label: 'Sermons', icon: BookOpen },
  { to: '/bible-plan', label: 'Bible Plan', icon: BookOpen },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/devotions', label: 'Devotions', icon: HeartHandshake },
  { to: '/clips', label: 'Clips', icon: Video },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children, user, onLogout }) {
  const { isDark, toggleMode } = useAdminTheme();

  return (
    <div className='admin-shell'>
      <aside className='sidebar panel'>
        <div className='brand-lockup'>
          <img className='brand-mark brand-mark-image' src='/brand-logo.jpg' alt={BRAND_NAME} />
          <div className='brand-lockup-copy'>
            <h2>{BRAND_NAME}</h2>
            <span>Content Command Center</span>
          </div>
        </div>
        <nav className='sidebar-nav'>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <link.icon className='w-4 h-4' />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className='sidebar-footer'>
          <p className='sidebar-email'>{user?.email}</p>
          <button onClick={onLogout} className='ghost-button danger-button' type='button'>
            <LogOut className='w-4 h-4' /> Sign out
          </button>
        </div>
      </aside>
      <main className='content-shell'>
        <div className='top-bar panel-soft'>
          <div>
            <p className='eyebrow'>{ADMIN_NAME}</p>
            <h1>Publish with consistency</h1>
          </div>
          <div className='top-bar-actions'>
            <button className='top-bar-toggle' type='button' onClick={toggleMode}>
              {isDark ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
        <div className='page-body'>{children}</div>
      </main>
    </div>
  );
}
