import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api, type Session } from '../api';
import LogoutButton from './LogoutButton';
import UserName from './UserName';
import PuxWalletButton from './rewards/PuxWalletButton';
import { useUser } from '../context/UserContext';
import { getSessionRoute } from '../features/lab/sessionRouting';
import {
  getHiddenNavTabs,
  getPublicNavTabs,
  isDevNavEnabled,
  setDevNavEnabled,
} from '../config/featureFlags';
import { navTutorialTarget } from '../features/tutorial';
import { AccountPillFrame } from './profile/AccountPillFrame';
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
  const [devNav, setDevNav] = useState(() => isDevNavEnabled());
  const [devHint, setDevHint] = useState('');
  const logoClicksRef = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });
  const navTabsWrapperRef = useRef<HTMLDivElement | null>(null);

  const { data: activeSessions } = useQuery({
    queryKey: ['sessions', user, 'IN_PROGRESS'],
    queryFn: () => api.getSessions(user || undefined, 'IN_PROGRESS'),
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const activeSession = activeSessions
    ? [...activeSessions]
      .filter(session => session.state === 'IN_PROGRESS' && !session.is_dummy)
      .sort((a, b) => getSessionSortDate(b) - getSessionSortDate(a))[0]
      || [...activeSessions]
        .filter(session => session.state === 'IN_PROGRESS')
        .sort((a, b) => getSessionSortDate(b) - getSessionSortDate(a))[0]
    : undefined;

  useEffect(() => {
    return () => {
      if (logoClicksRef.current.timer) window.clearTimeout(logoClicksRef.current.timer);
    };
  }, []);

  // Reset tab scroller so the session chip (first item) stays visible — sticky inside
  // overflow-x is unreliable on iOS Safari and scrollIntoView can scroll the wrong ancestor.
  useEffect(() => {
    const wrapper = navTabsWrapperRef.current
    if (!activeSession || !wrapper) return
    wrapper.scrollLeft = 0
  }, [activeSession?.id])

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
      <div className={styles.glassBar} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.navInner}>
          <div className={styles.brandRow}>
            <NavLink to="/" className={styles.logoLink} onClick={handleLogoClick}>
              <picture>
                <source media="(max-width: 899px)" srcSet="/RINK_TANK_LOGO-2.png" />
                <img src="/RINK_TANK_LOGO.png" alt="RINK Tank" className={styles.logo} />
              </picture>
            </NavLink>

            <div ref={navTabsWrapperRef} className={styles.navTabsWrapper}>
              <div className={styles.navTabs}>
                {activeSession && (
                  <NavLink
                    to={getSessionRoute(activeSession)}
                    className={({ isActive }) =>
                      [
                        styles.navLink,
                        styles.activeSessionLink,
                        isActive ? styles.navLinkActive : '',
                      ].filter(Boolean).join(' ')
                    }
                    title={`Aktive Session · ${getSessionContext(activeSession)}`}
                  >
                    <span className={styles.activeSessionPulse} aria-hidden="true" />
                    <span className={styles.activeSessionText}>
                      <span>Aktive Session</span>
                      <span>{getSessionContext(activeSession)} läuft</span>
                    </span>
                  </NavLink>
                )}
                {navTabs.map(tab => (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                    end={tab.exact}
                    {...(navTutorialTarget(tab.to) ? { 'data-tutorial-id': navTutorialTarget(tab.to) } : {})}
                  >
                    {tab.label}
                  </NavLink>
                ))}
                {devNav && (
                  <NavLink
                    to="/dev"
                    className={({ isActive }) =>
                      isActive
                        ? `${styles.navLink} ${styles.navLinkActive} ${styles.devLink}`
                        : `${styles.navLink} ${styles.devLink}`
                    }
                  >
                    Dev
                  </NavLink>
                )}
              </div>
            </div>

            <AccountPillFrame className={styles.userSection} frameId={account?.profile?.frameId}>
              {devHint && <span className={styles.devHint}>{devHint}</span>}
              <UserName />
              <span className={styles.userActions}>
                {user && <PuxWalletButton />}
                <LogoutButton />
              </span>
            </AccountPillFrame>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default TopNav;
