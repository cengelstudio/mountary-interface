import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/bottom-nav.module.scss';

const icons = {
  disks: (selected: boolean) => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  devices: (selected: boolean) => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  logout: (selected: boolean) => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navs = [
    { to: '/disks', label: 'Diskler', icon: icons.disks },
    { to: '/devices', label: 'Aygıtlar', icon: icons.devices },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navs.map(nav => {
        const selected = location.pathname.startsWith(nav.to);
        return (
          <Link
            key={nav.to}
            to={nav.to}
            className={`${styles.bottomNavItem} ${selected ? styles.bottomNavItemActive : ''}`}
          >
            {nav.icon(selected)}
            <span>{nav.label}</span>
          </Link>
        );
      })}
      <button
        className={styles.bottomNavItem}
        onClick={() => { logout(); navigate('/login'); }}
      >
        {icons.logout(false)}
        <span>Çıkış</span>
      </button>
    </nav>
  );
};

export default BottomNav;
