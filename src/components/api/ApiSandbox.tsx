/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Centralized API Sandbox & Live Gateway Workbench
 * 
 * TODAS AS APIS DE NEGÓCIO PASSAM OBRIGATORIAMENTE PELO GATEWAY RENDER.
 * Execução interativa real contra /api/v1/... com telemetria e headers.
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Globe,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  category: 'Trips' | 'Drivers' | 'Payments' | 'Finance' | 'Master' | 'Gateway';
  description: string;
  sampleBody?: Record<string, any>;
  sampleResponse?: Record<string, any>;
}

const OFFICIAL_APIS: ApiEndpoint[] = [
  {
    id: 'rides-quote',
    method: 'POST',
    path: '/rides/quote',
    category: 'Trips',
    description: 'Cálculo determinístico de tarifa com Surge Luanda, distância e piso 500 AOA',
    sampleBody: {
      origin: { lat: -8.8584, lng: 13.2312, name: 'Aeroporto 4 de Fevereiro' },
      destination: { lat: -8.8095, lng: 13.2384, name: 'Marginal de Luanda' },
      category: 'economico',
      surgeMultiplier: 1.2
    }
  },
  {
    id: 'rides-request',
    method: 'POST',
    path: '/rides/request',
    category: 'Trips',
    description: 'Solicitação atômica de corrida e enfileiramento no cluster Render',
    sampleBody: {
      passengerId: 'pass_luanda_99',
      passengerName: 'Kiala Sebastião',
      origin: { lat: -8.8584, lng: 13.2312, name: 'Aeroporto 4 de Fevereiro' },
      destination: { lat: -8.8095, lng: 13.2384, name: 'Marginal de Luanda' },
      category: 'economico',
      paymentMethod: 'MULTICAIXA_EXPRESS',
      quotedPriceAOA: 3200
    }
  },
  {
    id: 'rides-status',
    method: 'GET',
    path: '/rides/trip_892102/status',
    category: 'Trips',
    description: 'Consulta do ciclo de vida da corrida e telemetria do motorista'
  },
  {
    id: 'rides-match',
    method: 'POST',
    path: '/rides/trip_892102/match',
    category: 'Trips',
    description: 'Algoritmo geoespacial k-ring para despacho prioritário de motoristas',
    sampleBody: {
      geohash: 'kr7b1v'
    }
  },
  {
    id: 'rides-cancel',
    method: 'POST',
    path: '/rides/trip_892102/cancel',
    category: 'Trips',
    description: 'Cancelamento centralizado com auditoria e verificação de taxa de 5 min',
    sampleBody: {
      reason: 'Mudança de planos do passageiro'
    }
  },
  {
    id: 'drivers-telemetry',
    method: 'POST',
    path: '/drivers/telemetry',
    category: 'Drivers',
    description: 'Ingestão de GPS em lote, cálculo de velocidade e status do motorista',
    sampleBody: {
      driverId: 'drv_manuel_01',
      lat: -8.835,
      lng: 13.235,
      speedKmh: 42,
      heading: 180,
      status: 'ONLINE'
    }
  },
  {
    id: 'drivers-nearby',
    method: 'GET',
    path: '/drivers/nearby',
    category: 'Drivers',
    description: 'Localização em tempo real de motoristas livres no quadrante Luanda'
  },
  {
    id: 'payments-intent',
    method: 'POST',
    path: '/payments/intent',
    category: 'Payments',
    description: 'Criação de intenção de pagamento idempotente (EMIS / AppyPay)',
    sampleBody: {
      rideId: 'trip_892102',
      amountAOA: 3200,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      idempotencyKey: 'idemp_pass_trip_892102_a1'
    }
  },
  {
    id: 'payments-charge-gpo',
    method: 'POST',
    path: '/payments/charge/gpo',
    category: 'Payments',
    description: 'Disparo de cobrança Push Multicaixa Express (janela 90 segundos)',
    sampleBody: {
      rideId: 'trip_892102',
      phoneNumber: '+244923123456',
      amountAOA: 3200
    }
  },
  {
    id: 'payments-charge-ref',
    method: 'POST',
    path: '/payments/charge/ref',
    category: 'Payments',
    description: 'Geração de entidade e referência bancária Multicaixa (expiração 72h)',
    sampleBody: {
      rideId: 'trip_892102',
      amountAOA: 3500
    }
  },
  {
    id: 'finance-wallet',
    method: 'GET',
    path: '/finance/wallet',
    category: 'Finance',
    description: 'Extrato financeiro com divisão 85/15 e saldo em Kwanzas (AOA)'
  },
  {
    id: 'gateway-catalog',
    method: 'GET',
    path: '/gateway/catalog',
    category: 'Gateway',
    description: 'Descoberta de rotas e catálogo central de SLA do Render Gateway'
  },
  {
    id: 'master-breakglass',
    method: 'POST',
    path: '/master/breakglass/validate',
    category: 'Master',
    description: 'Validação criptográfica Shamir 3-de-5 no Gateway Central',
    sampleBody: {
      shares: [
        '801-7fa89012cd',
        '802-b430198afe',
        '803-c99201df34'
      ]
    }
  }
];

export const ApiSandbox: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint>(OFFICIAL_APIS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(OFFICIAL_APIS[0].sampleBody || {}, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string>('req_initial_01');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const payloadSizeBytes = new Blob([requestBodyText]).size;
  const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);
  const isPayloadValid = payloadSizeBytes <= 30 * 1024; // 30KB limit (Capítulo 5)

  const handleSelectApi = (api: ApiEndpoint) => {
    setSelectedApi(api);
    setRequestBodyText(JSON.stringify(api.sampleBody || {}, null, 2));
    setResponseOutput(null);
    setResponseStatus(null);
  };

  const handleSendLiveRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();
    let bodyJson: any = undefined;

    if (selectedApi.method === 'POST') {
      try {
        bodyJson = JSON.parse(requestBodyText);
      } catch (e) {
        setResponseOutput({ error: 'Invalid JSON in request body' });
        setResponseStatus(400);
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await apiClient.request(selectedApi.path, {
        method: selectedApi.method,
        body: bodyJson,
      });

      const elapsed = Number((performance.now() - startTime).toFixed(1));
      setResponseLatency(res.latencyMs || elapsed);
      setResponseStatus(res.statusCode);
      setLastRequestId(res.requestId);
      setResponseOutput(res.data || { error: res.error, message: res.message });
    } catch (err: any) {
      setResponseStatus(500);
      setResponseOutput({ error: err.message || 'Gateway communication error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial request on mount
  useEffect(() => {
    handleSendLiveRequest();
  }, [selectedApi.id]);

  const filteredApis = filterCategory === 'ALL'
    ? OFFICIAL_APIS
    : OFFICIAL_APIS.filter(a => a.category === filterCategory);

  const copyCurl = () => {
    const curl = selectedApi.method === 'POST'
      ? `curl -X POST "https://vitronis.co.ao/api/v1${selectedApi.path}" -H "Content-Type: application/json" -d '${requestBodyText}'`
      : `curl -X GET "https://vitronis.co.ao/api/v1${selectedApi.path}" -H "Accept: application/json"`;

    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Central de APIs de Negócio (Render Central Gateway)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    MANDATÓRIO
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Todas as operações de negócio passam obrigatoriamente pelo backend central Render, garantindo consistência ACID, governança e controle.
                </p>
              </div>
            </div>
          </div>

          {/* SLA & Security Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Rota Única: /api/v1/*</span>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isPayloadValid
                  ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                  : 'bg-red-950/60 border-red-600 text-red-400'
              }`}
            >
              {isPayloadValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>Payload: {payloadSizeKB} KB / 30 KB</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-neutral-800 text-xs font-mono">
          <span className="text-neutral-500 mr-2 font-bold uppercase text-[10px]">Domínio:</span>
          {['ALL', 'Trips', 'Drivers', 'Payments', 'Finance', 'Master', 'Gateway'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterCategory === cat
                  ? 'bg-[#005A2B] text-white font-bold border border-emerald-500'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* API Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoints List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold">
              Endpoints Centralizados ({filteredApis.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live HTTP
            </span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredApis.map((api) => {
              const isSelected = selectedApi.id === api.id;
              return (
                <button
                  key={api.id}
                  onClick={() => handleSelectApi(api)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                          api.method === 'POST' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {api.method}
                      </span>
                      <span className="font-mono text-xs font-bold truncate">/api/v1{api.path}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-neutral-300">
                      {api.category}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1.5 line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-neutral-400'}`}>
                    {api.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Request & Response Workbench */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
          {/* Endpoint Live Execution Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
            <span
              className={`text-xs font-mono font-black px-2.5 py-1 rounded ${
                selectedApi.method === 'POST' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
              }`}
            >
              {selectedApi.method}
            </span>
            <span className="font-mono text-xs text-neutral-500">https://vitronis.co.ao</span>
            <span className="font-mono text-xs text-[#FFC107] font-bold">
              /api/v1{selectedApi.path}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={copyCurl}
                title="Copiar comando cURL"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-800 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>cURL</span>
              </button>

              <button
                onClick={handleSendLiveRequest}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#005A2B] hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
              >
                {isLoading ? (
                  <Activity className="w-3.5 h-3.5 animate-spin text-[#FFC107]" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-[#FFC107]" />
                )}
                <span>{isLoading ? 'Executando...' : 'Executar Chamada'}</span>
              </button>
            </div>
          </div>

          {/* Injected Tracing Headers */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 text-[11px] font-mono grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <span className="text-neutral-500">X-Request-Id:</span>{' '}
              <span className="text-neutral-300 truncate">{lastRequestId}</span>
            </div>
            <div>
              <span className="text-neutral-500">Gateway:</span>{' '}
              <span className="text-emerald-400">Render (Frankfurt / Luanda)</span>
            </div>
            <div>
              <span className="text-neutral-500">Protocol:</span>{' '}
              <span className="text-sky-400">HTTPS / TLS 1.3 Strict</span>
            </div>
          </div>

          {/* Request Payload Editor (if POST) */}
          {selectedApi.method === 'POST' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="font-bold text-neutral-200">Request Body (JSON Schema Pydantic V2 / TypeScript):</span>
                <span className="font-mono text-[11px]">Tamanho: {payloadSizeBytes} bytes</span>
              </div>
              <textarea
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                rows={6}
                className="w-full bg-black/90 border border-neutral-800 rounded-2xl p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-[#005A2B]"
              />
            </div>
          )}

          {/* Response Inspector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-bold text-neutral-200">Resposta do Servidor Render:</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>
                  Status:{' '}
                  <strong className={responseStatus === 200 || responseStatus === 201 ? 'text-emerald-400' : 'text-amber-400'}>
                    {responseStatus ? `HTTP ${responseStatus}` : '---'}
                  </strong>
                </span>
                <span>
                  Latência:{' '}
                  <strong className="text-[#FFC107]">{responseLatency !== null ? `${responseLatency} ms` : '---'}</strong>
                </span>
              </div>
            </div>

            <div className="bg-black/90 border border-neutral-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[320px]">
              {isLoading ? (
                <div className="py-6 text-center text-neutral-500 flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 animate-spin text-[#FFC107]" />
                  <span>Transmitindo requisição para o Gateway Render...</span>
                </div>
              ) : responseOutput ? (
                <pre>{JSON.stringify(responseOutput, null, 2)}</pre>
              ) : (
                <div className="py-6 text-center text-neutral-500">
                  Clique em "Executar Chamada" para disparar a requisição HTTP.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
