import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import styles from '../styles/Layout.module.scss';
import { UserIcon, LogoutIcon } from './icons';
import BottomNav from './BottomNav';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { contentWidth, contentPadding } = useLayout();
    const isDiskPage = location.pathname.startsWith('/disk/');

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.leftSection}>
                        <Link to="/" className={styles.logo}>
                            <img src="/cengelstudio-logo.png" alt="Logo" />
                            <span className={styles.companyName}>Pelikül</span>
                        </Link>
                        <nav className={styles.nav}>
                            <Link to="/disks" className={styles.navItem}>Diskler</Link>
                            <Link to="/devices" className={styles.navItem}>Aygıtlar</Link>
                            {isDiskPage && <span className={styles.navItem}>Disk</span>}
                        </nav>
                    </div>
                    <div className={styles.userSection}>
                        <div className={styles.userMenu}>
                            <div className={styles.userInfo}>
                                <UserIcon />
                                <span>{user?.username}</span>
                            </div>
                            <div className={styles.dropdown}>
                                <button onClick={logout} className={styles.dropdownItem}>
                                    <LogoutIcon />
                                    <span>Çıkış Yap</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className={styles.main} style={{ maxWidth: contentWidth, padding: contentPadding, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {children}
            </main>
            <BottomNav />
            <footer style={{textAlign: 'center', color: '#888', background: '#f3f4f6', padding: '0px 0', fontSize: '1rem', marginBottom: '30px'}}>
                Metehan Alp Saral tarafından sevgi ile geliştirildi &copy; 2025
            </footer>
        </div>
    );
};

export default Layout;
