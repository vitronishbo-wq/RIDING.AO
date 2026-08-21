import { ConstitutionChapter, ForbiddenTechnology, SlaLimit } from '../types/architecture';

export const CONSTITUTION_CHAPTERS: ConstitutionChapter[] = [
  {
    id: 1,
    title: "Capítulo 1 — Filosofia",
    subtitle: "Norte Imutável",
    status: "FROZEN",
    summary: "Processamento pesado no cliente (Edge Computing). O backend é apenas orquestrador e autenticador.",
    rules: [
      "O passageiro nunca é obrigado a conhecer um endereço formal. O sistema deve aceitar intenções, referências urbanas, marcos conhecidos e destinos aproximados, refinando a localização apenas quando isso agregar valor à experiência.",
      "Todo processamento pesado e passível de ser executado no dispositivo DEVE ocorrer no cliente (Edge Computing).",
      "O servidor backend é exclusivamente um orquestrador e autenticador, nunca um executor de cargas pesadas.",
      "A pergunta guia para toda feature é: 'Como eliminar mais uma camada de custo?'.",
      "Toda decisão arquitetural deve priorizar a redução do custo operacional por corrida acima da complexidade prematura."
    ],
    codeSnippet: `// Edge Calculation Rule (Flutter Client):
// Cálculo de distância e estimativa de tarifa 100% no dispositivo antes de bater no backend
class TripPriceEstimator {
  static double calculateAOA({required double distanceKm, required double multiplier}) {
    const double baseRate = 1200.0; // Taxa base Luanda em Kwanzas (AOA)
    const double kmRate = 350.0;
    return (baseRate + (distanceKm * kmRate)) * multiplier;
  }
}`
  },
  {
    id: 2,
    title: "Capítulo 2 — Tecnologias Permitidas",
    subtitle: "Stack Oficial Homologada",
    status: "FROZEN",
    summary: "Stack rigorosamente delimitada sem acréscimos sem revisão constitucional.",
    rules: [
      "Mobile (UI): Flutter (Dart) — Único framework para Passageiro e Motorista (90% código compartilhado).",
      "Backend Core: Python + FastAPI — Monolítico modular (API Gateway, Admin, Finance).",
      "Matching Engine: Python + FastAPI — Serviço separado, stateless, com índice em memória.",
      "Auth: Firebase Authentication — Login social, telefone/email e tokens JWT.",
      "Realtime DB: Firebase Firestore — Apenas para estado volátil (online, localização, corridas ativas).",
      "Financeiro/SQL: PostgreSQL — Fonte única de verdade para transações, usuários e auditoria.",
      "Cache: Redis — Geohashes e sessões rápidas.",
      "Mapas: MapLibre GL Native — Renderização offline com OpenStreetMap tiles.",
      "Storage: Google Cloud Storage — Documentos, CNH, fotos e recibos.",
      "Notificações: FCM (Push) + Twilio (SMS fallback).",
      "Orquestração: Docker + Google Cloud Run (Sem Kubernetes).",
      "CI/CD: GitHub Actions — Build, testes e deploy automatizados."
    ]
  },
  {
    id: 3,
    title: "Capítulo 3 — Tecnologias Proibidas",
    subtitle: "Anti-padrões e Rejeição Automática em PR",
    status: "FROZEN",
    summary: "Tecnologias expressamente banidas do repositório para evitar custo e complexidade operacional desnecessários.",
    rules: [
      "Proibidos Orquestradores: Kubernetes, Nomad, Swarm (Usar Google Cloud Run).",
      "Proibidos Filas/Brokers: RabbitMQ, Apache Kafka, AWS SQS (Substituir por pub/sub do Firestore ou chamadas síncronas com timeout).",
      "Proibidos Bancos NoSQL adicionais: MongoDB, Cassandra, DynamoDB (Usar PostgreSQL ou Firestore).",
      "Proibidas APIs complexas: GraphQL, SOAP (Usar REST estrito com Pydantic).",
      "Proibidas Arquiteturas Pesadas: CQRS, Event Sourcing completo, DDD com camadas reativas complexas.",
      "Proibido Front-end complexo: Redux no Flutter (Usar Cubit ou Provider simples), SSR.",
      "Proibido Machine Learning pesado no Matching: Nenhum modelo de ML no algoritmo central. IA restrita a Suporte, OCR e Fraude isolados via API."
    ]
  },
  {
    id: 4,
    title: "Capítulo 4 — Princípios Imutáveis",
    subtitle: "Estrutura Atômica do Sistema",
    status: "FROZEN",
    summary: "A arquitetura física e lógica nunca excederá os 7 pilares estruturais atômicos.",
    rules: [
      "1 Backend Principal (FastAPI monolítico para Admin e Gateway).",
      "1 Serviço de Matching (FastAPI stateless de alta performance).",
      "1 Serviço Financeiro (Módulo isolado ou FastAPI próprio com PostgreSQL transacional).",
      "1 Banco Relacional (PostgreSQL) para todos os dados permanentes.",
      "1 Banco Realtime (Firestore) para estado volátil.",
      "1 Sistema de Autenticação (Firebase Auth).",
      "1 Sistema de Pagamentos (Integração gateway local via API: Multicaixa Express / GPO)."
    ]
  },
  {
    id: 5,
    title: "Capítulo 5 — Limites Operacionais e SLAs",
    subtitle: "Desempenho e Requisitos de Latência",
    status: "FROZEN",
    summary: "SLAs estritos de matching (<100ms), inicialização de app (<1s) e consumo de hardware.",
    rules: [
      "Tempo de Matching: < 100 ms (do pedido ao envio de convite ao motorista).",
      "Abertura do App: < 1 segundo (Splash + Home pronta).",
      "CPU Backend (pico): < 30% por instância.",
      "RAM Backend: < 512 MB por instância.",
      "Latência Firestore: < 150 ms.",
      "Payload JSON Máximo: 30 KB por requisição/resposta.",
      "Tamanho do App (Android/iOS): < 35 MB.",
      "Atualização Delta: < 5 MB.",
      "Cold Start Cloud Run: < 2 segundos.",
      "Tamanho do Widget Flutter: < 200 linhas.",
      "Tamanho de Classe: < 300 linhas.",
      "Tamanho de Função: < 40 linhas.",
      "Arquivo Único: < 500 linhas.",
      "GPS Adaptativo Obrigatório: Parado = 0 updates/min | <5 km/h = 15s | 5~30 km/h = 8s | >30 km/h = 3s."
    ]
  },
  {
    id: 6,
    title: "Capítulo 6 — Convenções de Código",
    subtitle: "Nomenclatura e Separação de Camadas",
    status: "FROZEN",
    summary: "Padrões rígidos para Flutter e Python FastAPI sem lógica de negócio em utilitários.",
    rules: [
      "Flutter: Classes de repositório devem terminar com 'Repository' (ex: AuthRepository).",
      "Flutter: Classes de caso de uso devem terminar com 'UseCase' (ex: RequestTripUseCase).",
      "Flutter: Camada de dados deve terminar com 'DataSource' (ex: AuthRemoteDataSource).",
      "Flutter: A UI NUNCA acessa Firestore, PostgreSQL ou SharedPreferences diretamente; sempre via Repository -> UseCase.",
      "Python: Toda rota FastAPI deve terminar com '_router.py'.",
      "Python: Schemas Pydantic devem terminar com '_schema.py'.",
      "Python: Models SQLAlchemy devem terminar com '_model.py'.",
      "Regra de Ouro: Nenhum 'Utils' pode conter lógica de negócio; apenas funções matemáticas puras (ex: cálculos de geohash)."
    ]
  },
  {
    id: 7,
    title: "Capítulo 7 — Fluxos Oficiais",
    subtitle: "Sequências de Execução Obrigatórias",
    status: "FROZEN",
    summary: "Apenas 3 fluxos centrais homologados: Login, Matching e Fechamento Financeiro.",
    rules: [
      "Fluxo A (Login): App Init -> Auth Cubit -> Firebase Auth.signIn() -> Firestore fetch Profile -> Home Page.",
      "Fluxo B (Solicitar Corrida): Home -> Destino -> Local Calculate Price -> Request Trip -> Firestore (trip_requests) -> Matching Engine (Geohash + Score) -> Firestore (driver invite) -> Driver App receive -> Driver Accept -> Firestore (active_trips) -> Passenger Active Trip Page.",
      "Fluxo C (Pagamento e Fechamento): Trip Finished -> Finance Service (PostgreSQL transaction) -> Wallet debit/credit -> Analytics Event -> Push Notification Receipt."
    ]
  },
  {
    id: 8,
    title: "Capítulo 8 — Arquitetura Física",
    subtitle: "Topologia de Rede e Comunicação",
    status: "FROZEN",
    summary: "Topologia com CDN, Cloud Run, Firestore, PostgreSQL e Redis isolados.",
    rules: [
      "Edge Mobile Apps (Passenger & Driver em Flutter).",
      "Firebase Auth intermediando autenticação JWT direta.",
      "Firestore gerenciando coleções em tempo real com baixa latência.",
      "FastAPI Gateway em Google Cloud Run orquestrando endpoints seguros.",
      "FastAPI Matching Service em Cloud Run com acesso direto ao Redis in-memory.",
      "PostgreSQL (Google Cloud SQL) como banco relacional transacional ACID.",
      "Google Cloud Storage para CNH, fotos e comprovantes."
    ]
  },
  {
    id: 9,
    title: "Capítulo 9 — Estrutura do Repositório",
    subtitle: "Árvore de Diretórios Oficial",
    status: "FROZEN",
    summary: "Monorepo organizado com apps (passenger, driver), backend modular e pacotes compartilhados.",
    rules: [
      "apps/passenger/lib/ (core/, modules/ [auth, home, map, trips, wallet, settings], shared/)",
      "apps/driver/lib/ (mesma estrutura modular)",
      "backend/ (api_gateway/, matching_service/, finance_service/, support_bot/, shared_libs/)",
      "packages/ (componentes de UI, Maps e Auth compartilhados)",
      "infrastructure/ (terraform/ e docker/)",
      "database/ (migrations/ e firestore/)",
      "docs/api/ (openapi.yaml)",
      "tests/ (unit/ e integration/)"
    ]
  },
  {
    id: 10,
    title: "Capítulo 10 — Padrão de Código e Qualidade",
    subtitle: "Gerenciamento de Estado e Testes",
    status: "FROZEN",
    summary: "Flutter Cubit obrigatório, Pydantic V2, SQLAlchemy 2.0 e cobertura unitária.",
    rules: [
      "Flutter: Utilizar exclusivamente Cubit para gerenciamento de estado previsível e sem boilerplate.",
      "Python: Pydantic V2 para validação ultra-rápida de esquemas e serialização JSON.",
      "Python: SQLAlchemy 2.0 para ORM assíncrono e transações seguras no PostgreSQL.",
      "Testes: Toda UseCase no Flutter e toda rota de criação/atualização no Backend deve ter no mínimo 1 teste unitário do caminho feliz."
    ]
  },
  {
    id: 11,
    title: "Capítulo 11 — APIs Oficiais",
    subtitle: "Prefixos e Endpoints Restritos",
    status: "FROZEN",
    summary: "Catálogo estrito de rotas REST v1 para Passageiro, Motorista e Admin.",
    rules: [
      "Prefixos: /v1/passenger/, /v1/driver/, /v1/admin/",
      "POST /trips/request -> { origin, destination, payment_method }",
      "POST /trips/cancel -> { trip_id }",
      "GET /trips/status -> { trip_id }",
      "POST /matching/find -> (Invocado internamente pelo Gateway)",
      "GET /finance/wallet -> { balance, transactions }",
      "POST /finance/pay -> { trip_id, amount }",
      "GET /drivers/nearby -> (Apenas para depuração, não para matching produtivo)"
    ]
  },
  {
    id: 12,
    title: "Capítulo 12 — Banco de Dados Oficial",
    subtitle: "Schemas Estritos Firestore e PostgreSQL",
    status: "FROZEN",
    summary: "Exatamente 5 coleções no Firestore e 6 tabelas relacionais no PostgreSQL.",
    rules: [
      "Firestore Coleção 1: drivers_online (doc: driverId -> { status, geohash, lastUpdate })",
      "Firestore Coleção 2: driver_locations (doc: driverId -> { lat, lng, heading, speed })",
      "Firestore Coleção 3: trip_requests (doc: tripId -> { passengerId, origin, destiny, status: 'waiting' })",
      "Firestore Coleção 4: active_trips (doc: tripId -> { driverId, passengerId, startTime, routePolyline })",
      "Firestore Coleção 5: presence (doc: userId -> { online, lastSeen })",
      "PostgreSQL Tabela 1: users (id, name, phone, email, firebase_uid, created_at)",
      "PostgreSQL Tabela 2: drivers (id, user_id, vehicle_plate, vehicle_model, cnh, status, documents_verified)",
      "PostgreSQL Tabela 3: trips (id, passenger_id, driver_id, origin, destiny, distance_km, price_aoa, status, started_at, finished_at)",
      "PostgreSQL Tabela 4: payments (id, trip_id, passenger_id, amount, method, status, transaction_id, paid_at)",
      "PostgreSQL Tabela 5: wallet (id, user_id, balance, currency, updated_at)",
      "PostgreSQL Tabela 6: ratings (id, trip_id, author_id, target_id, score, comment)"
    ]
  },
  {
    id: 13,
    title: "Capítulo 13 — Eventos Oficiais",
    subtitle: "Analytics e Auditoria",
    status: "FROZEN",
    summary: "Exatamente 9 eventos autorizados no pipeline analítico.",
    rules: [
      "1. app_opened",
      "2. trip_requested",
      "3. driver_accepted",
      "4. driver_arrived",
      "5. trip_started",
      "6. trip_finished",
      "7. payment_completed",
      "8. wallet_updated",
      "9. user_rated"
    ]
  },
  {
    id: 14,
    title: "Capítulo 14 — Design System",
    subtitle: "Tokens de UI e Identidade Visual",
    status: "FROZEN",
    summary: "Paleta oficial Angola, escala de espaçamento estrita e tipografia Inter.",
    rules: [
      "Espaçamentos permitidos: { 4, 8, 16, 24, 32, 48, 64 } px.",
      "Raios de Borda (BorderRadius): { 8, 16, 24 } px.",
      "Tipografia: Inter (pesos: 400, 500, 600, 700).",
      "Cores Primárias: Verde Angola (#005A2B), Amarelo (#FFC107).",
      "Cores Neutras: #1A1A1A (Dark), #6C757D (Muted), #F8F9FA (Light).",
      "Cores de Status: Success (#28A745), Warning (#FFC107), Danger (#DC3545)."
    ]
  },
  {
    id: 15,
    title: "Capítulo 15 — Unified Shell & Capabilities (V2.0)",
    subtitle: "Single Interface Architecture & Zero Hardcoded Secrets",
    status: "FROZEN",
    summary: "O aplicativo nunca pergunta o papel do usuário. A UI é renderizada dinamicamente a partir do Permission Engine baseado em capacidades, sem segredos ou credenciais no código.",
    rules: [
      "Regra da Abertura Silenciosa: O App NUNCA pergunta 'Entrar como motorista / passageiro / admin?'. O Unified Shell resolve a sessão e identidade autonomamente.",
      "Arquitetura Baseada em Capacidades (RBAC Atômico): Eliminação de 'Roles' rígidas (GOD/ADMIN/PASSENGER). O Identity Resolver emite permissões granulares: trip.request, trip.accept, trip.cancel, wallet.read, wallet.write, finance.read, finance.write, driver.manage, user.manage, system.logs, system.audit, system.config, system.override.",
      "Module Registry & UI Dinâmica: A interface nasce estritamente das permissões ativas. Se o usuário não possui 'finance.read', o módulo nem sequer é instanciado na árvore de widgets.",
      "Perfil Founder sem Exceção de Código: O Founder é um perfil que recebe ALL_PERMISSIONS via motor de autorização padronizado. Zero 'if (isGod)' ou middlewares mágicos.",
      "Hidden Entry Engine: Detecção genérica de gatilhos (Gesture no logo, Debug Sequence, Dev Token, Deep Link, NFC/QR) para requisição de autenticação reforçada.",
      "Privilege Escalation Engine: Fluxo estrito de elevação: Gatilho -> Desafio Biométrico/Auth -> Concessão Temporária -> Registro em Audit Log -> Timeout Automático -> Destruição Segura da Sessão.",
      "Proibição Constitucional de Segredos no Código: ZERO e-mails, senhas, PINs, chaves de API ou UUIDs fixos na Constituição ou no repositório. Toda credencial DEVE ser injetada via Bootstrap Vault (KMS / Google Cloud Secret Manager) por ambiente (Dev, Staging, Prod)."
    ],
    codeSnippet: `// Capability-Based Dynamic Module Loader (Flutter / Dart):
class ModuleRegistry {
  static List<Widget> resolveModulesForUser(Set<Permission> userPermissions) {
    return allModules
      .where((module) => module.requiredPermissions.every(userPermissions.contains))
      .map((module) => module.buildWidget())
      .toList();
  }
}`
  }
];

export const FORBIDDEN_TECH_LIST: ForbiddenTechnology[] = [
  {
    category: "Orquestradores",
    forbidden: ["Kubernetes", "K8s", "Nomad", "Docker Swarm"],
    allowedAlternative: "Google Cloud Run (Serverless Container)",
    reason: "Custo de manutenção de cluster e complexidade operacional eliminados."
  },
  {
    category: "Mensageria e Filas",
    forbidden: ["RabbitMQ", "Apache Kafka", "AWS SQS", "Celery Broker"],
    allowedAlternative: "Firestore Realtime Pub/Sub ou Chamadas Síncronas com Timeout",
    reason: "Evita manter brokers de fila sempre ligados com cobrança fixa por instância."
  },
  {
    category: "Bancos NoSQL não autorizados",
    forbidden: ["MongoDB", "Cassandra", "DynamoDB", "CouchDB"],
    allowedAlternative: "PostgreSQL (Cloud SQL) + Firebase Firestore",
    reason: "PostgreSQL garante consistência contábil ACID e Firestore lida com dados em tempo real."
  },
  {
    category: "Protocolos de API",
    forbidden: ["GraphQL", "SOAP", "gRPC na Web pública"],
    allowedAlternative: "REST Estrito com OpenAPI / Pydantic V2",
    reason: "Simplicidade, cache HTTP nativo e payloads determinísticos."
  },
  {
    category: "Gerenciamento de Estado Mobile",
    forbidden: ["Redux", "MobX complexo", "Bloc com Events verbosos"],
    allowedAlternative: "Flutter Cubit ou Provider Simples",
    reason: "Minimiza boilerplate e reduz o tempo de onboarding e compilação."
  },
  {
    category: "Algoritmos de Matching Pesados",
    forbidden: ["Machine Learning / Deep Learning em tempo real no Matching", "Genetic Algorithms"],
    allowedAlternative: "Algoritmo Determinístico Geohash + Fórmula de Score em memória",
    reason: "Garante SLA <100ms e previsibilidade determinística com zero latência de inferência."
  }
];

export const OPERATIONAL_SLAS: SlaLimit[] = [
  {
    metric: "Tempo de Matching",
    limit: "< 100 ms",
    currentSimulated: "28 ms",
    status: "optimal",
    detail: "Geohash grid lookup em memória Redis + cálculo de score determinístico."
  },
  {
    metric: "Abertura do App (Cold Start)",
    limit: "< 1.0 s",
    currentSimulated: "0.64 s",
    status: "optimal",
    detail: "Splash Flutter compilado em AOT com inicialização preguiçosa de módulos."
  },
  {
    metric: "CPU Backend (Pico)",
    limit: "< 30% por instância",
    currentSimulated: "14.2%",
    status: "optimal",
    detail: "FastAPI assíncrono com uvloop rodando em Cloud Run auto-scaled."
  },
  {
    metric: "RAM Backend",
    limit: "< 512 MB",
    currentSimulated: "186 MB",
    status: "optimal",
    detail: "Microserviços stateless leves com baixo footprint de memória."
  },
  {
    metric: "Latência Firestore Realtime",
    limit: "< 150 ms",
    currentSimulated: "72 ms",
    status: "optimal",
    detail: "Subscrições otimizadas em documentos com chaves diretas (driverId/tripId)."
  },
  {
    metric: "Tamanho Máximo Payload JSON",
    limit: "≤ 30 KB",
    currentSimulated: "2.8 KB",
    status: "optimal",
    detail: "Estruturas de dados compactas sem aninhamento desnecessário."
  },
  {
    metric: "Tamanho do APK / IPA",
    limit: "< 35 MB",
    currentSimulated: "21.4 MB",
    status: "optimal",
    detail: "Compressão de assets, MapLibre com vetor tiles compactos."
  }
];
