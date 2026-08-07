import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, type Session } from '../api';
import LogoutButton from './LogoutButton';
import Pill from './Pill';
import UserName from './UserName';
import { useUser } from '../context/UserContext';
import { formatPux, useRewards } from '../features/rewards';
import { getSessionRoute } from '../features/lab/sessionRouting';
import {
  getHiddenNavTabs,
  getPublicNavTabs,
  isDevNavEnabled,
  setDevNavEnabled,
} from '../config/featureFlags';
import styles from './TopNav.module.css';

const getSessionSortDate = (session: Session) => new Date(session.created_at).getTime() || 0;

const getSessionContext = (session: Session): string => {
  if (session.learning_area === 'lab' && session.lab_mode === 'predict') {
    const matchup = session.game_info?.team_home && session.game_info?.team_away
      ? `${session.game_info.team_home} vs ${session.game_info.team_away}`
      : 'Predict-Session'
    return `Lab · Predict · ${matchup}`
  }

  if (session.game_info?.team_home && session.game_info?.team_away) {
    return session.game_info.team_home + ' vs ' + session.game_info.team_away;
  }

  return session.drill_id || session.drills?.[session.progress?.current_drill_index || 0]?.id || session.module_id;
};

const TopNav: React.FC = () => {
  const { user } = useUser();
  const { rewardState } = useRewards();
  const [devNav, setDevNav] = useState(() => isDevNavEnabled());
  const [devHint, setDevHint] = useState('');
  const logoClicksRef = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });

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

  useEffect(() => {
    return () => {
      if (logoClicksRef.current.timer) window.clearTimeout(logoClicksRef.current.timer);
    };
  }, []);

  const handleLogoClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const state = logoClicksRef.current;
    state.count += 1;

    if (state.timer) window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => {
      state.count = 0;
      state.timer = null;
    }, 900);

    if (state.count < 5) return;

    event.preventDefault();
    state.count = 0;
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }

    const next = !isDevNavEnabled();
    setDevNavEnabled(next);
    setDevNav(next);
    setDevHint(next ? 'Dev-Nav an' : 'Dev-Nav aus');
    window.setTimeout(() => setDevHint(''), 1600);
  }, []);

  const publicTabs = getPublicNavTabs();
  const hiddenTabs = getHiddenNavTabs();
  const navTabs = devNav ? [...publicTabs, ...hiddenTabs] : publicTabs;

  return (
    <nav className={styles.navbar} data-top-nav="true">
      <div className={styles.container}>
        <div className={styles.navInner}>
          {/* Row 1: Logo left, Logout right */}
          <div className={styles.brandRow}>
            <NavLink to="/" className={styles.logoLink} onClick={handleLogoClick}>
              <img src="/RINK_TANK_LOGO.png" alt="RINK Tank" className={styles.logo} />
              <span className={styles.navbarBrand}></span>
            </NavLink>
            <div className={styles.userSection}>
              {devHint && <span className={styles.devHint}>{devHint}</span>}
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
                      to={getSessionRoute(activeSession)}
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
              {devNav && (
                <NavLink
                  to="/dev"
                  className={({ isActive }) =>
                    isActive
                      ? styles.navLink + " " + styles.navLinkActive + " " + styles.devLink
                      : styles.navLink + " " + styles.devLink
                  }
                >
                  Dev
                </NavLink>
              )}
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
