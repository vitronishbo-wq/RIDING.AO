import { DEMO_CREDENTIAL_PINS } from '../config/accessConfig';
import { LuandaLocation } from '../types/architecture';
import {
  DynamicPricingConfig,
  FrequentContextLocation,
  KnownEntity,
  ManagedUserCredential
} from '../types/intentTypes';

// Extended Luanda Locations for contextual intents
export const FREQUENT_LOCATIONS: Record<string, LuandaLocation> = {
  casa_novavida: {
    id: 'loc_casa_novavida',
    name: 'Casa (Projecto Nova Vida)',
    neighborhood: 'Kilamba Kiaxi',
    lat: -8.8820,
    lng: 13.2280,
    geohash: 'kr78xw',
    description: 'Residência Principal • Rua 12'
  },
  trabalho_talatona: {
    id: 'loc_trabalho_talatona',
    name: 'Escritório (Talatona Centro Financeiro)',
    neighborhood: 'Talatona',
    lat: -8.9182,
    lng: 13.1802,
    geohash: 'kr78pp',
    description: 'Edifício Metrópolis • 4º Andar'
  },
  escola_filha_maianga: {
    id: 'loc_escola_filha_maianga',
    name: 'Colégio São Francisco de Assis',
    neighborhood: 'Maianga',
    lat: -8.8310,
    lng: 13.2320,
    geohash: 'kr7b1v',
    description: 'Portão Principal de Alunos'
  },
  escola_filho_alvalade: {
    id: 'loc_escola_filho_alvalade',
    name: 'Escola Portuguesa de Luanda',
    neighborhood: 'Alvalade / Maianga',
    lat: -8.8410,
    lng: 13.2390,
    geohash: 'kr7b0z',
    description: 'Entrada B - Secundário'
  },
  escola_filhos_talatona: {
    id: 'loc_escola_filhos_talatona',
    name: 'Luanda International School (LIS)',
    neighborhood: 'Talatona',
    lat: -8.9320,
    lng: 13.1750,
    geohash: 'kr78n2',
    description: 'Campus Talatona Sul'
  },
  hospital_mae_militar: {
    id: 'loc_hospital_mae_militar',
    name: 'Hospital Militar Principal / Girassol',
    neighborhood: 'Maianga',
    lat: -8.8280,
    lng: 13.2410,
    geohash: 'kr7b1t',
    description: 'Entrada de Consultas Externas'
  },
  casa_pais_maculusso: {
    id: 'loc_casa_pais_maculusso',
    name: 'Casa dos Pais (Maculusso / Kinaxixi)',
    neighborhood: 'Maianga / Ingombota',
    lat: -8.8210,
    lng: 13.2390,
    geohash: 'kr7b1v',
    description: 'Rua Rainha Ginga / Kinaxixi'
  },
  encomenda_kilamba: {
    id: 'loc_encomenda_kilamba',
    name: 'Centralidade do Kilamba (Bloco Q)',
    neighborhood: 'Belas',
    lat: -8.9950,
    lng: 13.2560,
    geohash: 'kr78te',
    description: 'Edifício Q14 • Ponto de Entrega'
  },
  marginal_luanda: {
    id: 'loc_marginal_luanda',
    name: 'Marginal de Luanda (Baía)',
    neighborhood: 'Ingombota',
    lat: -8.8095,
    lng: 13.2384,
    geohash: 'kr7b1r',
    description: 'Avenida 4 de Fevereiro'
  },
  aeroporto_fevereiro: {
    id: 'loc_aeroporto_fevereiro',
    name: 'Aeroporto 4 de Fevereiro',
    neighborhood: 'Maianga',
    lat: -8.8584,
    lng: 13.2312,
    geohash: 'kr7b0d',
    description: 'Terminal de Partidas'
  }
};

export const REGISTERED_ENTITIES: KnownEntity[] = [
  {
    id: 'ent_filha_maria',
    name: 'Maria (Filha)',
    relation: 'filha',
    defaultPickupLocation: FREQUENT_LOCATIONS.escola_filha_maianga,
    defaultDropoffLocation: FREQUENT_LOCATIONS.casa_novavida,
    registeredLocations: [
      FREQUENT_LOCATIONS.escola_filha_maianga,
      FREQUENT_LOCATIONS.escola_filhos_talatona
    ],
    phone: '+244 923 111 222',
    notes: 'Entregar apenas a responsáveis autorizados no portão'
  },
  {
    id: 'ent_filho_tiago',
    name: 'Tiago (Filho)',
    relation: 'filho',
    defaultPickupLocation: FREQUENT_LOCATIONS.escola_filho_alvalade,
    defaultDropoffLocation: FREQUENT_LOCATIONS.casa_novavida,
    registeredLocations: [
      FREQUENT_LOCATIONS.escola_filho_alvalade,
      FREQUENT_LOCATIONS.escola_filha_maianga
    ],
    phone: '+244 923 333 444',
    notes: 'Aguardar no pátio interno da escola'
  },
  {
    id: 'ent_mae_rosa',
    name: 'Dona Rosa (Mãe)',
    relation: 'mae',
    defaultPickupLocation: FREQUENT_LOCATIONS.hospital_mae_militar,
    defaultDropoffLocation: FREQUENT_LOCATIONS.casa_pais_maculusso,
    registeredLocations: [
      FREQUENT_LOCATIONS.hospital_mae_militar,
      FREQUENT_LOCATIONS.casa_pais_maculusso
    ],
    phone: '+244 912 555 666',
    notes: 'Apoio no embarque com medicação'
  },
  {
    id: 'ent_encomenda_doc',
    name: 'Encomenda / Pacote',
    relation: 'encomenda',
    defaultPickupLocation: FREQUENT_LOCATIONS.encomenda_kilamba,
    defaultDropoffLocation: FREQUENT_LOCATIONS.casa_novavida,
    registeredLocations: [
      FREQUENT_LOCATIONS.encomenda_kilamba,
      FREQUENT_LOCATIONS.trabalho_talatona
    ],
    notes: 'Verificar código de recebimento com o remetente'
  }
];

export const CONTEXT_FREQUENT_PLACES: FrequentContextLocation[] = [
  { id: 'f_casa', type: 'casa', label: 'Casa', location: FREQUENT_LOCATIONS.casa_novavida },
  { id: 'f_trabalho', type: 'trabalho', label: 'Trabalho', location: FREQUENT_LOCATIONS.trabalho_talatona },
  { id: 'f_escola_maria', type: 'escola', label: 'Colégio da Maria', location: FREQUENT_LOCATIONS.escola_filha_maianga, associatedEntityId: 'ent_filha_maria' },
  { id: 'f_escola_tiago', type: 'escola', label: 'Escola do Tiago', location: FREQUENT_LOCATIONS.escola_filho_alvalade, associatedEntityId: 'ent_filho_tiago' },
  { id: 'f_hospital', type: 'hospital', label: 'Hospital / Clínica', location: FREQUENT_LOCATIONS.hospital_mae_militar, associatedEntityId: 'ent_mae_rosa' },
  { id: 'f_pais', type: 'pais', label: 'Casa dos Pais', location: FREQUENT_LOCATIONS.casa_pais_maculusso }
];

export const DEFAULT_DYNAMIC_PRICING: DynamicPricingConfig = {
  minFareAOA: 500,        // dynamic minimum floor: no trip below this
  baseFareAOA: 400,       // flag-fall base fee
  perKmFareAOA: 220,      // per kilometer cost
  perMinuteFareAOA: 20,   // per estimated minute
  dynamicMultiplier: 1.0,
  nightMultiplier: 1.0,
  peakMultiplier: 1.0
};

// PINs are never stored in source: they are injected via the Bootstrap Vault
// (VITE_DEMO_CREDENTIAL_PINS). Credentials without an injected PIN cannot authenticate.
export const INITIAL_MANAGED_CREDENTIALS: ManagedUserCredential[] = [
  {
    id: 'drv_manuel_01',
    name: 'Manuel Sebastião',
    role: 'DRIVER',
    pin: DEMO_CREDENTIAL_PINS['drv_manuel_01'] || '',
    phone: '+244 923 456 789',
    status: 'active',
    vehiclePlate: 'LD-42-89-HZ',
    updatedAt: '2026-08-20 10:30'
  },
  {
    id: 'drv_antonio_02',
    name: 'António Kiala',
    role: 'DRIVER',
    pin: DEMO_CREDENTIAL_PINS['drv_antonio_02'] || '',
    phone: '+244 923 888 111',
    status: 'active',
    vehiclePlate: 'LD-19-44-AB',
    updatedAt: '2026-08-20 09:15'
  },
  {
    id: 'drv_esmeralda_03',
    name: 'Esmeralda Luísa',
    role: 'DRIVER',
    pin: DEMO_CREDENTIAL_PINS['drv_esmeralda_03'] || '',
    phone: '+244 923 777 333',
    status: 'active',
    vehiclePlate: 'LD-77-31-XP',
    updatedAt: '2026-08-19 18:00'
  },
  {
    id: 'adm_kizua_01',
    name: 'Kizua Muanza (Superadmin)',
    role: 'OPS_ADMIN',
    pin: DEMO_CREDENTIAL_PINS['adm_kizua_01'] || '',
    phone: '+244 912 000 001',
    status: 'active',
    updatedAt: '2026-08-20 08:00'
  }
];
