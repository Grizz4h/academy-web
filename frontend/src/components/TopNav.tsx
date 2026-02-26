import React from 'react';
import { NavLink } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import UserName from './UserName';
import styles from './TopNav.module.css';

const navTabs = [
  { to: '/', label: 'Start', exact: true },
  { to: '/curriculum', label: 'Tracks' },
  { to: '/history', label: 'Verlauf' },
  { to: '/progress', label: 'Stats' },
];


const TopNav: React.FC = () => (
  <nav className={styles.navbar}>
    <div className={styles.container}>
      <div className={styles.navInner}>
        {/* Row 1: Logo left, Logout right */}
        <div className={styles.brandRow}>
          <NavLink to="/" className={styles.logoLink}>
            <img src="/RINK_TANK_LOGO.png" alt="RINK Tank" className={styles.logo} />
            <span className={styles.navbarBrand}></span>
          </NavLink>
          <LogoutButton />
        </div>
        {/* Row 2: Tabs */}
        <div className={styles.navTabsWrapper}>
          <div className={styles.navTabs}>
            {navTabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
                end={tab.exact}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
        {/* Row 3: UserName under Tabs */}
        <UserName />
      </div>
    </div>
  </nav>
);

export default TopNav;
