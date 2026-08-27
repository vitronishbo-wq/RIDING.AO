/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Firestore Query Optimization & Strict Index Guards
 * 
 * All queries defined here map 1:1 to composite indexes declared in `firestore.indexes.json`.
 * Every list query enforces mandatory `limit()` bounds to prevent unbounded collection scans.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { costOptimizer } from '../utils/costOptimizer';
import { strategicCache, CacheTier } from '../utils/strategicCache';

export interface IndexedPaginationOptions {
  limitCount?: number;
  skipCache?: boolean;
}

// -----------------------------------------------------------------------------
// 1. RIDES QUERIES (Indexed by Passenger / Driver / Status + CreatedAt)
// -----------------------------------------------------------------------------

/**
 * Fetch passenger rides sorted by most recent first
 * Strategic Tier: TIER_2_SHORT_LIVED (30s cache, automatically invalidated on trip completion)
 */
export async function getPassengerRides(
  passengerId: string,
  statusFilter?: string,
  options: IndexedPaginationOptions = {}
) {
  const maxLimit = Math.min(options.limitCount || 20, 100);
  const cacheKey = `rides:passenger:${passengerId}:${statusFilter || 'all'}:${maxLimit}`;

  if (!options.skipCache) {
    return costOptimizer.getOrFetch(
      cacheKey,
      async () => executePassengerRidesQuery(passengerId, statusFilter, maxLimit),
      CacheTier.TIER_2_SHORT_LIVED,
      30000
    );
  }

  return executePassengerRidesQuery(passengerId, statusFilter, maxLimit);
}

async function executePassengerRidesQuery(passengerId: string, statusFilter?: string, maxLimit = 20) {
  try {
    const constraints: QueryConstraint[] = [
      where('passengerId', '==', passengerId),
    ];

    if (statusFilter) {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(maxLimit));

    const q = query(collection(db, 'rides'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'rides');
  }
}

/**
 * Fetch driver rides sorted by most recent first
 * Strategic Tier: TIER_2_SHORT_LIVED (30s cache)
 */
export async function getDriverRides(
  driverId: string,
  statusFilter?: string,
  options: IndexedPaginationOptions = {}
) {
  const maxLimit = Math.min(options.limitCount || 20, 100);
  const cacheKey = `rides:driver:${driverId}:${statusFilter || 'all'}:${maxLimit}`;

  if (!options.skipCache) {
    return costOptimizer.getOrFetch(
      cacheKey,
      async () => executeDriverRidesQuery(driverId, statusFilter, maxLimit),
      CacheTier.TIER_2_SHORT_LIVED,
      30000
    );
  }

  return executeDriverRidesQuery(driverId, statusFilter, maxLimit);
}

async function executeDriverRidesQuery(driverId: string, statusFilter?: string, maxLimit = 20) {
  try {
    const constraints: QueryConstraint[] = [
      where('driverId', '==', driverId),
    ];

    if (statusFilter) {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(maxLimit));

    const q = query(collection(db, 'rides'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'rides');
  }
}

/**
 * Listen to active requested rides in dispatch queue in chronological order (FIFO)
 * Strategic Tier: REALTIME LISTENER (No polling cache, strictly real-time)
 */
export function listenToRideDispatchQueue(
  onRidesUpdate: (rides: DocumentData[]) => void,
  maxRides = 25
): Unsubscribe {
  const q = query(
    collection(db, 'rides'),
    where('status', '==', 'REQUESTED'),
    orderBy('createdAt', 'asc'),
    limit(maxRides)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rides = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onRidesUpdate(rides);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rides/dispatch_queue');
    }
  );
}

// -----------------------------------------------------------------------------
// 2. DRIVERS QUERIES (Indexed by Status + Geohash / Rating)
// -----------------------------------------------------------------------------

/**
 * Query nearby online drivers using Geohash prefix range
 * Strategic Tier: TIER_1_NEAR_REALTIME (5s TTL, invalidated when drivers change state)
 */
export async function getNearbyOnlineDrivers(
  geohashPrefix: string,
  maxDrivers = 20
) {
  const cacheKey = `drivers:nearby:${geohashPrefix}:${maxDrivers}`;
  return strategicCache.execute(
    cacheKey,
    CacheTier.TIER_1_NEAR_REALTIME,
    async () => {
      try {
        const geohashEnd = geohashPrefix + '\uf8ff';
        const q = query(
          collection(db, 'drivers'),
          where('status', '==', 'ONLINE'),
          where('geohash', '>=', geohashPrefix),
          where('geohash', '<=', geohashEnd),
          limit(maxDrivers)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'drivers/nearby');
      }
    },
    5000
  );
}

/**
 * Get top rated active drivers
 * Strategic Tier: TIER_2_SHORT_LIVED (45s TTL)
 */
export async function getTopRatedOnlineDrivers(maxDrivers = 10) {
  const cacheKey = `drivers:top_rated:${maxDrivers}`;
  return strategicCache.execute(
    cacheKey,
    CacheTier.TIER_2_SHORT_LIVED,
    async () => {
      try {
        const q = query(
          collection(db, 'drivers'),
          where('status', '==', 'ONLINE'),
          orderBy('rating', 'desc'),
          limit(maxDrivers)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'drivers/top_rated');
      }
    },
    45000
  );
}

// -----------------------------------------------------------------------------
// 3. TRANSACTIONS & PAYMENTS QUERIES (Zero Cache / Strict Financial Consistency)
// -----------------------------------------------------------------------------

/**
 * Query user transaction ledger history
 * Strategic Tier: TIER_0_NO_CACHE (Zero cache permitted, absolute financial consistency)
 */
export async function getUserTransactions(
  passengerId: string,
  maxTransactions = 30
) {
  // Enforce zero cache through strategic cache manager to track deliberate audit bypass
  return strategicCache.execute(
    `tx:passenger:${passengerId}`,
    CacheTier.TIER_0_NO_CACHE,
    async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('passengerId', '==', passengerId),
          orderBy('createdAt', 'desc'),
          limit(maxTransactions)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'transactions');
      }
    }
  );
}

/**
 * Query recent payments by status
 * Strategic Tier: TIER_0_NO_CACHE (Zero cache permitted, absolute financial reconciliation)
 */
export async function getPaymentsByStatus(
  status: string,
  maxPayments = 50
) {
  return strategicCache.execute(
    `payments:status:${status}`,
    CacheTier.TIER_0_NO_CACHE,
    async () => {
      try {
        const q = query(
          collection(db, 'payments'),
          where('status', '==', status),
          orderBy('updatedAt', 'desc'),
          limit(maxPayments)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'payments');
      }
    }
  );
}

