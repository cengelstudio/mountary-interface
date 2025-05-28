import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header>
        <nav>
          <ul>
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/about">Hakkımızda</Link></li>
            <li><Link to="/contact">İletişim</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        {children}
      </main>

      <footer>
        <p>&copy; 2024 Track Interface. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
};

export default Layout;
