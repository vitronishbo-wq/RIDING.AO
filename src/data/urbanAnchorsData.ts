import { LuandaLocation } from '../types/architecture';
import {
  DynamicPricingConfig,
  HabitRoutine,
  KnownEntity,
  UrbanAnchor
} from '../types/intentTypes';

// Âncoras Urbanas Oficiais de Luanda (Marcos de Referência Reais)
export const URBAN_ANCHORS: Record<string, UrbanAnchor> = {
  mercado_quilamba: {
    id: 'anc_mercado_quilamba',
    name: 'Mercado do Quilamba',
    type: 'MERCADO',
    municipio: 'Belas',
    bairro: 'Centralidade do Kilamba',
    popularReference: 'Bloco Q • Zona das Frutas e Frescos',
    lat: -8.995,
    lng: 13.256,
    radiusMeters: 600,
    isRegionOnly: true
  },
  mutamba: {
    id: 'anc_mutamba',
    name: 'Mutamba (Centro)',
    type: 'PARAGEM_ROTUNDA',
    municipio: 'Luanda',
    bairro: 'Ingombota / Mutamba',
    popularReference: 'Largo da Mutamba • Próximo ao BNA e Correios',
    lat: -8.8147,
    lng: 13.2355,
    radiusMeters: 500,
    isRegionOnly: true
  },
  hospital_maria_pia: {
    id: 'anc_hospital_maria_pia',
    name: 'Hospital Maria Pia (Josina Machel)',
    type: 'HOSPITAL',
    municipio: 'Luanda',
    bairro: 'Maianga / Bairro Azul',
    popularReference: 'Portão Principal de Urgências • Av. 1º Congresso',
    lat: -8.8252,
    lng: 13.2338,
    radiusMeters: 200,
    isRegionOnly: false
  },
  hospital_militar_girassol: {
    id: 'anc_hospital_militar_girassol',
    name: 'Hospital Militar / Girassol',
    type: 'HOSPITAL',
    municipio: 'Luanda',
    bairro: 'Maianga',
    popularReference: 'Entrada de Consultas Externas',
    lat: -8.828,
    lng: 13.241,
    radiusMeters: 150,
    isRegionOnly: false
  },
  escola_sao_francisco: {
    id: 'anc_escola_sao_francisco',
    name: 'Colégio São Francisco de Assis',
    type: 'ESCOLA',
    municipio: 'Luanda',
    bairro: 'Maianga',
    popularReference: 'Portão 2 de Alunos • Rua Comandante Gika',
    lat: -8.831,
    lng: 13.232,
    radiusMeters: 100,
    isRegionOnly: false
  },
  escola_portuguesa: {
    id: 'anc_escola_portuguesa',
    name: 'Escola Portuguesa de Luanda',
    type: 'ESCOLA',
    municipio: 'Luanda',
    bairro: 'Alvalade',
    popularReference: 'Entrada B - Secundário',
    lat: -8.841,
    lng: 13.239,
    radiusMeters: 150,
    isRegionOnly: false
  },
  escola_lis_talatona: {
    id: 'anc_escola_lis_talatona',
    name: 'Luanda International School (LIS)',
    type: 'ESCOLA',
    municipio: 'Talatona',
    bairro: 'Talatona Sul',
    popularReference: 'Campus Talatona Sul',
    lat: -8.932,
    lng: 13.175,
    radiusMeters: 200,
    isRegionOnly: false
  },
  mercado_sao_paulo: {
    id: 'anc_mercado_sao_paulo',
    name: 'Mercado de São Paulo',
    type: 'MERCADO',
    municipio: 'Luanda',
    bairro: 'Sambizanga / Rangel',
    popularReference: 'Largo de São Paulo • Próximo à Igreja',
    lat: -8.809,
    lng: 13.255,
    radiusMeters: 450,
    isRegionOnly: true
  },
  mercado_30: {
    id: 'anc_mercado_30',
    name: 'Mercado do 30 (Viana)',
    type: 'MERCADO',
    municipio: 'Viana',
    bairro: 'Viana Centro / KM 30',
    popularReference: 'Entrada da Estrada de Catete',
    lat: -8.905,
    lng: 13.375,
    radiusMeters: 800,
    isRegionOnly: true
  },
  bomba_pumangol_talatona: {
    id: 'anc_bomba_pumangol_talatona',
    name: 'Bomba Pumangol Talatona',
    type: 'BOMBA',
    municipio: 'Talatona',
    bairro: 'Talatona',
    popularReference: 'Ao lado do Centro de Convenções',
    lat: -8.915,
    lng: 13.185,
    radiusMeters: 80,
    isRegionOnly: false
  },
  casa_novavida: {
    id: 'anc_casa_novavida',
    name: 'Casa (Projecto Nova Vida)',
    type: 'CONDOMINIO',
    municipio: 'Kilamba Kiaxi',
    bairro: 'Nova Vida',
    popularReference: 'Rua 12 • Residência',
    lat: -8.882,
    lng: 13.228,
    radiusMeters: 100,
    isRegionOnly: false
  },
  trabalho_talatona: {
    id: 'anc_trabalho_talatona',
    name: 'Trabalho (Edifício Metrópolis)',
    type: 'BANCO',
    municipio: 'Talatona',
    bairro: 'Talatona Centro Financeiro',
    popularReference: '4º Andar • Centro Financeiro',
    lat: -8.9182,
    lng: 13.1802,
    radiusMeters: 100,
    isRegionOnly: false
  },
  marginal_baia: {
    id: 'anc_marginal_baia',
    name: 'Marginal de Luanda (Baía)',
    type: 'PARAGEM_ROTUNDA',
    municipio: 'Luanda',
    bairro: 'Ingombota',
    popularReference: 'Avenida 4 de Fevereiro • Porto de Luanda',
    lat: -8.8095,
    lng: 13.2384,
    radiusMeters: 500,
    isRegionOnly: true
  },
  aeroporto_fevereiro: {
    id: 'anc_aeroporto_fevereiro',
    name: 'Aeroporto 4 de Fevereiro',
    type: 'PARAGEM_ROTUNDA',
    municipio: 'Luanda',
    bairro: 'Maianga',
    popularReference: 'Terminal de Partidas',
    lat: -8.8584,
    lng: 13.2312,
    radiusMeters: 300,
    isRegionOnly: false
  },
  mercado_kikolo: {
    id: 'anc_mercado_kikolo',
    name: 'Mercado do Kikolo (Cacuaco)',
    type: 'MERCADO',
    municipio: 'Cacuaco',
    bairro: 'Kikolo',
    popularReference: 'Rotunda do Kikolo • Estrada de Cacuaco',
    lat: -8.765,
    lng: 13.298,
    radiusMeters: 750,
    isRegionOnly: true
  },
  cacuaco_centro: {
    id: 'anc_cacuaco_centro',
    name: 'Vila de Cacuaco',
    type: 'PARAGEM_ROTUNDA',
    municipio: 'Cacuaco',
    bairro: 'Cacuaco Centro',
    popularReference: 'Desvio da Comarca • Baía de Cacuaco',
    lat: -8.782,
    lng: 13.355,
    radiusMeters: 600,
    isRegionOnly: true
  },
  benfica_mercado: {
    id: 'anc_benfica_mercado',
    name: 'Mercado de Benfica',
    type: 'MERCADO',
    municipio: 'Belas',
    bairro: 'Benfica',
    popularReference: 'Estrada do Samba • Zona do Artesanato',
    lat: -8.956,
    lng: 13.158,
    radiusMeters: 500,
    isRegionOnly: true
  }
};

// Rotinas Habitualizadas (Memória de Hábitos por Dia e Horário)
export const HABIT_ROUTINES: HabitRoutine[] = [
  {
    id: 'hab_morning_work',
    dayOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
    timeWindowStart: '06:30',
    timeWindowEnd: '09:30',
    greeting: 'Bom dia.',
    promptText: 'Vai para o trabalho no Metrópolis?',
    targetAnchor: URBAN_ANCHORS.trabalho_talatona,
    actionType: 'DESLOCACAO_PROPRIA'
  },
  {
    id: 'hab_afternoon_pickup_maria',
    dayOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
    timeWindowStart: '16:30',
    timeWindowEnd: '18:15',
    greeting: 'Boa tarde.',
    promptText: 'Buscar Maria no Colégio São Francisco?',
    targetAnchor: URBAN_ANCHORS.escola_sao_francisco,
    entityName: 'Maria',
    actionType: 'BUSCAR_TERCEIRO'
  },
  {
    id: 'hab_saturday_market',
    dayOfWeek: [6], // Sábado
    timeWindowStart: '08:00',
    timeWindowEnd: '13:00',
    greeting: 'Bom sábado.',
    promptText: 'Fazer compras no Mercado do Quilamba?',
    targetAnchor: URBAN_ANCHORS.mercado_quilamba,
    actionType: 'DESLOCACAO_PROPRIA'
  },
  {
    id: 'hab_evening_home',
    dayOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
    timeWindowStart: '18:15',
    timeWindowEnd: '22:00',
    greeting: 'Boa noite.',
    promptText: 'Regressar a casa no Nova Vida?',
    targetAnchor: URBAN_ANCHORS.casa_novavida,
    actionType: 'DESLOCACAO_PROPRIA'
  }
];

export const REGISTERED_ENTITIES: KnownEntity[] = [
  {
    id: 'ent_maria',
    name: 'Maria (Filha)',
    relation: 'filha',
    defaultAnchor: URBAN_ANCHORS.escola_sao_francisco,
    registeredAnchors: [
      URBAN_ANCHORS.escola_sao_francisco,
      URBAN_ANCHORS.escola_lis_talatona
    ],
    phone: '+244 923 111 222',
    notes: 'Portão 2 de Alunos'
  },
  {
    id: 'ent_tiago',
    name: 'Tiago (Filho)',
    relation: 'filho',
    defaultAnchor: URBAN_ANCHORS.escola_portuguesa,
    registeredAnchors: [
      URBAN_ANCHORS.escola_portuguesa,
      URBAN_ANCHORS.escola_sao_francisco
    ],
    phone: '+244 923 333 444',
    notes: 'Entrada B'
  },
  {
    id: 'ent_mae_rosa',
    name: 'Dona Rosa (Mãe)',
    relation: 'mae',
    defaultAnchor: URBAN_ANCHORS.hospital_militar_girassol,
    phone: '+244 912 555 666',
    notes: 'Consultas externas'
  },
  {
    id: 'ent_encomenda',
    name: 'Encomenda / Pacote',
    relation: 'encomenda',
    defaultAnchor: URBAN_ANCHORS.mercado_quilamba,
    notes: 'Código com remetente'
  }
];

export function anchorToLocation(anchor: UrbanAnchor): LuandaLocation {
  return {
    id: anchor.id,
    name: anchor.name,
    neighborhood: anchor.bairro,
    lat: anchor.lat,
    lng: anchor.lng,
    geohash: 'kr78xx',
    description: anchor.popularReference
  };
}

export const DEFAULT_DYNAMIC_PRICING: DynamicPricingConfig = {
  minFareAOA: 500, // Non-hardcoded minimum floor
  baseFareAOA: 400,
  perKmFareAOA: 220,
  perMinuteFareAOA: 20,
  dynamicMultiplier: 1.0
};

// Single source of truth for seeded credentials (PINs come from the Bootstrap Vault).
export { INITIAL_MANAGED_CREDENTIALS } from './contextMemoryData';
