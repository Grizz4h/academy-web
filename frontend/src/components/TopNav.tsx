import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  type NavFeature,
} from '../config/featureFlags';
import { navTutorialTarget } from '../features/tutorial';
import { AccountPillFrame } from './profile/AccountPillFrame';
import { useHorizontalScroll } from '../utils/useHorizontalScroll';
import { isCoreNavTile, isSecondaryNavTile, NavTabIcon } from './TopNavTabIcons';
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

function NavTabLink({ tab }: { tab: NavFeature }) {
  const isTile = isCoreNavTile(tab.to) || isSecondaryNavTile(tab.to)
  return (
    <NavLink
      to={tab.to}
      className={({ isActive }) =>
        [
          styles.navLink,
          isTile ? styles.navLinkTile : '',
          isActive ? styles.navLinkActive : '',
          tab.to === '/dev' ? styles.devLink : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
      end={tab.exact}
      {...(navTutorialTarget(tab.to) ? { 'data-tutorial-id': navTutorialTarget(tab.to) } : {})}
    >
      {isTile && <NavTabIcon to={tab.to} className={styles.navTileIcon} />}
      <span className={styles.navLabel}>{tab.label}</span>
    </NavLink>
  )
}

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

  useHorizontalScroll(navTabsWrapperRef, { draggingClass: styles.navTabsDragging })

  const isAdmin = Boolean(account?.is_admin);
  const isDevAccess = Boolean(account?.is_dev_access);
  const creatorMode = Boolean(account?.creator_mode);

  const handleLogoClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const currentlyOn = isDevNavEnabled();
    // Production: dev-access users may turn Dev chrome ON. Turning OFF stays allowed.
    if (import.meta.env.PROD && !isAdmin && !isDevAccess && !currentlyOn) return;

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

    const next = !currentlyOn;
    setDevNavEnabled(next);
    setDevNav(next);
    setDevHint(next ? 'Dev-Nav an' : 'Dev-Nav aus');
    window.setTimeout(() => setDevHint(''), 1600);
  }, [isAdmin, isDevAccess]);

  const publicTabs = getPublicNavTabs({ creatorMode });
  const hiddenTabs = getHiddenNavTabs();
  const showDevChrome = devNav && (import.meta.env.DEV || isAdmin || isDevAccess);

  const navTabs = useMemo(() => {
    const tabs = showDevChrome ? [...publicTabs, ...hiddenTabs] : publicTabs
    const primary = tabs.filter((tab) => isCoreNavTile(tab.to))
    const secondary = tabs.filter((tab) => !isCoreNavTile(tab.to))
    return [
      ...primary,
      ...secondary,
      ...(devNav ? [{ to: '/dev', label: 'Dev', navVisible: false, group: 'core' as const }] : []),
    ]
  }, [publicTabs, hiddenTabs, showDevChrome, devNav]);

  return (
    <nav className={styles.navbar} data-top-nav="true">
      <div className={styles.glassBar} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.navInner}>
          <div className={styles.brandRow}>
            <NavLink to="/" className={styles.logoLink} onClick={handleLogoClick}>
              <picture>
                <source media="(max-width: 899px)" srcSet="/RINK_TANK_LOGO-2_v2.png" />
                <img src="/RINK_TANK_LOGO_v2.png" alt="rInQ Tank" className={styles.logo} />
              </picture>
            </NavLink>

            <div
              ref={navTabsWrapperRef}
              className={styles.navTabsWrapper}
              aria-label="Navigation"
              role="region"
            >
              <div className={styles.navCluster}>
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
                {navTabs.map((tab) => (
                  <NavTabLink key={tab.to} tab={tab} />
                ))}
              </div>
            </div>

            <div className={styles.identityCluster}>
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
      </div>
    </nav>
  );
}

export default TopNav;
