import { DriverState, LuandaLocation, TripCategory } from '../types/architecture';

export const LUANDA_LOCATIONS: LuandaLocation[] = [
  {
    id: 'loc_aeroporto',
    name: 'Aeroporto 4 de Fevereiro',
    neighborhood: 'Maianga',
    lat: -8.8584,
    lng: 13.2312,
    geohash: 'kr7b0d',
    description: 'Terminal Internacional e Doméstico de Luanda'
  },
  {
    id: 'loc_marginal',
    name: 'Marginal de Luanda (Baía)',
    neighborhood: 'Ingombota',
    lat: -8.8095,
    lng: 13.2384,
    geohash: 'kr7b1r',
    description: 'Avenida 4 de Fevereiro e Porto de Luanda'
  },
  {
    id: 'loc_talatona',
    name: 'Talatona Shopping & Centro Financeiro',
    neighborhood: 'Talatona',
    lat: -8.9182,
    lng: 13.1802,
    geohash: 'kr78pp',
    description: 'Polo empresarial e residencial nobre'
  },
  {
    id: 'loc_kilamba',
    name: 'Centralidade do Kilamba',
    neighborhood: 'Belas',
    lat: -8.9950,
    lng: 13.2560,
    geohash: 'kr78te',
    description: 'Bloco Q - Centralidade do Kilamba'
  },
  {
    id: 'loc_mutamba',
    name: 'Largo da Mutamba (Centro)',
    neighborhood: 'Ingombota',
    lat: -8.8142,
    lng: 13.2335,
    geohash: 'kr7b1q',
    description: 'Coração financeiro e ministerial histórico'
  },
  {
    id: 'loc_ilha',
    name: 'Ilha do Cabo (Praia do Ponto Final)',
    neighborhood: 'Luanda',
    lat: -8.7750,
    lng: 13.2510,
    geohash: 'kr7b6w',
    description: 'Polo turístico e gastronômico da orla'
  },
  {
    id: 'loc_viana',
    name: 'Viana - Ponte Partida',
    neighborhood: 'Viana',
    lat: -8.9050,
    lng: 13.3720,
    geohash: 'kr79cb',
    description: 'Entroncamento comercial da Estrada de Catete'
  },
  {
    id: 'loc_cazenga',
    name: 'Cazenga - Marco Histórico',
    neighborhood: 'Cazenga',
    lat: -8.8250,
    lng: 13.2950,
    geohash: 'kr7b4y',
    description: 'Avenida Hoji-ya-Henda'
  },
  {
    id: 'loc_maculusso',
    name: 'Largo do Kinaxixi / Maculusso',
    neighborhood: 'Maianga',
    lat: -8.8210,
    lng: 13.2390,
    geohash: 'kr7b1v',
    description: 'Zona residencial nobre e embaixadas'
  },
  {
    id: 'loc_novavida',
    name: 'Projecto Nova Vida',
    neighborhood: 'Kilamba Kiaxi',
    lat: -8.8820,
    lng: 13.2280,
    geohash: 'kr78xw',
    description: 'Rotunda Central da Nova Vida'
  }
];

export const TRIP_CATEGORIES: TripCategory[] = [
  {
    id: 'economico',
    name: 'Go Económico',
    description: 'Carros compactos do dia-a-dia com melhor tarifa',
    basePriceAOA: 1200,
    pricePerKmAOA: 350,
    multiplier: 1.0,
    etaMins: 3,
    icon: 'Car'
  },
  {
    id: 'conforto',
    name: 'Go Conforto',
    description: 'Sedans novos com ar-condicionado garantido',
    basePriceAOA: 1800,
    pricePerKmAOA: 480,
    multiplier: 1.35,
    etaMins: 5,
    icon: 'Sparkles'
  },
  {
    id: 'express',
    name: 'Go Express (Moto/Entrega)',
    description: 'Deslocamento ágil pelo trânsito de Luanda',
    basePriceAOA: 800,
    pricePerKmAOA: 220,
    multiplier: 0.7,
    etaMins: 2,
    icon: 'Zap'
  }
];

export const INITIAL_DRIVERS: DriverState[] = [
  {
    id: 'drv_manuel_01',
    name: 'Manuel Sebastião',
    phone: '+244 923 456 789',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehicleModel: 'Hyundai i10 Grand (Branco)',
    vehiclePlate: 'LD-42-89-HZ',
    rating: 4.92,
    totalTrips: 1420,
    status: 'online',
    lat: -8.8235,
    lng: 13.2360,
    heading: 45,
    speedKmH: 22,
    geohash: 'kr7b1v',
    walletBalanceAOA: 48500,
    lastGpsUpdate: Date.now()
  },
  {
    id: 'drv_antonio_02',
    name: 'António da Silva Pedro',
    phone: '+244 934 112 334',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehicleModel: 'Toyota Corolla Sedan (Prata)',
    vehiclePlate: 'LD-18-93-GP',
    rating: 4.88,
    totalTrips: 980,
    status: 'online',
    lat: -8.8180,
    lng: 13.2420,
    heading: 120,
    speedKmH: 18,
    geohash: 'kr7b1r',
    walletBalanceAOA: 32400,
    lastGpsUpdate: Date.now()
  },
  {
    id: 'drv_esmeralda_03',
    name: 'Esmeralda Kapenda',
    phone: '+244 945 998 877',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    vehicleModel: 'Kia Picanto (Vermelho)',
    vehiclePlate: 'LD-55-12-KL',
    rating: 4.96,
    totalTrips: 1850,
    status: 'online',
    lat: -8.8500,
    lng: 13.2350,
    heading: 180,
    speedKmH: 34,
    geohash: 'kr7b0d',
    walletBalanceAOA: 67200,
    lastGpsUpdate: Date.now()
  },
  {
    id: 'drv_joao_04',
    name: 'João Baptista Chivela',
    phone: '+244 912 334 556',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    vehicleModel: 'Suzuki Swift (Azul)',
    vehiclePlate: 'LD-77-34-MN',
    rating: 4.85,
    totalTrips: 640,
    status: 'online',
    lat: -8.9100,
    lng: 13.1850,
    heading: 270,
    speedKmH: 0,
    geohash: 'kr78pp',
    walletBalanceAOA: 19800,
    lastGpsUpdate: Date.now()
  }
];
