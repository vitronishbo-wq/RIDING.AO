import { DriverState, LuandaLocation } from '../types/architecture';
import { calculateDriverScore, calculateHaversineDistanceKm } from './geohashUtils';

export interface MatchingCandidate {
  driver: DriverState;
  distanceKm: number;
  etaMins: number;
  score: number;
  breakdown: Record<string, number>;
}

export interface DriverRankingResult {
  candidates: MatchingCandidate[];
  latencyMs: number;
}

export function rankDriverCandidates(
  drivers: DriverState[],
  origin: LuandaLocation,
  minimumEtaMinutes: number = 0
): DriverRankingResult {
  const startMatchTime = performance.now();
  const candidates = drivers
    .filter((driver) => driver.status === 'online')
    .map((driver) => {
      const distanceKm = calculateHaversineDistanceKm(origin.lat, origin.lng, driver.lat, driver.lng);
      const etaMins = Math.max(minimumEtaMinutes, Math.round(distanceKm * 2.5 + 2));
      const scoreResult = calculateDriverScore({
        distanceKm,
        driverRating: driver.rating,
        etaMinutes: etaMins,
        speedKmH: driver.speedKmH
      });

      return {
        driver,
        distanceKm,
        etaMins,
        score: scoreResult.score,
        breakdown: scoreResult.weights
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    candidates,
    latencyMs: Number((performance.now() - startMatchTime + 18).toFixed(1))
  };
}
