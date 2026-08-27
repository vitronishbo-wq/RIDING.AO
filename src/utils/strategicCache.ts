/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Strategic Cache & Consistency Controller
 * 
 * CORE PRINCIPLE:
 * "Cache strategically where strictly safe (high read/low volatility), 
 * NEVER where consistency is mission-critical (Financial Ledger, Active Dispatch, Auth)."
 */

export enum CacheTier {
  /**
   * TIER 0: ZERO CACHE (Absolute Consistency / ACID)
   * Financial transactions, Ledger entries, Wallet balances, Active Ride State, Auth/Shamir.
   */
  TIER_0_NO_CACHE = 'TIER_0_NO_CACHE',

  /**
   * TIER 1: NEAR-REALTIME (Volatile / 5s TTL + Instant Event-Driven Invalidation)
   * Driver online presence, GPS heatmap clustering, active chat typing indicators.
   */
  TIER_1_NEAR_REALTIME = 'TIER_1_NEAR_REALTIME',

  /**
   * TIER 2: SHORT-LIVED AGGREGATIONS (30s - 60s TTL)
   * Completed historical trips, driver ratings summary, performance metrics.
   */
  TIER_2_SHORT_LIVED = 'TIER_2_SHORT_LIVED',

  /**
   * TIER 3: STATIC / IMMUTABLE CATALOG (15m - 60m TTL)
   * Luanda Urban Anchors & POIs, Constitution rules, Tax/VAT rates, AppyPay bank codes.
   */
  TIER_3_STATIC_CATALOG = 'TIER_3_STATIC_CATALOG',
}

export interface CacheEntry<T> {
  key: string;
  data: T;
  tier: CacheTier;
  cachedAt: number;
  expiresAt: number;
  hits: number;
  sizeBytesEstimated: number;
}

export interface StrategicCacheStats {
  hits: number;
  misses: number;
  bypasses: number;
  evictions: number;
  activeEntriesCount: number;
  estimatedMemoryBytes: number;
  tierBreakdown: Record<CacheTier, { entries: number; hits: number; misses: number; bypasses: number }>;
}

export interface CacheTierConfig {
  tier: CacheTier;
  ttlMs: number;
  allowCache: boolean;
  description: string;
  invalidationTrigger: string;
  examples: string[];
}

export const STRATEGIC_CACHE_TIER_RULES: Record<CacheTier, CacheTierConfig> = {
  [CacheTier.TIER_0_NO_CACHE]: {
    tier: CacheTier.TIER_0_NO_CACHE,
    ttlMs: 0,
    allowCache: false,
    description: 'Nenhum cache permitido. Leituras sempre diretas da fonte de verdade para evitar double-spending ou corridas fantasma.',
    invalidationTrigger: 'N/A (Bypass permanente)',
    examples: [
      'Lançamentos contábeis de partida dobrada (Ledger)',
      'Saldos de carteiras e conciliações AppyPay',
      'Transições de estado de corrida ativa (REQUESTED -> ACCEPTED)',
      'Chaves criptográficas Shamir e privilégios de segurança'
    ]
  },
  [CacheTier.TIER_1_NEAR_REALTIME]: {
    tier: CacheTier.TIER_1_NEAR_REALTIME,
    ttlMs: 5000, // 5 seconds
    allowCache: true,
    description: 'Cache ultracurto com invalidação imediata orientada a eventos (Write-Through).',
    invalidationTrigger: 'Atualização de status do motorista ou despacho de corrida',
    examples: [
      'Lista de motoristas disponíveis por Geohash',
      'Clustering de densidade de trânsito em Luanda',
      'Status de conexão de motoristas em ronda'
    ]
  },
  [CacheTier.TIER_2_SHORT_LIVED]: {
    tier: CacheTier.TIER_2_SHORT_LIVED,
    ttlMs: 45000, // 45 seconds
    allowCache: true,
    description: 'Cache de curta duração para consultas analíticas e listagens históricas.',
    invalidationTrigger: 'Finalização de corrida ou nova avaliação submetida',
    examples: [
      'Histórico de corridas finalizadas do passageiro',
      'Média ponderada de avaliação de motoristas',
      'Relatórios gerenciais diários consolidados'
    ]
  },
  [CacheTier.TIER_3_STATIC_CATALOG]: {
    tier: CacheTier.TIER_3_STATIC_CATALOG,
    ttlMs: 3600000, // 1 hour
    allowCache: true,
    description: 'Cache duradouro para dados imutáveis ou dicionários determinísticos locais.',
    invalidationTrigger: 'Publicação de nova versão de app ou atualização de tarifário',
    examples: [
      'Dicionário de Âncoras Urbanas de Luanda (Mercados, Vias, Hospitais)',
      'Artigos e Regras da Constituição RIDING.ao',
      'Tabelas de alíquotas de IVA (14%) e comissões da plataforma (15%)'
    ]
  }
};

class StrategicCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: StrategicCacheStats = {
    hits: 0,
    misses: 0,
    bypasses: 0,
    evictions: 0,
    activeEntriesCount: 0,
    estimatedMemoryBytes: 0,
    tierBreakdown: {
      [CacheTier.TIER_0_NO_CACHE]: { entries: 0, hits: 0, misses: 0, bypasses: 0 },
      [CacheTier.TIER_1_NEAR_REALTIME]: { entries: 0, hits: 0, misses: 0, bypasses: 0 },
      [CacheTier.TIER_2_SHORT_LIVED]: { entries: 0, hits: 0, misses: 0, bypasses: 0 },
      [CacheTier.TIER_3_STATIC_CATALOG]: { entries: 0, hits: 0, misses: 0, bypasses: 0 },
    }
  };

  /**
   * Execute or fetch with strategic tier enforcement
   */
  async execute<T>(
    key: string,
    tier: CacheTier,
    fetcher: () => Promise<T>,
    customTtlMs?: number
  ): Promise<T> {
    const tierConfig = STRATEGIC_CACHE_TIER_RULES[tier];

    // TIER 0 is strictly bypassed to preserve absolute consistency
    if (!tierConfig.allowCache || tier === CacheTier.TIER_0_NO_CACHE) {
      this.stats.bypasses += 1;
      this.stats.tierBreakdown[tier].bypasses += 1;
      return await fetcher();
    }

    const now = Date.now();
    const existing = this.cache.get(key) as CacheEntry<T> | undefined;

    if (existing && now < existing.expiresAt) {
      existing.hits += 1;
      this.stats.hits += 1;
      this.stats.tierBreakdown[tier].hits += 1;
      return existing.data;
    }

    // Cache Miss or Expired
    this.stats.misses += 1;
    this.stats.tierBreakdown[tier].misses += 1;

    const freshData = await fetcher();
    const ttl = customTtlMs ?? tierConfig.ttlMs;

    const approxSize = this.estimateSize(freshData);

    const newEntry: CacheEntry<T> = {
      key,
      data: freshData,
      tier,
      cachedAt: now,
      expiresAt: now + ttl,
      hits: 0,
      sizeBytesEstimated: approxSize
    };

    this.cache.set(key, newEntry as CacheEntry<unknown>);
    this.recomputeStats();

    return freshData;
  }

  /**
   * Event-driven cache invalidation
   */
  invalidateKey(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.evictions += 1;
      this.recomputeStats();
    }
  }

  /**
   * Invalidate by prefix or domain tag (e.g., 'rides:passenger:usr_123')
   */
  invalidatePrefix(prefix: string): void {
    let evictedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        evictedCount += 1;
      }
    }
    if (evictedCount > 0) {
      this.stats.evictions += evictedCount;
      this.recomputeStats();
    }
  }

  /**
   * Invalidate all entries of a specific tier
   */
  invalidateTier(tier: CacheTier): void {
    let evictedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tier === tier) {
        this.cache.delete(key);
        evictedCount += 1;
      }
    }
    if (evictedCount > 0) {
      this.stats.evictions += evictedCount;
      this.recomputeStats();
    }
  }

  /**
   * Clear all cached items across all tiers
   */
  clearAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.evictions += count;
    this.recomputeStats();
  }

  /**
   * Get all active entries for audit inspector
   */
  getEntries(): Array<Omit<CacheEntry<unknown>, 'data'>> {
    return Array.from(this.cache.values()).map(({ key, tier, cachedAt, expiresAt, hits, sizeBytesEstimated }) => ({
      key,
      tier,
      cachedAt,
      expiresAt,
      hits,
      sizeBytesEstimated
    }));
  }

  /**
   * Get global stats
   */
  getStats(): StrategicCacheStats {
    this.cleanExpired();
    return { ...this.stats };
  }

  private cleanExpired(): void {
    const now = Date.now();
    let expired = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        expired++;
      }
    }
    if (expired > 0) {
      this.stats.evictions += expired;
      this.recomputeStats();
    }
  }

  private recomputeStats(): void {
    this.stats.activeEntriesCount = this.cache.size;
    let totalBytes = 0;
    const tierCounts: Record<CacheTier, number> = {
      [CacheTier.TIER_0_NO_CACHE]: 0,
      [CacheTier.TIER_1_NEAR_REALTIME]: 0,
      [CacheTier.TIER_2_SHORT_LIVED]: 0,
      [CacheTier.TIER_3_STATIC_CATALOG]: 0,
    };

    for (const entry of this.cache.values()) {
      totalBytes += entry.sizeBytesEstimated;
      tierCounts[entry.tier] = (tierCounts[entry.tier] || 0) + 1;
    }

    this.stats.estimatedMemoryBytes = totalBytes;
    for (const t of Object.keys(tierCounts) as CacheTier[]) {
      this.stats.tierBreakdown[t].entries = tierCounts[t];
    }
  }

  private estimateSize(obj: unknown): number {
    try {
      return JSON.stringify(obj).length * 2; // rough UTF-16 byte estimate
    } catch {
      return 128;
    }
  }
}

export const strategicCache = new StrategicCacheManager();
