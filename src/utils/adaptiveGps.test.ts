import { describe, expect, it } from 'vitest';
import { GnssRawTelemetry } from '../types/architecture';
import {
  ADAPTIVE_GPS_RULES,
  DEAD_RECKONING_LIMITS,
  computeDeadReckoningPosition,
  getAdaptiveGpsInterval,
  validateGnssTelemetryPoint
} from './adaptiveGps';

describe('ADAPTIVE_GPS_RULES', () => {
  it('declares the four constitutional states with decreasing intervals', () => {
    expect(ADAPTIVE_GPS_RULES.map((r) => r.intervalSec)).toEqual([0, 15, 8, 3]);
  });
});

describe('getAdaptiveGpsInterval', () => {
  it('sleeps the sampler while stopped', () => {
    expect(getAdaptiveGpsInterval(0)).toMatchObject({ intervalSec: 0, state: 'idle' });
    expect(getAdaptiveGpsInterval(0.5)).toMatchObject({ intervalSec: 0, state: 'idle' });
  });

  it('samples every 15s while walking (< 5 km/h)', () => {
    expect(getAdaptiveGpsInterval(0.6)).toMatchObject({ intervalSec: 15, state: 'slow' });
    expect(getAdaptiveGpsInterval(4.99)).toMatchObject({ intervalSec: 15, state: 'slow' });
  });

  it('samples every 8s at urban speed (5 - 30 km/h)', () => {
    expect(getAdaptiveGpsInterval(5)).toMatchObject({ intervalSec: 8, state: 'medium' });
    expect(getAdaptiveGpsInterval(30)).toMatchObject({ intervalSec: 8, state: 'medium' });
  });

  it('samples every 3s above 30 km/h', () => {
    expect(getAdaptiveGpsInterval(30.1)).toMatchObject({ intervalSec: 3, state: 'fast' });
    expect(getAdaptiveGpsInterval(120)).toMatchObject({ intervalSec: 3, state: 'fast' });
  });

  it('always returns a human readable label', () => {
    for (const speed of [0, 2, 20, 80]) {
      expect(getAdaptiveGpsInterval(speed).label.length).toBeGreaterThan(0);
    }
  });

  it('matches the interval declared in the rules table for each band', () => {
    expect(getAdaptiveGpsInterval(0).intervalSec).toBe(ADAPTIVE_GPS_RULES[0].intervalSec);
    expect(getAdaptiveGpsInterval(2).intervalSec).toBe(ADAPTIVE_GPS_RULES[1].intervalSec);
    expect(getAdaptiveGpsInterval(20).intervalSec).toBe(ADAPTIVE_GPS_RULES[2].intervalSec);
    expect(getAdaptiveGpsInterval(50).intervalSec).toBe(ADAPTIVE_GPS_RULES[3].intervalSec);
  });
});

describe('computeDeadReckoningPosition', () => {
  const now = 1_700_000_000_000;
  const lastPoint = { lat: -8.8147, lng: 13.2355, headingDeg: 0, speedKmH: 36, timestamp: now };

  it('reports a direct high confidence fix within the first second', () => {
    const result = computeDeadReckoningPosition(lastPoint, now + 500);
    expect(result).toMatchObject({
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      confidence: 'HIGH',
      deadReckoningSec: 0,
      uncertaintyRadiusM: 5,
      isExtrapolated: false
    });
  });

  it('treats a clock going backwards as a direct fix instead of extrapolating', () => {
    expect(computeDeadReckoningPosition(lastPoint, now - 60_000).confidence).toBe('HIGH');
  });

  it('extrapolates northwards along a 0 degree heading', () => {
    const result = computeDeadReckoningPosition(lastPoint, now + 10_000);
    // 36 km/h = 10 m/s over 10s = 100m north.
    expect(result.confidence).toBe('ESTIMATED_DEAD_RECKONING');
    expect(result.isExtrapolated).toBe(true);
    expect(result.deadReckoningSec).toBe(10);
    expect(result.lat).toBeCloseTo(lastPoint.lat + 100 / 111320, 6);
    expect(result.lng).toBeCloseTo(lastPoint.lng, 10);
    expect(result.uncertaintyRadiusM).toBe(55);
  });

  it('extrapolates eastwards along a 90 degree heading', () => {
    const result = computeDeadReckoningPosition({ ...lastPoint, headingDeg: 90 }, now + 10_000);
    expect(result.lat).toBeCloseTo(lastPoint.lat, 10);
    expect(result.lng).toBeGreaterThan(lastPoint.lng);
  });

  it('keeps the extrapolated position anchored when the driver is stopped', () => {
    const result = computeDeadReckoningPosition({ ...lastPoint, speedKmH: 0 }, now + 5_000);
    expect(result.lat).toBe(lastPoint.lat);
    expect(result.lng).toBe(lastPoint.lng);
    expect(result.uncertaintyRadiusM).toBe(15);
  });

  it('caps the inferred displacement and radius at 200 metres', () => {
    const speeding = { ...lastPoint, speedKmH: 120 };
    const result = computeDeadReckoningPosition(speeding, now + DEAD_RECKONING_LIMITS.MAX_INFERENCE_SECONDS * 1000);
    // Displacement is capped at 200m, so the radius derives from that cap: 200 * 0.4 + 15.
    expect(result.uncertaintyRadiusM).toBe(95);
    const displacementM = (result.lat - lastPoint.lat) * 111320;
    expect(displacementM).toBeLessThanOrEqual(DEAD_RECKONING_LIMITS.MAX_UNCERTAINTY_METERS + 0.001);
  });

  it('freezes the position without fake odometry beyond 15 seconds', () => {
    const result = computeDeadReckoningPosition(lastPoint, now + 30_000);
    expect(result).toMatchObject({
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      confidence: 'LOW_CONFIDENCE_STALE',
      deadReckoningSec: 30,
      uncertaintyRadiusM: DEAD_RECKONING_LIMITS.MAX_UNCERTAINTY_METERS,
      isExtrapolated: false
    });
    expect(result.statusLabel).toContain('Sem Odômetro');
  });

  it('still dead reckons exactly at the 15 second boundary', () => {
    const result = computeDeadReckoningPosition(lastPoint, now + 15_000);
    expect(result.confidence).toBe('ESTIMATED_DEAD_RECKONING');
  });
});

function telemetry(overrides: Partial<GnssRawTelemetry> = {}): GnssRawTelemetry {
  return {
    utcTimestamp: 1_700_000_000_000,
    sequenceId: 1,
    lat: -8.8147,
    lng: 13.2355,
    accuracyRadiusM: 8,
    speedMs: 10,
    headingDeg: 45,
    isMockProvider: false,
    ...overrides
  };
}

describe('validateGnssTelemetryPoint', () => {
  it('accepts a plausible first point and converts speed to km/h', () => {
    const result = validateGnssTelemetryPoint(null, telemetry({ speedMs: 10 }));
    expect(result).toEqual({ isValid: true, sanitizedSpeedKmH: 36 });
  });

  it('rejects mock GPS providers and zeroes the speed', () => {
    const result = validateGnssTelemetryPoint(null, telemetry({ isMockProvider: true, speedMs: 25 }));
    expect(result).toMatchObject({ isValid: false, reason: 'MOCK_GPS_PROVIDER_DETECTED', sanitizedSpeedKmH: 0 });
  });

  it('rejects speeds above the physical urban limit', () => {
    const result = validateGnssTelemetryPoint(null, telemetry({ speedMs: 50 })); // 180 km/h
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('EXCESSIVE_VELOCITY_JUMP');
    expect(result.sanitizedSpeedKmH).toBe(40);
  });

  it('accepts a speed just below the physical limit', () => {
    const belowLimitMs = ((DEAD_RECKONING_LIMITS.MAX_PHYSICAL_SPEED_KMH - 1) * 1000) / 3600;
    const result = validateGnssTelemetryPoint(null, telemetry({ speedMs: belowLimitMs }));
    expect(result.isValid).toBe(true);
    expect(result.sanitizedSpeedKmH).toBeCloseTo(DEAD_RECKONING_LIMITS.MAX_PHYSICAL_SPEED_KMH - 1, 6);
  });

  it('rejects non monotonic timestamps and falls back to the previous speed', () => {
    const prev = telemetry({ speedMs: 5 });
    const result = validateGnssTelemetryPoint(prev, telemetry({ utcTimestamp: prev.utcTimestamp - 1000 }));
    expect(result).toMatchObject({ isValid: false, reason: 'NON_MONOTONIC_TIMESTAMP' });
    expect(result.sanitizedSpeedKmH).toBeCloseTo(18, 6);
  });

  it('rejects duplicated timestamps', () => {
    const prev = telemetry();
    expect(validateGnssTelemetryPoint(prev, telemetry()).reason).toBe('NON_MONOTONIC_TIMESTAMP');
  });

  it('rejects physically impossible acceleration between two points', () => {
    const prev = telemetry({ speedMs: 0 });
    const result = validateGnssTelemetryPoint(
      prev,
      telemetry({ utcTimestamp: prev.utcTimestamp + 1000, speedMs: 20 }) // 20 m/s²
    );
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('ANOMALOUS_ACCELERATION');
    expect(result.sanitizedSpeedKmH).toBe(0);
  });

  it('accepts a realistic acceleration between two points', () => {
    const prev = telemetry({ speedMs: 4 });
    const result = validateGnssTelemetryPoint(prev, telemetry({ utcTimestamp: prev.utcTimestamp + 3000, speedMs: 12 }));
    expect(result.isValid).toBe(true);
    expect(result.sanitizedSpeedKmH).toBeCloseTo(43.2, 6);
  });
});
