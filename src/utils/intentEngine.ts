import { LuandaLocation } from '../types/architecture';
import {
  DynamicPricingConfig,
  HabitRoutine,
  KnownEntity,
  MobilityActionType,
  MulticaixaReferenceData,
  OperationalTripPlan,
  UrbanAnchor
} from '../types/intentTypes';
import {
  HABIT_ROUTINES,
  REGISTERED_ENTITIES,
  URBAN_ANCHORS,
  anchorToLocation
} from '../data/urbanAnchorsData';
import { calculateHaversineDistanceKm } from './geohashUtils';

export interface ProgressiveResolution {
  query: string;
  step: 'STATE_1_REST' | 'STATE_2_INPUT' | 'STATE_3_CLARIFICATION' | 'STATE_4_REGION_CONFIRM' | 'STATE_5_READY';
  plan: OperationalTripPlan | null;
  needsClarification: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: {
    id: string;
    label: string;
    sublabel?: string;
    anchor?: UrbanAnchor;
    entity?: KnownEntity;
  }[];
  regionToConfirm?: UrbanAnchor;
}

// Find matched anchor in text query
export function matchAnchorFromText(text: string): UrbanAnchor | null {
  const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('quilamba') || norm.includes('kilamba')) {
    return URBAN_ANCHORS.mercado_quilamba;
  }
  if (norm.includes('mutamba')) {
    return URBAN_ANCHORS.mutamba;
  }
  if (norm.includes('maria pia') || norm.includes('josina')) {
    return URBAN_ANCHORS.hospital_maria_pia;
  }
  if (norm.includes('girassol') || norm.includes('militar')) {
    return URBAN_ANCHORS.hospital_militar_girassol;
  }
  if (norm.includes('sao francisco') || (norm.includes('escola') && norm.includes('francisco'))) {
    return URBAN_ANCHORS.escola_sao_francisco;
  }
  if (norm.includes('escola portuguesa') || norm.includes('portuguesa')) {
    return URBAN_ANCHORS.escola_portuguesa;
  }
  if (norm.includes('lis') || (norm.includes('escola') && norm.includes('talatona'))) {
    return URBAN_ANCHORS.escola_lis_talatona;
  }
  if (norm.includes('sao paulo') || norm.includes('mercado sao paulo')) {
    return URBAN_ANCHORS.mercado_sao_paulo;
  }
  if (norm.includes('mercado do 30') || norm.includes('mercado 30') || norm.includes('viana 30')) {
    return URBAN_ANCHORS.mercado_30;
  }
  if (norm.includes('pumangol') || norm.includes('bomba')) {
    return URBAN_ANCHORS.bomba_pumangol_talatona;
  }
  if (norm.includes('casa') || norm.includes('residencia') || norm.includes('nova vida')) {
    return URBAN_ANCHORS.casa_novavida;
  }
  if (norm.includes('trabalho') || norm.includes('metropolis') || norm.includes('servico') || norm.includes('escritorio')) {
    return URBAN_ANCHORS.trabalho_talatona;
  }
  if (norm.includes('marginal') || norm.includes('baia')) {
    return URBAN_ANCHORS.marginal_baia;
  }
  if (norm.includes('aeroporto') || norm.includes('fevereiro')) {
    return URBAN_ANCHORS.aeroporto_fevereiro;
  }
  if (norm.includes('kikolo') || norm.includes('quicolo')) {
    return URBAN_ANCHORS.mercado_kikolo;
  }
  if (norm.includes('cacuaco')) {
    return URBAN_ANCHORS.cacuaco_centro;
  }
  if (norm.includes('benfica')) {
    return URBAN_ANCHORS.benfica_mercado;
  }

  return null;
}

// Find matched entity from text query
export function matchEntityFromText(text: string): KnownEntity | null {
  const norm = text.toLowerCase();
  if (norm.includes('filha') || norm.includes('maria')) {
    return REGISTERED_ENTITIES[0]; // Maria
  }
  if (norm.includes('filho') || norm.includes('tiago')) {
    return REGISTERED_ENTITIES[1]; // Tiago
  }
  if (norm.includes('mae') || norm.includes('mãe') || norm.includes('rosa')) {
    return REGISTERED_ENTITIES[2]; // Dona Rosa
  }
  if (norm.includes('encomenda') || norm.includes('pacote') || norm.includes('documento')) {
    return REGISTERED_ENTITIES[3]; // Encomenda
  }
  return null;
}

// Progressive Intent Engine
export function parseProgressiveIntent(
  query: string,
  passengerGps: LuandaLocation,
  pricingConfig: DynamicPricingConfig
): ProgressiveResolution {
  const raw = query.trim();
  if (!raw) {
    return {
      query: '',
      step: 'STATE_1_REST',
      plan: null,
      needsClarification: false
    };
  }

  const norm = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const entity = matchEntityFromText(norm);
  const anchor = matchAnchorFromText(norm);

  // SCENARIO A: Natural Person Intention (e.g. "Buscar minha filha", "Leva meu filho")
  if (entity) {
    const isPickupAction = norm.includes('busca') || norm.includes('pega') || norm.includes('apanha') || norm.includes('ir buscar');
    const isDeliveryAction = norm.includes('leva') || norm.includes('entrega') || norm.includes('levar');

    // If query did not specify where the entity is and entity has choices
    const mentionsSpecificSchool = norm.includes('francisco') || norm.includes('portuguesa') || norm.includes('lis') || norm.includes('hospital');

    if (!mentionsSpecificSchool && (entity.relation === 'filha' || entity.relation === 'filho')) {
      // Progressive Clarification: "Onde ela está?"
      return {
        query: raw,
        step: 'STATE_3_CLARIFICATION',
        plan: null,
        needsClarification: true,
        clarificationQuestion: `Onde está a ${entity.name.split('(')[0].trim()}?`,
        clarificationOptions: [
          {
            id: 'opt_school',
            label: entity.defaultAnchor?.name || 'Colégio São Francisco',
            sublabel: 'Escola cadastrada',
            anchor: entity.defaultAnchor
          },
          {
            id: 'opt_current_gps',
            label: 'Localização Atual do Passageiro',
            sublabel: passengerGps.name,
            anchor: URBAN_ANCHORS.trabalho_talatona
          },
          {
            id: 'opt_portuguesa',
            label: 'Escola Portuguesa de Luanda',
            sublabel: 'Alvalade',
            anchor: URBAN_ANCHORS.escola_portuguesa
          }
        ]
      };
    }

    // Entity is located at specified anchor or default anchor
    const pickupAnchor = isPickupAction
      ? (anchor || entity.defaultAnchor || URBAN_ANCHORS.escola_sao_francisco)
      : URBAN_ANCHORS.casa_novavida;

    const dropoffAnchor = isPickupAction
      ? URBAN_ANCHORS.casa_novavida
      : (anchor || entity.defaultAnchor || URBAN_ANCHORS.escola_sao_francisco);

    const pickupLoc = anchorToLocation(pickupAnchor);
    const dropoffLoc = anchorToLocation(dropoffAnchor);

    const distKm = Number(calculateHaversineDistanceKm(pickupLoc.lat, pickupLoc.lng, dropoffLoc.lat, dropoffLoc.lng).toFixed(1));
    const duration = Math.max(8, Math.round(distKm * 2.8 + 4));

    const calculatedPrice = Math.max(
      pricingConfig.minFareAOA,
      Math.round(
        (pricingConfig.baseFareAOA + distKm * pricingConfig.perKmFareAOA + duration * pricingConfig.perMinuteFareAOA) *
          pricingConfig.dynamicMultiplier
      )
    );

    const plan: OperationalTripPlan = {
      actionType: isPickupAction ? 'BUSCAR_TERCEIRO' : isDeliveryAction ? 'LEVAR_TERCEIRO' : 'ENTREGAR_ENCOMENDA',
      actionTitle: `${isPickupAction ? 'Buscar' : 'Levar'} ${entity.name.split('(')[0].trim()}`,
      entity,
      passengerGpsLocation: passengerGps,
      pickupLocation: pickupLoc,
      dropoffLocation: dropoffLoc,
      isDestinoVivo: false,
      distanceKm: distKm,
      durationMins: duration,
      calculatedPriceAOA: calculatedPrice,
      formulaBreakdown: `${distKm} km x ${pricingConfig.perKmFareAOA} Kz + Base ${pricingConfig.baseFareAOA} Kz`
    };

    return {
      query: raw,
      step: 'STATE_5_READY',
      plan,
      needsClarification: false
    };
  }

  // SCENARIO B: Broad Region / Urban Anchor (e.g. "Mercado do Quilamba", "Mutamba")
  if (anchor) {
    const isRegion = anchor.isRegionOnly;
    const pickupLoc = passengerGps;
    const dropoffLoc = anchorToLocation(anchor);

    const distKm = Number(calculateHaversineDistanceKm(pickupLoc.lat, pickupLoc.lng, dropoffLoc.lat, dropoffLoc.lng).toFixed(1));
    const duration = Math.max(6, Math.round(distKm * 2.6 + 3));

    const calculatedPrice = Math.max(
      pricingConfig.minFareAOA,
      Math.round(
        (pricingConfig.baseFareAOA + distKm * pricingConfig.perKmFareAOA + duration * pricingConfig.perMinuteFareAOA) *
          pricingConfig.dynamicMultiplier
      )
    );

    const plan: OperationalTripPlan = {
      actionType: isRegion ? 'DESTINO_EM_ABERTO' : 'DESLOCACAO_PROPRIA',
      actionTitle: anchor.name,
      entity: null,
      passengerGpsLocation: passengerGps,
      pickupLocation: pickupLoc,
      dropoffLocation: dropoffLoc,
      isDestinoVivo: !!isRegion,
      distanceKm: distKm,
      durationMins: duration,
      calculatedPriceAOA: calculatedPrice,
      formulaBreakdown: `${distKm} km x ${pricingConfig.perKmFareAOA} Kz`
    };

    if (isRegion) {
      return {
        query: raw,
        step: 'STATE_4_REGION_CONFIRM',
        plan,
        needsClarification: false,
        regionToConfirm: anchor
      };
    }

    return {
      query: raw,
      step: 'STATE_5_READY',
      plan,
      needsClarification: false
    };
  }

  // SCENARIO C: Default generic location fallback
  const fallbackAnchor = URBAN_ANCHORS.mutamba;
  const pickupLoc = passengerGps;
  const dropoffLoc = anchorToLocation(fallbackAnchor);
  const distKm = Number(calculateHaversineDistanceKm(pickupLoc.lat, pickupLoc.lng, dropoffLoc.lat, dropoffLoc.lng).toFixed(1));
  const duration = 15;
  const calculatedPrice = Math.max(
    pricingConfig.minFareAOA,
    Math.round((pricingConfig.baseFareAOA + distKm * pricingConfig.perKmFareAOA) * pricingConfig.dynamicMultiplier)
  );

  return {
    query: raw,
    step: 'STATE_5_READY',
    plan: {
      actionType: 'DESTINO_EM_ABERTO',
      actionTitle: raw,
      entity: null,
      passengerGpsLocation: passengerGps,
      pickupLocation: pickupLoc,
      dropoffLocation: dropoffLoc,
      isDestinoVivo: true,
      distanceKm: distKm,
      durationMins: duration,
      calculatedPriceAOA: calculatedPrice,
      formulaBreakdown: 'Estimativa por região'
    },
    needsClarification: false
  };
}

// Habit Routine Suggester (Context Engine)
export function getActiveHabitSuggestion(simulatedHour: number = 8, dayOfWeek: number = 1): HabitRoutine {
  // Matching by hour
  if (simulatedHour >= 6 && simulatedHour < 12) {
    return HABIT_ROUTINES[0]; // Morning work
  }
  if (simulatedHour >= 16 && simulatedHour < 19) {
    return HABIT_ROUTINES[1]; // Afternoon pickup Maria
  }
  if (dayOfWeek === 6) {
    return HABIT_ROUTINES[2]; // Saturday market
  }
  return HABIT_ROUTINES[3]; // Evening home
}

// Generate Level 2 Multicaixa Reference
export function generateMulticaixaReference(
  tripId: string,
  priceAOA: number,
  driverPhone: string = '+244 923 456 789',
  driverName: string = 'Manuel Sebastião'
): MulticaixaReferenceData {
  // 9-digit reference using driver number and trip
  const phoneClean = driverPhone.replace(/\D/g, '').slice(-4);
  const tripNum = tripId.replace(/\D/g, '').slice(-5) || '10293';
  const refNum = `${phoneClean}${tripNum}`.padEnd(9, '7');

  return {
    entidade: '00123', // Entidade Oficial Go.Bro
    referencia: `${refNum.slice(0, 3)} ${refNum.slice(3, 6)} ${refNum.slice(6, 9)}`,
    valorAOA: priceAOA,
    expiraEmMinutos: 30,
    driverPhone,
    driverName
  };
}
