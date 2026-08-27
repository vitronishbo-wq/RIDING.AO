/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - SPA Client Router & Deep-Linking Engine
 * Guarantees 100% SPA navigation coverage, URL-State synchronisation,
 * browser history support (Back/Forward), and custom 404 route fallback.
 */

import { ShellViewMode } from '../types/architecture';

export type MasterTab =
  | 'shell'
  | 'simulator'
  | 'constitution'
  | 'matching'
  | 'topology'
  | 'database'
  | 'api'
  | 'design'
  | 'analytics'
  | 'finance'
  | 'gmail'
  | 'chat';

export const VALID_MASTER_TABS: MasterTab[] = [
  'shell',
  'simulator',
  'constitution',
  'matching',
  'topology',
  'database',
  'api',
  'design',
  'analytics',
  'finance',
  'gmail',
  'chat'
];

export interface ParsedRoute {
  shellMode: ShellViewMode;
  activeTab: MasterTab;
  isKnownRoute: boolean;
  rawPath: string;
  normalizedPath: string;
  queryParams: Record<string, string>;
}

/**
 * Parses the current window.location into structured SPA state.
 * Supports standard pathnames, search query params, and hash routes.
 */
export function parseRoute(pathname = '', search = '', hash = ''): ParsedRoute {
  const cleanPathname = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  const queryParams: Record<string, string> = {};

  if (search) {
    try {
      const params = new URLSearchParams(search);
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
    } catch {
      // safe fallback
    }
  }

  // Also check hash-based routes (e.g. #/driver or #/master/topology)
  let effectivePath = cleanPathname;
  if (hash && hash.startsWith('#/')) {
    effectivePath = hash.substring(1).toLowerCase().replace(/\/+$/, '') || '/';
  }

  // 1. Root / Passenger Routes
  if (effectivePath === '/' || effectivePath === '/passenger' || effectivePath === '/public' || effectivePath === '/portal') {
    return {
      shellMode: 'public_passenger',
      activeTab: 'shell',
      isKnownRoute: true,
      rawPath: pathname,
      normalizedPath: effectivePath === '/' ? '/' : '/passenger',
      queryParams
    };
  }

  // 2. Driver Routes
  if (effectivePath === '/driver' || effectivePath === '/motorista' || effectivePath === '/cockpit') {
    return {
      shellMode: 'driver_view',
      activeTab: 'shell',
      isKnownRoute: true,
      rawPath: pathname,
      normalizedPath: '/driver',
      queryParams
    };
  }

  // 3. Master / Admin Ecosystem Routes
  if (effectivePath === '/master' || effectivePath === '/admin' || effectivePath === '/founder') {
    const requestedTab = queryParams['tab'] as MasterTab | undefined;
    const activeTab = requestedTab && VALID_MASTER_TABS.includes(requestedTab) ? requestedTab : 'shell';
    return {
      shellMode: 'master_ecosystem',
      activeTab,
      isKnownRoute: true,
      rawPath: pathname,
      normalizedPath: `/master/${activeTab}`,
      queryParams
    };
  }

  // 4. Nested Master Routes: /master/:tab or /admin/:tab
  const masterPrefixes = ['/master/', '/admin/', '/founder/'];
  for (const prefix of masterPrefixes) {
    if (effectivePath.startsWith(prefix)) {
      const sub = effectivePath.substring(prefix.length).split('/')[0] as MasterTab;
      if (VALID_MASTER_TABS.includes(sub)) {
        return {
          shellMode: 'master_ecosystem',
          activeTab: sub,
          isKnownRoute: true,
          rawPath: pathname,
          normalizedPath: `/master/${sub}`,
          queryParams
        };
      }
    }
  }

  // 5. Query param based mode override (e.g. ?mode=driver or ?mode=master&tab=finance)
  if (queryParams['mode'] === 'driver') {
    return {
      shellMode: 'driver_view',
      activeTab: 'shell',
      isKnownRoute: true,
      rawPath: pathname,
      normalizedPath: '/driver',
      queryParams
    };
  }

  if (queryParams['mode'] === 'master' || queryParams['mode'] === 'admin') {
    const requestedTab = queryParams['tab'] as MasterTab | undefined;
    const activeTab = requestedTab && VALID_MASTER_TABS.includes(requestedTab) ? requestedTab : 'shell';
    return {
      shellMode: 'master_ecosystem',
      activeTab,
      isKnownRoute: true,
      rawPath: pathname,
      normalizedPath: `/master/${activeTab}`,
      queryParams
    };
  }

  // 6. Unknown route fallback
  return {
    shellMode: 'public_passenger',
    activeTab: 'shell',
    isKnownRoute: false,
    rawPath: pathname,
    normalizedPath: effectivePath,
    queryParams
  };
}

/**
 * Builds canonical URL path for the given shell mode and tab.
 */
export function buildCanonicalPath(shellMode: ShellViewMode, tab: MasterTab = 'shell'): string {
  switch (shellMode) {
    case 'public_passenger':
      return '/passenger';
    case 'driver_view':
      return '/driver';
    case 'master_ecosystem':
      return `/master/${tab}`;
    default:
      return '/';
  }
}

/**
 * Client-Side SPA Navigation Helper
 * Updates browser history smoothly and triggers custom event for immediate sync.
 */
export function navigateToSpa(
  pathOrMode: string | ShellViewMode,
  options?: { tab?: MasterTab; replace?: boolean }
): void {
  if (typeof window === 'undefined') return;

  let targetPath = '/';
  if (pathOrMode === 'public_passenger') {
    targetPath = '/passenger';
  } else if (pathOrMode === 'driver_view') {
    targetPath = '/driver';
  } else if (pathOrMode === 'master_ecosystem') {
    targetPath = `/master/${options?.tab || 'shell'}`;
  } else if (typeof pathOrMode === 'string') {
    targetPath = pathOrMode.startsWith('/') ? pathOrMode : `/${pathOrMode}`;
  }

  if (window.location.pathname === targetPath && !options?.replace) {
    return;
  }

  if (options?.replace) {
    window.history.replaceState({ path: targetPath }, '', targetPath);
  } else {
    window.history.pushState({ path: targetPath }, '', targetPath);
  }

  // Dispatch custom navigation event for reactive listeners
  window.dispatchEvent(new CustomEvent('riding:spa-navigation', { detail: { path: targetPath } }));
}
