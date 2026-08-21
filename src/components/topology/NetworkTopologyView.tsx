import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

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
    name: 'FastAPI Gateway (Monolito Modular)',
    category: 'compute',
    tech: 'Python 3.12 + FastAPI + Uvicorn',
    role: 'API Gateway, Admin, Autenticação de rotas e orquestrador seguro',
    ramLimit: '< 512 MB por container',
    cpuLimit: '< 30% CPU',
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
    name: 'Redis Cache (In-Memory)',
    category: 'cache',
    tech: 'Redis 7.2 Standalone',
    role: 'Cache volátil de geohashes e sessões de matching de ultra-baixa latência',
    ramLimit: '256 MB RAM',
    cpuLimit: '< 10% CPU',
    slaLatency: '< 5 ms',
    status: 'online'
  },
  {
    id: 'node_postgresql',
    name: 'PostgreSQL (Cloud SQL)',
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
  const [selectedNode, setSelectedNode] = useState<TopologyNode>(NODES[4]); // FastAPI Gateway default

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Network className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Topologia Física e Arquitetura de Rede (Capítulo 8)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Google Cloud Run Serverless + PostgreSQL + Firestore Realtime. Zero Kubernetes, Zero Kafka (Cap. 3).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-700 px-3 py-1.5 rounded-xl text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Infraestrutura 100% Homologada</span>
            </span>
          </div>
        </div>
      </div>

      {/* Visual Network Map & Interactive Inspector */}
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
            <div className="text-[11px] font-mono text-neutral-500 uppercase">2. Autenticação & Gateway Serverless</div>
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
                        Google Cloud Run
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
    </div>
  );
};
