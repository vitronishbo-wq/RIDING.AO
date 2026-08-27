/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Cost Optimization & Quota Guard Engine
 * 
 * Objectives:
 * 1. Eliminate expensive external API calls (e.g., Google Maps Places/Directions APIs) by using local mathematical geohash & anchor routing.
 * 2. Eliminate redundant Firestore reads via in-memory TTL caching with stale-while-revalidate semantics.
 * 3. Batch and debounce high-frequency state writes (e.g., GPS telemetry and driver heartbeats) to prevent runaway Firestore write billing.
 * 4. Real-time cost avoidance metrics tracking.
 */

import { strategicCache, CacheTier } from './strategicCache';

interface CostAvoidanceMetrics {
  cachedFirestoreReadsSaved: number;
  localGeocodingCallsSaved: number;
  batchedWritesSaved: number;
  estimatedUsdSaved: number;
  estimatedAoaSaved: number;
}

// Unit cost assumptions based on standard Cloud pricing (Firestore + Maps APIs)
// - Firestore Read: ~$0.06 per 100,000 reads ($0.0000006 / read)
// - Places / Geocoding API: ~$5.00 per 1,000 requests ($0.005 / request)
// - Directions / Matrix API: ~$10.00 per 1,000 requests ($0.010 / request)
// - USD to AOA exchange: ~915 AOA / USD
const COST_PER_READ_USD = 0.0000006;
const COST_PER_GEOCODE_USD = 0.005;
const COST_PER_WRITE_USD = 0.0000018;
const USD_TO_AOA_RATE = 915;

class CostOptimizer {
  private metrics: CostAvoidanceMetrics = {
    cachedFirestoreReadsSaved: 0,
    localGeocodingCallsSaved: 0,
    batchedWritesSaved: 0,
    estimatedUsdSaved: 0,
    estimatedAoaSaved: 0,
  };

  /**
   * Fetch from strategic cache with specified tier enforcement
   */
  async getOrFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    tier: CacheTier = CacheTier.TIER_2_SHORT_LIVED,
    customTtlMs?: number
  ): Promise<T> {
    const prevHits = strategicCache.getStats().hits;
    const result = await strategicCache.execute(cacheKey, tier, fetcher, customTtlMs);
    const newHits = strategicCache.getStats().hits;

    if (newHits > prevHits) {
      this.recordSavedRead();
    }

    return result;
  }

  /**
   * Invalidate specific cache key or prefix
   */
  invalidate(keyOrPrefix: string): void {
    strategicCache.invalidatePrefix(keyOrPrefix);
  }

  /**
   * Invalidate a specific tier
   */
  invalidateTier(tier: CacheTier): void {
    strategicCache.invalidateTier(tier);
  }

  /**
   * Clear full strategic cache
   */
  clearCache(): void {
    strategicCache.clearAll();
  }

  /**
   * Record when local offline compute substitutes a paid third-party API call
   */
  recordLocalComputeSaved(type: 'geocoding' | 'directions' | 'read' | 'write'): void {
    if (type === 'geocoding' || type === 'directions') {
      this.metrics.localGeocodingCallsSaved += 1;
      this.metrics.estimatedUsdSaved += COST_PER_GEOCODE_USD;
    } else if (type === 'read') {
      this.recordSavedRead();
    } else if (type === 'write') {
      this.metrics.batchedWritesSaved += 1;
      this.metrics.estimatedUsdSaved += COST_PER_WRITE_USD;
    }
    this.metrics.estimatedAoaSaved = this.metrics.estimatedUsdSaved * USD_TO_AOA_RATE;
  }

  private recordSavedRead(): void {
    this.metrics.cachedFirestoreReadsSaved += 1;
    this.metrics.estimatedUsdSaved += COST_PER_READ_USD;
    this.metrics.estimatedAoaSaved = this.metrics.estimatedUsdSaved * USD_TO_AOA_RATE;
  }

  /**
   * Get current cost avoidance statistics
   */
  getMetrics(): CostAvoidanceMetrics {
    return { ...this.metrics };
  }
}

export const costOptimizer = new CostOptimizer();

