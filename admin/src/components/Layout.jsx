import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Settings, LogOut, Users, HeartHandshake, Video, Moon, Sun, Menu, X } from 'lucide-react';
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className='admin-shell'>
      <div
        className={`sidebar-overlay ${menuOpen ? 'sidebar-overlay-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden='true'
      />
      <aside className={`sidebar panel ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className='brand-lockup'>
          <img className='brand-mark brand-mark-image' src='/brand-logo.jpg' alt={BRAND_NAME} />
          <div className='brand-lockup-copy'>
            <h2>{BRAND_NAME}</h2>
            <span>Content Command Center</span>
          </div>
          <button
            className='sidebar-close'
            type='button'
            onClick={() => setMenuOpen(false)}
            aria-label='Close menu'
          >
            <X className='w-5 h-5' />
          </button>
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
          <div className='top-bar-title'>
            <button
              className='menu-toggle'
              type='button'
              onClick={() => setMenuOpen(true)}
              aria-label='Open menu'
            >
              <Menu className='w-5 h-5' />
            </button>
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
