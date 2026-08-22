import React, { useState } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Send,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST';
  path: string;
  prefix: '/v1/passenger' | '/v1/driver' | '/v1/admin';
  description: string;
  sampleBody?: Record<string, any>;
  sampleResponse: Record<string, any>;
}

const OFFICIAL_APIS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/trips/request',
    prefix: '/v1/passenger',
    description: 'Solicita nova corrida com origem, destino e método de pagamento',
    sampleBody: {
      origin: { lat: -8.8584, lng: 13.2312, name: 'Aeroporto 4 de Fevereiro' },
      destination: { lat: -8.8095, lng: 13.2384, name: 'Marginal de Luanda' },
      category: 'economico',
      payment_method: 'MULTICAIXA_EXPRESS'
    },
    sampleResponse: {
      status: 'success',
      trip_id: 'trip_892102',
      estimated_price_aoa: 4200,
      matching_status: 'dispatched_to_geohash_kr7b'
    }
  },
  {
    method: 'POST',
    path: '/trips/cancel',
    prefix: '/v1/passenger',
    description: 'Cancela solicitação ou corrida ativa',
    sampleBody: {
      trip_id: 'trip_892102',
      reason: 'Mudança de planos'
    },
    sampleResponse: {
      status: 'cancelled',
      cancellation_fee_aoa: 0
    }
  },
  {
    method: 'GET',
    path: '/trips/status?trip_id=trip_892102',
    prefix: '/v1/passenger',
    description: 'Consulta status de corrida ativa e localização do motorista',
    sampleResponse: {
      trip_id: 'trip_892102',
      status: 'in_progress',
      driver_location: { lat: -8.835, lng: 13.235, speed_kmh: 38 },
      eta_minutes: 7
    }
  },
  {
    method: 'POST',
    path: '/matching/find',
    prefix: '/v1/admin',
    description: 'Endpoint interno invocado pelo Gateway para invocar o Matching Service',
    sampleBody: {
      geohash: 'kr7b1v',
      radius_rings: 2,
      category: 'economico'
    },
    sampleResponse: {
      latency_ms: 22.4,
      matched_driver_id: 'drv_manuel_01',
      score: 94.2
    }
  },
  {
    method: 'GET',
    path: '/finance/wallet',
    prefix: '/v1/driver',
    description: 'Consulta saldo consolidado em Kwanzas (AOA) e extrato',
    sampleResponse: {
      user_id: 'usr_d1',
      balance_aoa: 48500,
      currency: 'AOA',
      pending_payout_aoa: 0
    }
  },
  {
    method: 'POST',
    path: '/finance/pay',
    prefix: '/v1/passenger',
    description: 'Processa liquidação financeira via Gateway Local EMIS / GPO',
    sampleBody: {
      trip_id: 'trip_892102',
      amount_aoa: 4200,
      method: 'MULTICAIXA_EXPRESS'
    },
    sampleResponse: {
      status: 'confirmed',
      transaction_id: 'EMIS_AO_88291039',
      paid_at: '2026-08-20T10:45:00Z'
    }
  },
  {
    method: 'POST',
    path: '/payments/intent',
    prefix: '/v1/passenger',
    description: 'Cria intenção imutável de pagamento com autoridade central e chave de idempotência',
    sampleBody: {
      rideId: 'trip_892102',
      officialAmountAOA: 4200,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      idempotencyKey: 'idemp_pass_trip_892102'
    },
    sampleResponse: {
      paymentIntentId: 'intent_892102_a1',
      status: 'REQUIRES_TRANSACTION',
      officialAmountAOA: 4200,
      idempotencyKey: 'idemp_pass_trip_892102'
    }
  },
  {
    method: 'POST',
    path: '/webhooks/appypay',
    prefix: '/v1/admin',
    description: 'Ingestão de Webhooks AppyPay com proteção contra duplicados e fora-de-ordem',
    sampleBody: {
      eventId: 'wh_ev_20260822_99',
      merchantTransactionID: 'MTX_RIDING_trip_892102_01',
      providerTransactionId: 'APPY_GPO_99182',
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {
        amountAOA: 4200,
        status: 'SUCCESS',
        timestamp: 1771692000000
      }
    },
    sampleResponse: {
      success: true,
      processingStatus: 'PROCESSED',
      postedToLedger: true,
      ledgerEntryId: 'LEDG_892102_01'
    }
  }
];

export const ApiSandbox: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint>(OFFICIAL_APIS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(OFFICIAL_APIS[0].sampleBody || {}, null, 2)
  );
  const [lastResponse, setLastResponse] = useState<Record<string, any> | null>(OFFICIAL_APIS[0].sampleResponse);
  const [callLatency, setCallLatency] = useState<number>(31.2);
  const [copied, setCopied] = useState(false);

  const payloadSizeBytes = new Blob([requestBodyText]).size;
  const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);
  const isPayloadValid = payloadSizeBytes <= 30 * 1024; // 30KB limit (Chapter 5)

  const handleSelectApi = (api: ApiEndpoint) => {
    setSelectedApi(api);
    setRequestBodyText(JSON.stringify(api.sampleBody || {}, null, 2));
    setLastResponse(api.sampleResponse);
  };

  const handleSendRequest = () => {
    const start = performance.now();
    setTimeout(() => {
      setCallLatency(Number((performance.now() - start + 24).toFixed(1)));
      setLastResponse(selectedApi.sampleResponse);
    }, 120);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Terminal className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                APIs Oficiais e Validador de Payload (Capítulo 11)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Catálogo estrito REST v1 para Passageiro, Motorista e Admin. Limite rígido de payload JSON: <strong>≤ 30 KB</strong>.
            </p>
          </div>

          {/* Payload Size Compliance Meter */}
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-mono font-bold ${
              isPayloadValid
                ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                : 'bg-red-950/60 border-red-600 text-red-400'
            }`}
          >
            {isPayloadValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>Tamanho Payload: {payloadSizeKB} KB / 30 KB</span>
          </div>
        </div>
      </div>

      {/* API Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoints List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold px-1">
            Endpoints Homologados
          </span>

          {OFFICIAL_APIS.map((api, idx) => {
            const isSelected = selectedApi.path === api.path && selectedApi.method === api.method;
            return (
              <button
                key={idx}
                onClick={() => handleSelectApi(api)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${
                      api.method === 'POST' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {api.method}
                  </span>
                  <span className="font-mono text-xs font-bold truncate">{api.path}</span>
                </div>
                <p className={`text-[11px] mt-1.5 line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                  {api.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Request & Response Workbench */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
          {/* Endpoint Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
            <span
              className={`text-xs font-mono font-black px-2.5 py-1 rounded ${
                selectedApi.method === 'POST' ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
              }`}
            >
              {selectedApi.method}
            </span>
            <span className="font-mono text-xs text-neutral-400">https://api.gobroaao.com</span>
            <span className="font-mono text-xs text-[#FFC107] font-bold">
              {selectedApi.prefix}
              {selectedApi.path}
            </span>

            <button
              onClick={handleSendRequest}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#005A2B] hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5 text-[#FFC107]" />
              <span>Executar Chamada</span>
            </button>
          </div>

          {/* Request Payload Editor (if POST) */}
          {selectedApi.method === 'POST' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="font-bold">Request Body (JSON Schema Pydantic V2):</span>
                <span className="font-mono text-[11px]">Tamanho: {payloadSizeBytes} bytes</span>
              </div>
              <textarea
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                rows={5}
                className="w-full bg-black/90 border border-neutral-800 rounded-2xl p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-[#005A2B]"
              />
            </div>
          )}

          {/* Response Inspector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-bold">Resposta HTTP 200 OK:</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>Status: <strong className="text-emerald-400">200 OK</strong></span>
                <span>Latência: <strong className="text-[#FFC107]">{callLatency} ms</strong></span>
              </div>
            </div>

            <div className="bg-black/90 border border-neutral-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
              <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
