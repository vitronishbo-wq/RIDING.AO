import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DYNAMIC_PRICING,
  HABIT_ROUTINES,
  REGISTERED_ENTITIES,
  URBAN_ANCHORS
} from '../data/urbanAnchorsData';
import { LuandaLocation } from '../types/architecture';
import {
  generateMulticaixaReference,
  getActiveHabitSuggestion,
  matchAnchorFromText,
  matchEntityFromText,
  parseProgressiveIntent
} from './intentEngine';

const passengerGps: LuandaLocation = {
  id: 'loc_gps_passenger',
  name: 'Talatona Centro Financeiro',
  neighborhood: 'Talatona',
  lat: -8.9182,
  lng: 13.1802,
  geohash: 'kr78xx',
  description: 'Localização atual simulada'
};

describe('matchAnchorFromText', () => {
  it('matches anchors regardless of casing and accents', () => {
    expect(matchAnchorFromText('MERCADO DO QUILAMBA')?.id).toBe(URBAN_ANCHORS.mercado_quilamba.id);
    expect(matchAnchorFromText('Preciso ir à Mutamba')?.id).toBe(URBAN_ANCHORS.mutamba.id);
    expect(matchAnchorFromText('hospital josina machel')?.id).toBe(URBAN_ANCHORS.hospital_maria_pia.id);
  });

  it('accepts common spelling variants for the same anchor', () => {
    expect(matchAnchorFromText('kilamba')?.id).toBe(matchAnchorFromText('quilamba')?.id);
    expect(matchAnchorFromText('kikolo')?.id).toBe(matchAnchorFromText('quicolo')?.id);
  });

  it('maps colloquial aliases to home and work anchors', () => {
    expect(matchAnchorFromText('vou para casa')?.id).toBe(URBAN_ANCHORS.casa_novavida.id);
    expect(matchAnchorFromText('levar-me ao escritorio')?.id).toBe(URBAN_ANCHORS.trabalho_talatona.id);
    expect(matchAnchorFromText('marginal')?.id).toBe(URBAN_ANCHORS.marginal_baia.id);
    expect(matchAnchorFromText('aeroporto')?.id).toBe(URBAN_ANCHORS.aeroporto_fevereiro.id);
  });

  it('matches compound school references', () => {
    expect(matchAnchorFromText('escola talatona')?.id).toBe(URBAN_ANCHORS.escola_lis_talatona.id);
    expect(matchAnchorFromText('escola portuguesa')?.id).toBe(URBAN_ANCHORS.escola_portuguesa.id);
  });

  it('matches every market, fuel station and suburb anchor', () => {
    expect(matchAnchorFromText('mercado sao paulo')?.id).toBe(URBAN_ANCHORS.mercado_sao_paulo.id);
    expect(matchAnchorFromText('mercado do 30')?.id).toBe(URBAN_ANCHORS.mercado_30.id);
    expect(matchAnchorFromText('viana 30')?.id).toBe(URBAN_ANCHORS.mercado_30.id);
    expect(matchAnchorFromText('bomba pumangol')?.id).toBe(URBAN_ANCHORS.bomba_pumangol_talatona.id);
    expect(matchAnchorFromText('mercado do kikolo')?.id).toBe(URBAN_ANCHORS.mercado_kikolo.id);
    expect(matchAnchorFromText('vila de cacuaco')?.id).toBe(URBAN_ANCHORS.cacuaco_centro.id);
    expect(matchAnchorFromText('mercado de benfica')?.id).toBe(URBAN_ANCHORS.benfica_mercado.id);
    expect(matchAnchorFromText('LIS')?.id).toBe(URBAN_ANCHORS.escola_lis_talatona.id);
    expect(matchAnchorFromText('escola são francisco')?.id).toBe(URBAN_ANCHORS.escola_sao_francisco.id);
    expect(matchAnchorFromText('hospital girassol')?.id).toBe(URBAN_ANCHORS.hospital_militar_girassol.id);
    expect(matchAnchorFromText('minha residencia')?.id).toBe(URBAN_ANCHORS.casa_novavida.id);
    expect(matchAnchorFromText('vou ao trabalho')?.id).toBe(URBAN_ANCHORS.trabalho_talatona.id);
    expect(matchAnchorFromText('baia de luanda')?.id).toBe(URBAN_ANCHORS.marginal_baia.id);
    expect(matchAnchorFromText('4 de fevereiro')?.id).toBe(URBAN_ANCHORS.aeroporto_fevereiro.id);
  });

  it('returns null for unknown text', () => {
    expect(matchAnchorFromText('qualquer sítio desconhecido')).toBeNull();
    expect(matchAnchorFromText('')).toBeNull();
  });
});

describe('matchEntityFromText', () => {
  it('matches registered people by relation or first name', () => {
    expect(matchEntityFromText('buscar minha filha')).toBe(REGISTERED_ENTITIES[0]);
    expect(matchEntityFromText('buscar tiago')).toBe(REGISTERED_ENTITIES[1]);
    expect(matchEntityFromText('levar a mãe ao hospital')).toBe(REGISTERED_ENTITIES[2]);
  });

  it('matches parcels as a deliverable entity', () => {
    expect(matchEntityFromText('enviar uma encomenda')).toBe(REGISTERED_ENTITIES[3]);
    expect(matchEntityFromText('entregar documento')).toBe(REGISTERED_ENTITIES[3]);
  });

  it('returns null when no entity is referenced', () => {
    expect(matchEntityFromText('mercado do quilamba')).toBeNull();
  });
});

describe('parseProgressiveIntent', () => {
  const parse = (query: string) => parseProgressiveIntent(query, passengerGps, DEFAULT_DYNAMIC_PRICING);

  it('rests on an empty or whitespace-only query', () => {
    expect(parse('')).toEqual({ query: '', step: 'STATE_1_REST', plan: null, needsClarification: false });
    expect(parse('   ').step).toBe('STATE_1_REST');
  });

  it('asks where a child is when the query omits the location', () => {
    const result = parse('buscar minha filha');
    expect(result.step).toBe('STATE_3_CLARIFICATION');
    expect(result.needsClarification).toBe(true);
    expect(result.plan).toBeNull();
    expect(result.clarificationQuestion).toBe('Onde está a Maria?');
    expect(result.clarificationOptions?.map((o) => o.id)).toEqual([
      'opt_school',
      'opt_current_gps',
      'opt_portuguesa'
    ]);
    expect(result.clarificationOptions?.[1].sublabel).toBe(passengerGps.name);
  });

  it('builds a pickup plan when the child location is explicit', () => {
    const result = parse('buscar minha filha no colégio são francisco');
    expect(result.step).toBe('STATE_5_READY');
    expect(result.needsClarification).toBe(false);
    expect(result.plan?.actionType).toBe('BUSCAR_TERCEIRO');
    expect(result.plan?.actionTitle).toBe('Buscar Maria');
    expect(result.plan?.pickupLocation.id).toBe(URBAN_ANCHORS.escola_sao_francisco.id);
    expect(result.plan?.dropoffLocation.id).toBe(URBAN_ANCHORS.casa_novavida.id);
    expect(result.plan?.isDestinoVivo).toBe(false);
  });

  it('inverts pickup and dropoff for a delivery intent', () => {
    const result = parse('levar o tiago à escola portuguesa');
    expect(result.plan?.actionType).toBe('LEVAR_TERCEIRO');
    expect(result.plan?.pickupLocation.id).toBe(URBAN_ANCHORS.casa_novavida.id);
    expect(result.plan?.dropoffLocation.id).toBe(URBAN_ANCHORS.escola_portuguesa.id);
  });

  it('classifies a parcel without a pickup or delivery verb as a parcel delivery', () => {
    const result = parse('encomenda para o hospital militar');
    expect(result.plan?.actionType).toBe('ENTREGAR_ENCOMENDA');
  });

  it('prices an entity trip with the configured dynamic tariff', () => {
    const result = parse('buscar minha filha no colégio são francisco');
    const plan = result.plan!;
    const expected = Math.round(
      DEFAULT_DYNAMIC_PRICING.baseFareAOA +
        plan.distanceKm * DEFAULT_DYNAMIC_PRICING.perKmFareAOA +
        plan.durationMins * DEFAULT_DYNAMIC_PRICING.perMinuteFareAOA
    );
    expect(plan.calculatedPriceAOA).toBe(expected);
    expect(plan.durationMins).toBe(Math.max(8, Math.round(plan.distanceKm * 2.8 + 4)));
    expect(plan.formulaBreakdown).toContain(`${DEFAULT_DYNAMIC_PRICING.perKmFareAOA} Kz`);
  });

  it('applies the surge multiplier and never goes below the minimum fare', () => {
    const surge = parseProgressiveIntent('mutamba', passengerGps, {
      ...DEFAULT_DYNAMIC_PRICING,
      dynamicMultiplier: 2
    });
    const normal = parseProgressiveIntent('mutamba', passengerGps, DEFAULT_DYNAMIC_PRICING);
    expect(surge.plan!.calculatedPriceAOA).toBeGreaterThan(normal.plan!.calculatedPriceAOA);

    const free = parseProgressiveIntent('mutamba', passengerGps, {
      minFareAOA: 900,
      baseFareAOA: 0,
      perKmFareAOA: 0,
      perMinuteFareAOA: 0,
      dynamicMultiplier: 1
    });
    expect(free.plan!.calculatedPriceAOA).toBe(900);
  });

  it('requires region confirmation for wide anchors (destino vivo)', () => {
    const result = parse('mercado do quilamba');
    expect(result.step).toBe('STATE_4_REGION_CONFIRM');
    expect(result.regionToConfirm?.id).toBe(URBAN_ANCHORS.mercado_quilamba.id);
    expect(result.plan?.actionType).toBe('DESTINO_EM_ABERTO');
    expect(result.plan?.isDestinoVivo).toBe(true);
    expect(result.plan?.pickupLocation).toEqual(passengerGps);
  });

  it('is ready immediately for a precise anchor', () => {
    const result = parse('hospital militar');
    expect(result.step).toBe('STATE_5_READY');
    expect(result.regionToConfirm).toBeUndefined();
    expect(result.plan?.actionType).toBe('DESLOCACAO_PROPRIA');
    expect(result.plan?.isDestinoVivo).toBe(false);
    expect(result.plan?.dropoffLocation.id).toBe(URBAN_ANCHORS.hospital_militar_girassol.id);
  });

  it('falls back to a Mutamba-based regional estimate for unknown destinations', () => {
    const result = parse('Rua sem nome, Bairro Popular');
    expect(result.step).toBe('STATE_5_READY');
    expect(result.plan?.actionType).toBe('DESTINO_EM_ABERTO');
    expect(result.plan?.actionTitle).toBe('Rua sem nome, Bairro Popular');
    expect(result.plan?.isDestinoVivo).toBe(true);
    expect(result.plan?.durationMins).toBe(15);
    expect(result.plan?.dropoffLocation.id).toBe(URBAN_ANCHORS.mutamba.id);
    expect(result.plan?.formulaBreakdown).toBe('Estimativa por região');
  });

  it('trims the query but preserves the original casing in the plan', () => {
    const result = parse('  Hospital Militar  ');
    expect(result.query).toBe('Hospital Militar');
  });
});

describe('getActiveHabitSuggestion', () => {
  it('suggests the commute to work in the morning', () => {
    expect(getActiveHabitSuggestion(8, 1)).toBe(HABIT_ROUTINES[0]);
    expect(getActiveHabitSuggestion(6, 1)).toBe(HABIT_ROUTINES[0]);
    expect(getActiveHabitSuggestion(11, 1)).toBe(HABIT_ROUTINES[0]);
  });

  it('suggests picking up Maria in the late afternoon', () => {
    expect(getActiveHabitSuggestion(16, 3)).toBe(HABIT_ROUTINES[1]);
    expect(getActiveHabitSuggestion(18, 3)).toBe(HABIT_ROUTINES[1]);
  });

  it('suggests the Saturday market outside the weekday windows', () => {
    expect(getActiveHabitSuggestion(14, 6)).toBe(HABIT_ROUTINES[2]);
  });

  it('prefers the time window over the Saturday routine', () => {
    expect(getActiveHabitSuggestion(8, 6)).toBe(HABIT_ROUTINES[0]);
  });

  it('falls back to going home at night', () => {
    expect(getActiveHabitSuggestion(21, 2)).toBe(HABIT_ROUTINES[3]);
    expect(getActiveHabitSuggestion(3, 2)).toBe(HABIT_ROUTINES[3]);
  });

  it('defaults to the morning commute', () => {
    expect(getActiveHabitSuggestion()).toBe(HABIT_ROUTINES[0]);
  });
});

describe('generateMulticaixaReference', () => {
  it('builds a 9 digit reference from the driver phone and trip id', () => {
    const ref = generateMulticaixaReference('trip_892102', 4200, '+244 923 456 789', 'Manuel Sebastião');
    expect(ref.referencia).toBe('678 992 102');
    expect(ref.referencia.replace(/ /g, '')).toHaveLength(9);
    expect(ref.entidade).toBe('00123');
    expect(ref.valorAOA).toBe(4200);
  });

  it('exposes the confirmed 72h AppyPay gateway expiration', () => {
    const ref = generateMulticaixaReference('trip_1', 500);
    expect(ref.expiraEmHorasGateway).toBe(72);
    expect(ref.expiraEmMinutos).toBe(4320);
  });

  it('pads short references up to 9 digits', () => {
    const ref = generateMulticaixaReference('trip_7', 500, '911');
    expect(ref.referencia.replace(/ /g, '')).toHaveLength(9);
    expect(ref.referencia.replace(/ /g, '')).toMatch(/^9117 *7*/);
  });

  it('uses a stable placeholder trip number when the id has no digits', () => {
    const ref = generateMulticaixaReference('trip_unknown', 500, '+244 923 456 789');
    expect(ref.referencia).toBe('678 910 293');
  });

  it('defaults to the seeded driver identity', () => {
    const ref = generateMulticaixaReference('trip_892102', 1500);
    expect(ref.driverName).toBe('Manuel Sebastião');
    expect(ref.driverPhone).toBe('+244 923 456 789');
  });
});
