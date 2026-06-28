import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, type Session } from '../api';
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
  { to: '/observation/setup', label: 'Obs Setup' },
  { to: '/observation/stats', label: 'Obs Stats' },
  { to: '/ringabout', label: '🎬 Rink About It' },
];


const getSessionSortDate = (session: Session) => new Date(session.created_at).getTime() || 0;

const getSessionContext = (session: Session): string => {
  if (session.game_info?.team_home && session.game_info?.team_away) {
    return session.game_info.team_home + ' vs ' + session.game_info.team_away;
  }

  return session.drill_id || session.drills?.[session.progress?.current_drill_index || 0]?.id || session.module_id;
};

const TopNav: React.FC = () => {
  const { user } = useUser();
  const { rewardState } = useRewards();
  const { data: activeSessions } = useQuery({
    queryKey: ['sessions', user, 'IN_PROGRESS'],
    queryFn: () => api.getSessions(user || undefined, 'IN_PROGRESS'),
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const activeSession = activeSessions
    ? [...activeSessions]
      .filter(session => session.state === 'IN_PROGRESS')
      .sort((a, b) => getSessionSortDate(b) - getSessionSortDate(a))[0]
    : undefined;

  return (
    <nav className={styles.navbar} data-top-nav="true">
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
                <React.Fragment key={tab.to}>
                  {tab.to === "/history" && activeSession && (
                    <NavLink
                      to={"/session/" + activeSession.id}
                      className={({ isActive }) =>
                        isActive
                          ? styles.navLink + " " + styles.navLinkActive + " " + styles.activeSessionLink
                          : styles.navLink + " " + styles.activeSessionLink
                      }
                    >
                      <span className={styles.activeSessionPulse} aria-hidden="true" />
                      <span className={styles.activeSessionText}>
                        <span>Aktive Session</span>
                        <span>{getSessionContext(activeSession)} läuft</span>
                      </span>
                    </NavLink>
                  )}
                  <NavLink
                    to={tab.to}
                    className={({ isActive }) =>
                      isActive ? styles.navLink + " " + styles.navLinkActive : styles.navLink
                    }
                    end={tab.exact}
                  >
                    {tab.label}
                  </NavLink>
                </React.Fragment>
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
