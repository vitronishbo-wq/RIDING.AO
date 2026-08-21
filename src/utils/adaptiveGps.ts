/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Adaptive GPS engine conforming strictly to Chapter 5 of the GO.BRO.AAO Constitution:
 * - Parado: 0 updates/min
 * - Andando (< 5 km/h): 15 segundos
 * - Velocidade média (5~30 km/h): 8 segundos
 * - Alta (> 30 km/h): 3 segundos
 */

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
