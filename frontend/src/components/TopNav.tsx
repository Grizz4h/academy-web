import React from 'react';
import { NavLink } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import Pill from './Pill';
import UserName from './UserName';
import { useUser } from '../context/UserContext';
import { formatPux, useRewards } from '../features/rewards';
import styles from './TopNav.module.css';

const navTabs = [
  { to: '/', label: 'Start', exact: true },
  { to: '/curriculum', label: 'Tracks' },
  { to: '/history', label: 'Verlauf' },
  { to: '/progress', label: 'Stats' },
];


const TopNav: React.FC = () => {
  const { user } = useUser();
  const { rewardState } = useRewards();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navInner}>
          {/* Row 1: Logo left, Logout right */}
          <div className={styles.brandRow}>
            <NavLink to="/" className={styles.logoLink}>
              <img src="/RINK_TANK_LOGO.png" alt="RINK Tank" className={styles.logo} />
              <span className={styles.navbarBrand}></span>
            </NavLink>
            <div className={styles.userSection}>
              {user && <Pill className={styles.rewardPill}>{formatPux(rewardState.currency.PUX || 0)}</Pill>}
              <LogoutButton />
            </div>
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
}

export default TopNav;
