/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Adaptive GPS engine conforming strictly to Chapter 5 of the GO.BRO.AAO Constitution:
 * - Parado: 0 updates/min
 * - Andando (< 5 km/h): 15 segundos
 * - Velocidade média (5~30 km/h): 8 segundos
 * - Alta (> 30 km/h): 3 segundos
 */

import { GnssRawTelemetry, GpsConfidenceLevel } from '../types/architecture';

export interface AdaptiveGpsRule {
  stateName: string;
  speedRange: string;
  intervalSec: number;
  batteryImpact: string;
  bandwidthUsage: string;
}

export const ADAPTIVE_GPS_RULES: AdaptiveGpsRule[] = [
  {
    stateName: 'Parado / Em Espera',
    speedRange: '0 km/h',
    intervalSec: 0,
    batteryImpact: '0% (Dormindo)',
    bandwidthUsage: '0 B/min'
  },
  {
    stateName: 'Andando / Manobra Lenta',
    speedRange: '< 5 km/h',
    intervalSec: 15,
    batteryImpact: 'Mínimo (~0.4%/hora)',
    bandwidthUsage: '1.2 KB/min'
  },
  {
    stateName: 'Velocidade Média Urbana',
    speedRange: '5 - 30 km/h',
    intervalSec: 8,
    batteryImpact: 'Baixo (~1.2%/hora)',
    bandwidthUsage: '2.4 KB/min'
  },
  {
    stateName: 'Alta Velocidade (Vias Rápidas)',
    speedRange: '> 30 km/h',
    intervalSec: 3,
    batteryImpact: 'Moderado (~3.1%/hora)',
    bandwidthUsage: '6.4 KB/min'
  }
];

export function getAdaptiveGpsInterval(speedKmH: number): {
  intervalSec: number;
  label: string;
  state: string;
} {
  if (speedKmH <= 0.5) {
    return {
      intervalSec: 0,
      label: 'Parado (0 updates/min - Economia total de bateria)',
      state: 'idle'
    };
  }
  if (speedKmH < 5) {
    return {
      intervalSec: 15,
      label: '15 segundos (< 5 km/h)',
      state: 'slow'
    };
  }
  if (speedKmH <= 30) {
    return {
      intervalSec: 8,
      label: '8 segundos (5 ~ 30 km/h)',
      state: 'medium'
    };
  }
  return {
    intervalSec: 3,
    label: '3 segundos (> 30 km/h - Alta precisão)',
    state: 'fast'
  };
}

// -------------------------------------------------------------
// DEAD RECKONING LIMITS & PHYSICAL KALMAN-LIKE GNSS FILTER
// Rule: Max 15 seconds OR 200 meters of Dead Reckoning.
// Beyond that: LOW_CONFIDENCE_STALE with static uncertainty circle.
// -------------------------------------------------------------

export const DEAD_RECKONING_LIMITS = {
  MAX_INFERENCE_SECONDS: 15,
  MAX_UNCERTAINTY_METERS: 200,
  MAX_PHYSICAL_SPEED_KMH: 120, // Max plausible urban speed in Luanda
  MAX_PHYSICAL_ACCELERATION_MS2: 15 // Max plausible acceleration
};

export interface DeadReckoningResult {
  lat: number;
  lng: number;
  confidence: GpsConfidenceLevel;
  deadReckoningSec: number;
  uncertaintyRadiusM: number;
  isExtrapolated: boolean;
  statusLabel: string;
}

export function computeDeadReckoningPosition(
  lastValidPoint: { lat: number; lng: number; headingDeg: number; speedKmH: number; timestamp: number },
  currentTime: number
): DeadReckoningResult {
  const elapsedSec = Math.max(0, (currentTime - lastValidPoint.timestamp) / 1000);

  if (elapsedSec <= 1) {
    return {
      lat: lastValidPoint.lat,
      lng: lastValidPoint.lng,
      confidence: 'HIGH',
      deadReckoningSec: 0,
      uncertaintyRadiusM: 5,
      isExtrapolated: false,
      statusLabel: 'Sinal GNSS Direto (Alta Precisão)'
    };
  }

  if (elapsedSec <= DEAD_RECKONING_LIMITS.MAX_INFERENCE_SECONDS) {
    // Linear dead reckoning interpolation
    const speedMs = (lastValidPoint.speedKmH * 1000) / 3600;
    const distanceMeters = Math.min(speedMs * elapsedSec, DEAD_RECKONING_LIMITS.MAX_UNCERTAINTY_METERS);
    const headingRad = (lastValidPoint.headingDeg * Math.PI) / 180;

    // 1 deg lat ≈ 111,320m, 1 deg lng ≈ 111,320m * cos(lat)
    const deltaLat = (distanceMeters * Math.cos(headingRad)) / 111320;
    const deltaLng = (distanceMeters * Math.sin(headingRad)) / (111320 * Math.cos((lastValidPoint.lat * Math.PI) / 180));

    const estimatedRadiusM = Math.max(10, Math.min(distanceMeters * 0.4 + 15, DEAD_RECKONING_LIMITS.MAX_UNCERTAINTY_METERS));

    return {
      lat: lastValidPoint.lat + deltaLat,
      lng: lastValidPoint.lng + deltaLng,
      confidence: 'ESTIMATED_DEAD_RECKONING',
      deadReckoningSec: Math.round(elapsedSec),
      uncertaintyRadiusM: Math.round(estimatedRadiusM),
      isExtrapolated: true,
      statusLabel: `Dead Reckoning Ativo (${Math.round(elapsedSec)}s / Raio: ${Math.round(estimatedRadiusM)}m)`
    };
  }

  // Exceeded 15s or 200m -> Freeze position with uncertainty radius, no fake odometry accumulation
  return {
    lat: lastValidPoint.lat,
    lng: lastValidPoint.lng,
    confidence: 'LOW_CONFIDENCE_STALE',
    deadReckoningSec: Math.round(elapsedSec),
    uncertaintyRadiusM: DEAD_RECKONING_LIMITS.MAX_UNCERTAINTY_METERS,
    isExtrapolated: false,
    statusLabel: `Sinal GNSS Ausente (>15s) - Posição Estática com Incerteza (Sem Odômetro)`
  };
}

export function validateGnssTelemetryPoint(
  prevPoint: GnssRawTelemetry | null,
  newPoint: GnssRawTelemetry
): { isValid: boolean; reason?: string; sanitizedSpeedKmH: number } {
  const speedKmH = (newPoint.speedMs * 3600) / 1000;

  if (newPoint.isMockProvider) {
    return { isValid: false, reason: 'MOCK_GPS_PROVIDER_DETECTED', sanitizedSpeedKmH: 0 };
  }

  if (speedKmH > DEAD_RECKONING_LIMITS.MAX_PHYSICAL_SPEED_KMH) {
    return {
      isValid: false,
      reason: `EXCESSIVE_VELOCITY_JUMP: ${Math.round(speedKmH)} km/h exceeds limit of ${DEAD_RECKONING_LIMITS.MAX_PHYSICAL_SPEED_KMH} km/h`,
      sanitizedSpeedKmH: 40
    };
  }

  if (prevPoint) {
    const deltaSec = (newPoint.utcTimestamp - prevPoint.utcTimestamp) / 1000;
    if (deltaSec <= 0) {
      return { isValid: false, reason: 'NON_MONOTONIC_TIMESTAMP', sanitizedSpeedKmH: prevPoint.speedMs * 3.6 };
    }
    const deltaSpeedMs = Math.abs(newPoint.speedMs - prevPoint.speedMs);
    const accelerationMs2 = deltaSpeedMs / deltaSec;
    if (accelerationMs2 > DEAD_RECKONING_LIMITS.MAX_PHYSICAL_ACCELERATION_MS2) {
      return {
        isValid: false,
        reason: `ANOMALOUS_ACCELERATION: ${accelerationMs2.toFixed(1)} m/s² exceeds physical limit`,
        sanitizedSpeedKmH: prevPoint.speedMs * 3.6
      };
    }
  }

  return { isValid: true, sanitizedSpeedKmH: speedKmH };
}
