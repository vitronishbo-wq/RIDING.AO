/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao Performance & Network Optimization Engine
 * Tailored for low-spec mobile devices and slow/metered networks (2G/3G/4G Angola Context).
 */

import { useState, useEffect } from 'react';

// Extended NetworkInformation interface
interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  rtt?: number;
  downlink?: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  deviceMemory?: number;
}

export interface PerformanceProfile {
  isLowSpec: boolean;
  isSlowNetwork: boolean;
  saveData: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  targetFps: number;
  enableBlurEffects: boolean;
  enableComplexAnimations: boolean;
  forceLowDataMode: boolean;
  toggleForceLowDataMode: () => void;
}

const STORAGE_KEY_FORCE_LOW_DATA = 'riding_ao_force_low_data_v1';

export function getSystemPerformanceProfile(forceLowData = false): Omit<PerformanceProfile, 'forceLowDataMode' | 'toggleForceLowDataMode'> {
  if (typeof window === 'undefined') {
    return {
      isLowSpec: false,
      isSlowNetwork: false,
      saveData: false,
      effectiveType: '4g',
      targetFps: 60,
      enableBlurEffects: true,
      enableComplexAnimations: true,
    };
  }

  const nav = navigator as NavigatorWithConnection;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const saveData = Boolean(conn?.saveData || forceLowData);
  const effectiveType = conn?.effectiveType || 'unknown';
  const isSlowNetwork = saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g' || (conn?.rtt ? conn.rtt > 350 : false);

  const deviceMemory = nav.deviceMemory || 4;
  const hardwareConcurrency = nav.hardwareConcurrency || 4;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A device is considered low-spec if memory <= 2GB, <= 4 cores or user enabled data saver
  const isLowSpec = forceLowData || deviceMemory <= 2 || hardwareConcurrency <= 2 || prefersReducedMotion;

  const targetFps = forceLowData || isSlowNetwork || isLowSpec ? 24 : 60;
  const enableBlurEffects = !forceLowData && !isLowSpec && !isSlowNetwork;
  const enableComplexAnimations = !forceLowData && !prefersReducedMotion && !isLowSpec;

  return {
    isLowSpec,
    isSlowNetwork,
    saveData,
    effectiveType,
    targetFps,
    enableBlurEffects,
    enableComplexAnimations,
  };
}

export function usePerformanceProfile(): PerformanceProfile {
  const [forceLowData, setForceLowData] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_FORCE_LOW_DATA) === 'true';
    } catch {
      return false;
    }
  });

  const [profile, setProfile] = useState(() => getSystemPerformanceProfile(forceLowData));

  useEffect(() => {
    const updateProfile = () => {
      setProfile(getSystemPerformanceProfile(forceLowData));
    };

    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (conn) {
      conn.addEventListener('change', updateProfile);
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', updateProfile);

    window.addEventListener('online', updateProfile);
    window.addEventListener('offline', updateProfile);

    return () => {
      if (conn) {
        conn.removeEventListener('change', updateProfile);
      }
      motionQuery.removeEventListener?.('change', updateProfile);
      window.removeEventListener('online', updateProfile);
      window.removeEventListener('offline', updateProfile);
    };
  }, [forceLowData]);

  const toggleForceLowDataMode = () => {
    setForceLowData((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_FORCE_LOW_DATA, String(next));
      } catch {
        // Ignore storage errors
      }
      setProfile(getSystemPerformanceProfile(next));
      return next;
    });
  };

  return {
    ...profile,
    forceLowDataMode: forceLowData,
    toggleForceLowDataMode,
  };
}
