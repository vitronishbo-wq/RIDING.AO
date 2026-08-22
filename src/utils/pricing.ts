import { DynamicPricingConfig } from '../types/intentTypes';

export const MIN_FARE_AOA = 500;

export function floorFare(amount: number, floor: number = MIN_FARE_AOA): number {
  return Math.max(floor, Math.round(amount));
}

export function calculateFare(
  pricingConfig: DynamicPricingConfig,
  distanceKm: number,
  durationMins: number,
  includeDuration: boolean = true
): number {
  const durationFare = includeDuration ? durationMins * pricingConfig.perMinuteFareAOA : 0;
  const rawFare =
    (pricingConfig.baseFareAOA + distanceKm * pricingConfig.perKmFareAOA + durationFare) *
    pricingConfig.dynamicMultiplier;

  return floorFare(rawFare, pricingConfig.minFareAOA);
}

export function formatAOA(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0
  }).format(amount).replace('AOA', 'Kz');
}
