import { describe, expect, it } from 'vitest';
import {
  calculateDriverScore,
  calculateHaversineDistanceKm,
  encodeGeohash,
  formatAOA
} from './geohashUtils';

describe('calculateHaversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(calculateHaversineDistanceKm(-8.8147, 13.2355, -8.8147, 13.2355)).toBe(0);
  });

  it('computes the distance between Mutamba and Talatona in Luanda', () => {
    expect(calculateHaversineDistanceKm(-8.8147, 13.2355, -8.9182, 13.1802)).toBeCloseTo(12.98, 1);
  });

  it('is symmetric', () => {
    const forward = calculateHaversineDistanceKm(-8.8147, 13.2355, -8.995, 13.256);
    const backward = calculateHaversineDistanceKm(-8.995, 13.256, -8.8147, 13.2355);
    expect(forward).toBe(backward);
  });

  it('rounds the result to two decimals', () => {
    const distance = calculateHaversineDistanceKm(-8.8147, 13.2355, -8.782, 13.355);
    expect(distance).toBe(Number(distance.toFixed(2)));
  });

  it('handles antipodal-scale distances (pole to pole ~ half the meridian)', () => {
    expect(calculateHaversineDistanceKm(-90, 0, 90, 0)).toBeCloseTo(20015.09, 0);
  });
});

describe('encodeGeohash', () => {
  it('encodes with the default precision of 6', () => {
    expect(encodeGeohash(-8.8147, 13.2355)).toHaveLength(6);
  });

  it('encodes known reference coordinates', () => {
    // Reference values from the standard geohash algorithm.
    expect(encodeGeohash(0, 0, 6)).toBe('s00000');
    expect(encodeGeohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
  });

  it('produces a prefix-stable hash as precision grows', () => {
    const short = encodeGeohash(-8.8147, 13.2355, 4);
    const long = encodeGeohash(-8.8147, 13.2355, 9);
    expect(long.startsWith(short)).toBe(true);
  });

  it('only uses base32 geohash characters', () => {
    expect(encodeGeohash(-8.9182, 13.1802, 9)).toMatch(/^[0-9bcdefghjkmnpqrstuvwxyz]+$/);
  });

  it('returns an empty string for a precision of 0', () => {
    expect(encodeGeohash(-8.8147, 13.2355, 0)).toBe('');
  });

  it('gives different hashes for distant locations', () => {
    expect(encodeGeohash(-8.8147, 13.2355)).not.toBe(encodeGeohash(-8.9182, 13.1802));
  });
});

describe('calculateDriverScore', () => {
  const perfect = { distanceKm: 0, driverRating: 5, etaMinutes: 0, speedKmH: 30 };

  it('scores a perfect candidate at 100', () => {
    expect(calculateDriverScore(perfect).score).toBe(100);
  });

  it('exposes the deterministic constitutional weights summing to 1', () => {
    const { weights } = calculateDriverScore(perfect);
    expect(weights).toEqual({ distance: 0.5, rating: 0.25, eta: 0.2, speed: 0.05 });
    expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('is deterministic for the score (only latency varies)', () => {
    const a = calculateDriverScore({ distanceKm: 4, driverRating: 4.5, etaMinutes: 9, speedKmH: 25 });
    const b = calculateDriverScore({ distanceKm: 4, driverRating: 4.5, etaMinutes: 9, speedKmH: 25 });
    expect(a.score).toBe(b.score);
  });

  it('penalises longer distances', () => {
    const near = calculateDriverScore({ ...perfect, distanceKm: 2 }).score;
    const far = calculateDriverScore({ ...perfect, distanceKm: 10 }).score;
    expect(near).toBeGreaterThan(far);
  });

  it('clamps the distance factor at zero beyond the 15 km range', () => {
    const atLimit = calculateDriverScore({ ...perfect, distanceKm: 15 }).score;
    const beyondLimit = calculateDriverScore({ ...perfect, distanceKm: 40 }).score;
    expect(atLimit).toBe(beyondLimit);
  });

  it('clamps the ETA factor at zero beyond 20 minutes', () => {
    const atLimit = calculateDriverScore({ ...perfect, etaMinutes: 20 }).score;
    const beyondLimit = calculateDriverScore({ ...perfect, etaMinutes: 90 }).score;
    expect(atLimit).toBe(beyondLimit);
  });

  it('rewards higher ratings', () => {
    const good = calculateDriverScore({ ...perfect, driverRating: 5 }).score;
    const poor = calculateDriverScore({ ...perfect, driverRating: 3 }).score;
    expect(good - poor).toBeCloseTo(25, 5);
  });

  it('applies the reduced speed bonus outside the plausible 0-60 km/h band', () => {
    const inBand = calculateDriverScore({ ...perfect, speedKmH: 60 }).score;
    const stopped = calculateDriverScore({ ...perfect, speedKmH: 0 }).score;
    const tooFast = calculateDriverScore({ ...perfect, speedKmH: 90 }).score;
    expect(stopped).toBe(tooFast);
    expect(inBand - stopped).toBeCloseTo(2, 5);
  });

  it('reports a plausible simulated latency', () => {
    const { latencyMs } = calculateDriverScore(perfect);
    expect(latencyMs).toBeGreaterThanOrEqual(12);
    expect(latencyMs).toBeLessThan(25);
  });

  it('can produce a negative score for a rating below the 3.0 floor', () => {
    const worst = calculateDriverScore({ distanceKm: 40, driverRating: 1, etaMinutes: 60, speedKmH: 0 });
    expect(worst.score).toBeLessThan(0);
  });
});

describe('formatAOA', () => {
  it('formats using the Kwanza symbol instead of the AOA code', () => {
    const formatted = formatAOA(4200);
    expect(formatted).toContain('Kz');
    expect(formatted).not.toContain('AOA');
  });

  it('drops fractional digits', () => {
    expect(formatAOA(4200.67)).toContain('4');
    expect(formatAOA(4200.67)).not.toMatch(/[.,]\d\d\b/);
  });

  it('formats zero and negative amounts', () => {
    expect(formatAOA(0)).toContain('0');
    expect(formatAOA(-1500)).toMatch(/-/);
  });
});
