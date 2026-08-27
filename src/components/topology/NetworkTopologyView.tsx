import React, { useState, useEffect } from 'react';
import {
  Network,
  Server,
  Database,
  Smartphone,
  Shield,
  Zap,
  Cloud,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  Activity,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  Radio,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { RollbackStrategyConsole } from './RollbackStrategyConsole';

interface TopologyNode {
  id: string;
  name: string;
  category: 'mobile' | 'auth' | 'compute' | 'realtime' | 'sql' | 'cache' | 'storage';
  tech: string;
  role: string;
  ramLimit: string;
  cpuLimit: string;
  slaLatency: string;
  status: 'online' | 'standby';
}

const NODES: TopologyNode[] = [
  {
    id: 'node_passenger',
    name: 'Passenger Mobile App',
    category: 'mobile',
    tech: 'Flutter (Dart) / AOT',
    role: 'Edge computing de rotas, UI e cálculo local de tarifas em Kwanza (AOA)',
    ramLimit: '< 120 MB',
    cpuLimit: 'Client Thread',
    slaLatency: '< 1.0s app open',
    status: 'online'
  },
  {
    id: 'node_driver',
    name: 'Driver Mobile App',
    category: 'mobile',
    tech: 'Flutter (Dart) / AOT',
    role: 'GPS adaptativo, recepção de convites (15s) e controle de corrida',
    ramLimit: '< 120 MB',
    cpuLimit: 'Client Thread',
    slaLatency: '< 1.0s app open',
    status: 'online'
  },
  {
    id: 'node_firebase_auth',
    name: 'Firebase Authentication',
    category: 'auth',
    tech: 'Google Identity / JWT',
    role: 'Login social, validação de número de telefone (+244) e emissão de tokens',
    ramLimit: 'Managed Serverless',
    cpuLimit: 'Auto',
    slaLatency: '< 150 ms',
    status: 'online'
  },
  {
    id: 'node_firestore',
    name: 'Firebase Firestore (Realtime)',
    category: 'realtime',
    tech: 'NoSQL Document Store (5 coleções)',
    role: 'Armazenamento de estado volátil: drivers_online, trip_requests, active_trips',
    ramLimit: 'Managed Serverless',
    cpuLimit: 'Auto',
    slaLatency: '< 150 ms',
    status: 'online'
  },
  {
    id: 'node_api_gateway',
    name: 'FastAPI / Bun Gateway (Stateless Monolith)',
    category: 'compute',
    tech: 'FastAPI + Bun Server / Multi-Instance',
    role: 'API Gateway, Admin, Autenticação de rotas e orquestrador seguro com Auto-Scaling no Render',
    ramLimit: '< 512 MB por container',
    cpuLimit: '< 65% Target CPU',
    slaLatency: '< 80 ms',
    status: 'online'
  },
  {
    id: 'node_matching_service',
    name: 'FastAPI Matching Service (Stateless)',
    category: 'compute',
    tech: 'Python + uvloop + Geohash Engine',
    role: 'Filtragem espacial em memória e ranking determinístico de motoristas',
    ramLimit: '< 256 MB por container',
    cpuLimit: '< 20% CPU',
    slaLatency: '< 100 ms',
    status: 'online'
  },
  {
    id: 'node_redis',
    name: 'Redis Cluster (Distributed Locks & Cache)',
    category: 'cache',
    tech: 'Redis 7.2 Standalone / Render Private Net',
    role: 'Cache volátil de geohashes, rate limiting distribuído e distributed locks',
    ramLimit: '256 MB RAM',
    cpuLimit: '< 10% CPU',
    slaLatency: '< 5 ms',
    status: 'online'
  },
  {
    id: 'node_postgresql',
    name: 'PostgreSQL (Cloud SQL / Pool PgBouncer)',
    category: 'sql',
    tech: 'PostgreSQL 16 Relacional ACID',
    role: 'Fonte Única de Verdade para Usuários, Viagens, Transações e Carteira AOA',
    ramLimit: '1.7 GB RAM',
    cpuLimit: '1 vCPU dedicado',
    slaLatency: '< 20 ms',
    status: 'online'
  },
  {
    id: 'node_cloud_storage',
    name: 'Google Cloud Storage',
    category: 'storage',
    tech: 'GCS Standard Bucket',
    role: 'Armazenamento de CNH, fotos de veículos, comprovantes EMIS e recibos',
    ramLimit: 'Managed Object Storage',
    cpuLimit: 'Auto',
    slaLatency: '< 250 ms',
    status: 'online'
  }
];

export const NetworkTopologyView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'render_scaling' | 'rollback_strategy'>('render_scaling');
  const [selectedNode, setSelectedNode] = useState<TopologyNode>(NODES[4]); // API Gateway default

  // Horizontal Auto-Scaling Simulator State
  const [trafficRpm, setTrafficRpm] = useState<number>(3600); // 3600 req/min
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployStep, setDeployStep] = useState<number>(0);
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);

  // Auto-calculated scaling metrics
  const minInstances = 2;
  const maxInstances = 10;
  const targetRpmPerInstance = 2200;

  // Calculate dynamic instances needed
  const calculatedInstances = Math.min(
    maxInstances,
    Math.max(minInstances, Math.ceil(trafficRpm / targetRpmPerInstance))
  );

  const avgCpuPercent = Math.min(95, Math.round((trafficRpm / (calculatedInstances * targetRpmPerInstance)) * 65));
  const avgMemoryPercent = Math.min(90, Math.round(40 + (trafficRpm / (calculatedInstances * targetRpmPerInstance)) * 35));
  const rps = Math.round(trafficRpm / 60);
  const dbConnectionsTotal = calculatedInstances * 6; // ~6 conns per pool

  // Rolling Deploy Simulator sequence
  useEffect(() => {
    if (!isDeploying) return;
    const timer1 = setTimeout(() => setDeployStep(1), 1200); // Instance 1 Draining
    const timer2 = setTimeout(() => setDeployStep(2), 2600); // Instance 1 Ready with new v2.4.0
    const timer3 = setTimeout(() => setDeployStep(3), 4000); // Instance 2 Draining
    const timer4 = setTimeout(() => setDeployStep(4), 5400); // Instance 2 Ready with new v2.4.0
    const timer5 = setTimeout(() => {
      setDeployStep(5);
      setIsDeploying(false);
    }, 6800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isDeploying]);

  const renderYamlContent = `# @license
# SPDX-License-Identifier: Apache-2.0
# RIDING.ao - Render.com Horizontal Auto-Scaling Blueprint

services:
  - type: web
    name: riding-api-gateway
    env: node
    plan: standard
    region: frankfurt
    buildCommand: npm install && npm run build
    startCommand: node server.ts
    healthCheckPath: /health
    autoDeploy: true
    numInstances: 2

    scaling:
      minInstances: 2
      maxInstances: 10
      targetCPUPercent: 65
      targetMemoryPercent: 75

    envVars:
      - key: NODE_ENV
        value: production
      - key: WEB_CONCURRENCY
        value: "4"
      - key: MAX_CONCURRENCY
        value: "80"
      - key: REQUEST_TIMEOUT_MS
        value: "8000"
      - key: DATABASE_POOL_MAX
        value: "10"
      - key: REDIS_URL
        fromService:
          type: redis
          name: riding-redis-cluster
          property: connectionString

  - type: redis
    name: riding-redis-cluster
    plan: standard
    region: frankfurt`;

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Network className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Infraestrutura & Escalabilidade Horizontal (Render)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Topologia de microsserviços stateless, auto-scaling dinâmico (2 a 10 instâncias), zero-downtime rolling deploys e isolamento de banco.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-700 px-3 py-1.5 rounded-xl text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Render Cloud / Frankfurt (Zero-Egress Angola)</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('render_scaling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'render_scaling'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FFC107]" />
            Cluster Auto-Scaling no Render (2 → 10 nós)
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'topology'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Topologia Física e Nós de Rede (Cap. 8)
          </button>

          <button
            onClick={() => setActiveTab('rollback_strategy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'rollback_strategy'
                ? 'bg-red-700 text-white shadow-lg shadow-red-900/30 border border-red-500'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            Estratégia de Rollback & Releases (RTO &lt; 8s)
          </button>
        </div>
      </div>

      {/* TAB 1: RENDER HORIZONTAL AUTO-SCALING ORCHESTRATOR */}
      {activeTab === 'render_scaling' && (
        <div className="space-y-6">
          {/* Traffic Simulator & Auto-Scaling Controls */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Simulador de Carga & Auto-Scaling Dinâmico
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ajuste o tráfego de Luanda para testar a expansão elástica de containers no Render.
                </p>
              </div>

              {/* Traffic Presets */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <button
                  onClick={() => setTrafficRpm(600)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    trafficRpm <= 1000
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  🌙 Madrugada (600 rpm)
                </button>
                <button
                  onClick={() => setTrafficRpm(3600)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    trafficRpm > 1000 && trafficRpm <= 6000
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  ☀️ Comercial (3.6k rpm)
                </button>
                <button
                  onClick={() => setTrafficRpm(13500)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    trafficRpm > 6000 && trafficRpm <= 18000
                      ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  🚗 Pico 18h Luanda (13.5k rpm)
                </button>
                <button
                  onClick={() => setTrafficRpm(22000)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    trafficRpm > 18000
                      ? 'bg-red-950 border-red-600 text-red-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  ⚡ Tempestade / Chuva (22k rpm)
                </button>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-400">Taxa de Requisições:</span>
                <span className="text-emerald-400 font-bold">
                  {trafficRpm.toLocaleString('pt-AO')} requisições / min ({rps} req/s)
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="24000"
                step="200"
                value={trafficRpm}
                onChange={(e) => setTrafficRpm(Number(e.target.value))}
                className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-neutral-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>200 rpm (Mínimo)</span>
                <span>Alvo CPU: 65% | Alvo RAM: 75%</span>
                <span>24.000 rpm (Capacidade 10 nós)</span>
              </div>
            </div>

            {/* Telemetry Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Instâncias Ativas</span>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-xl font-mono font-bold text-white">
                    {calculatedInstances} <span className="text-xs text-neutral-500 font-normal">/ 10 máx</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  {calculatedInstances === minInstances ? 'Baseline HA (Mínimo)' : 'Auto-Scaled Up'}
                </span>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">CPU Média do Cluster</span>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="text-xl font-mono font-bold text-white">
                    {avgCpuPercent}%
                  </span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      avgCpuPercent > 80 ? 'bg-red-500' : avgCpuPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${avgCpuPercent}%` }}
                  />
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Vazão do Load Balancer</span>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FFC107]" />
                  <span className="text-xl font-mono font-bold text-white">
                    {rps} <span className="text-xs text-neutral-500 font-normal">RPS</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  ~{Math.round(rps / calculatedInstances)} RPS / instância
                </span>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Conexões PostgreSQL</span>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-xl font-mono font-bold text-white">
                    {dbConnectionsTotal} <span className="text-xs text-neutral-500 font-normal">/ 100 máx</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-400">
                  Protegido via PgBouncer Pool
                </span>
              </div>
            </div>
          </div>

          {/* Active Instances Grid */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Instâncias do Render Load Balancer ({calculatedInstances} nós em execução)
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Balanceamento Least-Connections com probes de <code className="text-emerald-400 font-mono">/health</code> e <code className="text-emerald-400 font-mono">/ready</code>.
                </p>
              </div>

              <button
                disabled={isDeploying}
                onClick={() => {
                  setIsDeploying(true);
                  setDeployStep(0);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  isDeploying
                    ? 'bg-amber-950 border-amber-600 text-amber-300 animate-pulse'
                    : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-700 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
                {isDeploying ? `Rolling Deploy (Passo ${deployStep + 1}/5)...` : 'Simular Rolling Deploy Zero-Downtime'}
              </button>
            </div>

            {/* Rolling Deploy Progress Banner */}
            {isDeploying && (
              <div className="bg-amber-950/40 border border-amber-700/60 rounded-2xl p-3 text-xs font-mono text-amber-300 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <div>
                  <div className="font-bold">Rolling Deployment v2.4.0 em Execução:</div>
                  <div className="text-[11px] text-amber-200/80 mt-0.5">
                    {deployStep === 0 && 'Iniciando container substituto no cluster...'}
                    {deployStep === 1 && 'Instância srv-node-1 drenando conexões ativas (isDraining = true, /ready = 503)...'}
                    {deployStep === 2 && 'Instância srv-node-1 atualizada com sucesso e respondendo 200 OK em /ready.'}
                    {deployStep === 3 && 'Instância srv-node-2 drenando conexões ativas sem perda de requisições...'}
                    {deployStep === 4 && 'Instância srv-node-2 atualizada com sucesso.'}
                    {deployStep >= 5 && 'Deploy concluído com 100% de disponibilidade e 0 erros de gateway.'}
                  </div>
                </div>
              </div>
            )}

            {/* Instance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {Array.from({ length: calculatedInstances }).map((_, index) => {
                const nodeName = `srv-node-${index + 1}`;
                const isDrainingNode = (deployStep === 1 && index === 0) || (deployStep === 3 && index === 1);
                const isUpdatedNode = (deployStep >= 2 && index === 0) || (deployStep >= 4 && index === 1);
                const memoryMb = Math.round(180 + Math.random() * 40 + (trafficRpm / 1000) * 12);
                const nodeRps = Math.round(rps / calculatedInstances);
                const nodeLatency = Math.round(22 + Math.random() * 8);

                return (
                  <div
                    key={nodeName}
                    className={`bg-neutral-950 border rounded-2xl p-3.5 space-y-2.5 transition-all ${
                      isDrainingNode
                        ? 'border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-400/40'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isDrainingNode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-mono font-bold text-white">{nodeName}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          isDrainingNode
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {isDrainingNode ? 'Draining' : isUpdatedNode ? 'v2.4.0' : 'In Service'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono text-neutral-400">
                      <div className="flex justify-between">
                        <span>CPU:</span>
                        <span className="text-white font-bold">{Math.max(15, avgCpuPercent + (index % 3) * 2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAM:</span>
                        <span className="text-sky-400 font-bold">{memoryMb} MB / 512 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vazão:</span>
                        <span className="text-[#FFC107] font-bold">{nodeRps} req/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SLA Latência:</span>
                        <span className="text-emerald-400 font-bold">{nodeLatency} ms</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>Probes: /health (200)</span>
                      <span className={isDrainingNode ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        /ready ({isDrainingNode ? '503' : '200'})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Render Blueprint (render.yaml) Inspector */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  Blueprint de Infraestrutura como Código (<code className="text-emerald-400">render.yaml</code>)
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Configuração declarativa nativa do Render para auto-scaling, replicação e variáveis de concorrência.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(renderYamlContent);
                  setCopiedYaml(true);
                  setTimeout(() => setCopiedYaml(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300"
              >
                {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedYaml ? 'Copiado!' : 'Copiar YAML'}
              </button>
            </div>

            <pre className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-72">
              {renderYamlContent}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL NETWORK TOPOLOGY */}
      {activeTab === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Visual Infrastructure Topology Graph */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Fluxo de Rede e Nós Físicos</span>
              <span className="text-[11px] font-mono text-emerald-400">Clique em qualquer nó para inspecionar</span>
            </div>

            {/* Level 1: Mobile Edge Apps */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">1. Camada Edge Mobile (Flutter)</div>
              <div className="grid grid-cols-2 gap-4">
                {NODES.filter((n) => n.category === 'mobile').map((node) => {
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#005A2B] border-emerald-500 text-white shadow-lg ring-2 ring-emerald-400/40'
                          : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Smartphone className={`w-4 h-4 ${isSelected ? 'text-[#FFC107]' : 'text-emerald-400'}`} />
                        <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-300">
                          {node.tech.split('/')[0]}
                        </span>
                      </div>
                      <div className="font-bold text-xs mt-1">{node.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                        {node.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connector Down */}
            <div className="flex justify-center text-neutral-600">
              <ArrowDown className="w-5 h-5 animate-pulse" />
            </div>

            {/* Level 2: Auth & Edge Gateway */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">2. Autenticação & Gateway Serverless / Render</div>
              <div className="grid grid-cols-2 gap-4">
                {[NODES[2], NODES[4]].map((node) => {
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#005A2B] border-emerald-500 text-white shadow-lg ring-2 ring-emerald-400/40'
                          : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Server className={`w-4 h-4 ${isSelected ? 'text-[#FFC107]' : 'text-amber-400'}`} />
                        <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
                          Render Cloud Service
                        </span>
                      </div>
                      <div className="font-bold text-xs mt-1">{node.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                        {node.tech}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connector Down */}
            <div className="flex justify-center text-neutral-600">
              <ArrowDown className="w-5 h-5 animate-pulse" />
            </div>

            {/* Level 3: Microservices & Data Storage */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-neutral-500 uppercase">3. Serviços & Camada de Persistência Híbrida</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[NODES[3], NODES[5], NODES[6], NODES[7], NODES[8]].map((node) => {
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                          : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {node.category === 'sql' && <Database className="w-4 h-4 text-blue-400" />}
                        {node.category === 'realtime' && <Zap className="w-4 h-4 text-[#FFC107]" />}
                        {node.category === 'compute' && <Cpu className="w-4 h-4 text-emerald-400" />}
                        {node.category === 'cache' && <HardDrive className="w-4 h-4 text-purple-400" />}
                        {node.category === 'storage' && <Cloud className="w-4 h-4 text-cyan-400" />}
                        <span className="text-[9px] font-mono text-neutral-400">{node.ramLimit}</span>
                      </div>
                      <div className="font-bold text-xs mt-1 truncate">{node.name.split('(')[0]}</div>
                      <div className="text-[9px] text-neutral-500 truncate">{node.tech.split(' ')[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Node Detail Panel */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Inspeção de Nó</span>
                <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-400 text-[10px]">Tecnologia Homologada:</span>
                <div className="font-mono text-emerald-400 font-bold bg-black/40 p-2 rounded-xl border border-neutral-800 mt-1">
                  {selectedNode.tech}
                </div>
              </div>

              <div>
                <span className="text-neutral-400 text-[10px]">Papel Arquitetural:</span>
                <p className="text-neutral-200 mt-1 leading-relaxed">{selectedNode.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800 text-[11px]">
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-neutral-400 text-[10px]">Limite de RAM:</div>
                  <div className="font-mono font-bold text-[#FFC107] mt-0.5">{selectedNode.ramLimit}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-neutral-400 text-[10px]">Limite de CPU:</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{selectedNode.cpuLimit}</div>
                </div>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 text-[10px]">SLA de Latência Máxima:</div>
                <div className="font-mono font-bold text-amber-400 mt-0.5">{selectedNode.slaLatency}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STRATEGIC ROLLBACK & RELEASE MANAGEMENT */}
      {activeTab === 'rollback_strategy' && (
        <RollbackStrategyConsole />
      )}
    </div>
  );
};

