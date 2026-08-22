import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/pricing';
import {
  ShieldCheck,
  CreditCard,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  PlusCircle,
  Database,
  Lock,
  Layers,
  Send,
  Sparkles,
  Search,
  Activity,
  History,
  Coins,
  Copy
} from 'lucide-react';
import { RidingPaymentEvent, InternalRetryJob } from '../../types/architecture';
import { SegmentedTabs, SegmentedTabItem } from '../common/SegmentedTabs';

export const FinancialLedgerVisualizer: React.FC = () => {
  const {
    financialIntents,
    financialTransactions,
    financialEvents,
    financialLedgerEntries,
    financialRetryQueue,
    lastReconciliationReport,
    simulateIncomingWebhook,
    triggerCompensatingRefund,
    runAppyPayReconciliation,
    enqueueInternalRetryJob,
    activeTrip
  } = useSystem();

  const [activeSubTab, setActiveSubTab] = useState<'chain' | 'webhook' | 'ledger' | 'reconciliation' | 'retry'>(
    'chain'
  );
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [webhookStatusMessage, setWebhookStatusMessage] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('Cancelamento pós-corrida pelo passageiro');
  const [customEventId, setCustomEventId] = useState<string>('');
  const [customMerchantId, setCustomMerchantId] = useState<string>('');
  const [customEventType, setCustomEventType] = useState<RidingPaymentEvent['eventType']>('PAYMENT_RECEIVED');
  const subTabs: SegmentedTabItem<'chain' | 'webhook' | 'ledger' | 'reconciliation' | 'retry'>[] = [
    { id: 'chain', label: <span>1. Cadeia de 5 Passos</span>, icon: Layers, iconClassName: 'w-3.5 h-3.5' },
    {
      id: 'webhook',
      label: <span>2. Ingestão de Webhooks & Idempotência</span>,
      icon: Send,
      iconClassName: 'w-3.5 h-3.5'
    },
    {
      id: 'ledger',
      label: <span>3. Livro-Razão Imutável ({financialLedgerEntries.length})</span>,
      icon: Database,
      iconClassName: 'w-3.5 h-3.5'
    },
    {
      id: 'reconciliation',
      label: <span>4. Conciliação AppyPay ↔ RIDING</span>,
      icon: CheckCircle2,
      iconClassName: 'w-3.5 h-3.5'
    },
    {
      id: 'retry',
      label: <span>5. Retries Internos ({financialRetryQueue.length})</span>,
      icon: RefreshCw,
      iconClassName: 'w-3.5 h-3.5'
    }
  ];

  const selectedTransaction = financialTransactions.find((tx) => tx.merchantTransactionID === selectedTxId) ||
    financialTransactions[0];

  const handleSimulateWebhook = (
    eventType: RidingPaymentEvent['eventType'],
    forceDuplicate = false,
    merchantIdOverride?: string
  ) => {
    const targetMerchantId = merchantIdOverride || customMerchantId || selectedTransaction?.merchantTransactionID || 'MTX_RIDING_TRIP_DEMO_01';
    const eventId = forceDuplicate ? 'DUP_EVT_001_FIXED' : customEventId || `wh_ev_${Date.now()}`;

    const res = simulateIncomingWebhook({
      eventId,
      merchantTransactionID: targetMerchantId,
      eventType,
      rawPayload: {
        gateway: 'AppyPay_GPO_Mock_Proxy',
        signatureVerified: true, // [REGRA RIDING.AO] Assinatura verificada internamente
        timestamp: Date.now(),
        amountAOA: selectedTransaction?.amountAOA || 4200
      }
    });

    setWebhookStatusMessage(
      `${res.success ? '✅ SUCESSO' : '⚠️ BLOQUEIO'}: Status [${res.processingStatus}] - ${res.message}`
    );
    setTimeout(() => setWebhookStatusMessage(null), 6000);
  };

  const handleExecuteCompensatingRefund = () => {
    if (!selectedTransaction) return;
    const res = triggerCompensatingRefund(selectedTransaction.merchantTransactionID, refundReason);
    setWebhookStatusMessage(
      `${res.success ? '✅ ESTORNO REGISTRADO' : '⚠️ FALHA'}: ${res.message}`
    );
    setTimeout(() => setWebhookStatusMessage(null), 6000);
  };

  const handleRunRecon = () => {
    const report = runAppyPayReconciliation();
    setWebhookStatusMessage(
      `📊 Conciliação Concluída: ${report.matchedCount} conciliados, ${report.discrepanciesCount} discrepâncias.`
    );
    setTimeout(() => setWebhookStatusMessage(null), 6000);
  };

  const handleCreateRetry = () => {
    if (!selectedTransaction) return;
    enqueueInternalRetryJob(selectedTransaction.merchantTransactionID, 'POLL_GATEWAY_STATUS');
    setWebhookStatusMessage(`🔄 Job de Retry Interno enfileirado para ${selectedTransaction.merchantTransactionID}`);
    setTimeout(() => setWebhookStatusMessage(null), 4000);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-neutral-100 space-y-6">
      {/* Header with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
              <Coins className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">
              Cadeia Financeira Soberana & AppyPay Engine (Capítulo 17)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            <strong>RIDE → INTENT → TRANSACTION → EVENT → LEDGER</strong> • Ledger próprio PostgreSQL como fonte única da verdade contábil.
          </p>
        </div>

        {/* Badges de Rigor Documental */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
            CONFIRMADO: REF 72h / No-AutoRefund
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
            REGRA RIDING.AO: 85/15 Split & Idempotency
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <SegmentedTabs
        items={subTabs}
        value={activeSubTab}
        onChange={setActiveSubTab}
        containerClassName="flex flex-wrap gap-2 border-b border-neutral-800 pb-3 text-xs"
        buttonClassName="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
        activeClassName="bg-[#005A2B] text-white shadow-sm"
        inactiveClassName="text-neutral-400 hover:text-white bg-neutral-950"
      />

      {/* Notification Banner */}
      {webhookStatusMessage && (
        <div className="p-3 bg-neutral-950 border border-[#FFC107]/60 text-amber-200 rounded-2xl text-xs font-mono animate-in fade-in flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FFC107] shrink-0" />
          <span>{webhookStatusMessage}</span>
        </div>
      )}

      {/* TAB 1: CADEIA DE 5 PASSOS */}
      {activeSubTab === 'chain' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800">
            <h3 className="text-xs font-bold text-[#FFC107] uppercase tracking-wider mb-3">
              Fluxo da Cadeia Contábil de Ponta a Ponta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Step 1: Ride */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">1. RIDE</div>
                <div className="text-xs font-bold text-white truncate">
                  {activeTrip ? activeTrip.id : 'trip_892102'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Tarifa Oficial: <span className="text-[#FFC107] font-mono font-bold">{formatAOA(activeTrip?.priceAOA || 4200)}</span>
                </div>
                <div className="text-[9px] text-neutral-500">Autoridade Central do Servidor</div>
              </div>

              {/* Step 2: Payment Intent */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">2. PAYMENT_INTENT</div>
                <div className="text-xs font-bold text-white truncate">
                  {financialIntents[0]?.id || 'intent_init_01'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Idemp: <span className="font-mono text-[9px] text-neutral-300 truncate">{financialIntents[0]?.idempotencyKey || 'idemp_key'}</span>
                </div>
                <div className="text-[9px] text-neutral-500">Trava anti-duplicação</div>
              </div>

              {/* Step 3: Payment Transaction */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">3. TRANSACTION</div>
                <div className="text-xs font-bold text-white truncate">
                  {selectedTransaction?.merchantTransactionID || 'MTX_RIDING_...'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Status: <span className="text-emerald-400 font-bold">{selectedTransaction?.status || 'Pending'}</span>
                </div>
                <div className="text-[9px] text-neutral-500">Tentativa auditável única</div>
              </div>

              {/* Step 4: Payment Event */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">4. PAYMENT_EVENT</div>
                <div className="text-xs font-bold text-white truncate">
                  {financialEvents[0]?.id || 'ev_wh_01'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Tipo: <span className="font-mono text-[9px] text-amber-300">{financialEvents[0]?.eventType || 'PAYMENT_RECEIVED'}</span>
                </div>
                <div className="text-[9px] text-neutral-500">Payload bruto preservado</div>
              </div>

              {/* Step 5: Riding Ledger */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[10px] font-mono text-emerald-400 font-bold">5. RIDING_LEDGER</div>
                <div className="text-xs font-bold text-white truncate">
                  {financialLedgerEntries[0]?.id || 'ledg_tx_01'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Motorista: <span className="text-emerald-400 font-mono font-bold">85%</span> | RIDING: <span className="text-amber-400 font-mono font-bold">15%</span>
                </div>
                <div className="text-[9px] text-neutral-500">Partida Dobrada Imutável</div>
              </div>
            </div>
          </div>

          {/* Transaction Explicit Storage Inspector */}
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Transações Ativas Registradas</h4>
              <span className="text-[10px] text-neutral-400 font-mono">
                Total: {financialTransactions.length} transações
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[10px]">
                    <th className="py-2 px-2">MerchantTxID</th>
                    <th className="py-2 px-2">ProviderTxID</th>
                    <th className="py-2 px-2">Método</th>
                    <th className="py-2 px-2">Montante</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Ledger Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-200">
                  {financialTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTxId(tx.merchantTransactionID)}
                      className={`hover:bg-neutral-800/60 cursor-pointer transition-colors ${
                        selectedTransaction?.id === tx.id ? 'bg-[#005A2B]/20 border-l-2 border-[#FFC107]' : ''
                      }`}
                    >
                      <td className="py-2 px-2 font-bold text-white truncate max-w-[130px]">{tx.merchantTransactionID}</td>
                      <td className="py-2 px-2 text-neutral-400 truncate max-w-[110px]">{tx.providerTransactionId || '—'}</td>
                      <td className="py-2 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[9px]">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold text-[#FFC107]">{formatAOA(tx.amountAOA)}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            tx.status === 'Success'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tx.status === 'Failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-neutral-400">
                        {financialLedgerEntries.some((l) => l.merchantTransactionID === tx.merchantTransactionID) ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> POSTADO
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[10px]">Pendente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOK SIMULATOR & IDEMPOTENCY */}
      {activeSubTab === 'webhook' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold text-[#FFC107] uppercase tracking-wider">
              Simulador de Webhooks AppyPay (Idempotência & Anti-Out-Of-Order)
            </h3>
            <p className="text-xs text-neutral-400">
              Teste o tratamento de webhooks normais, duplicados e reversões sem corromper o livro-razão.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              <button
                onClick={() => handleSimulateWebhook('PAYMENT_RECEIVED', false)}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/30 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                  <span>Webhook Válido</span>
                  <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] text-neutral-400">Envia PAYMENT_RECEIVED e liquida no ledger</div>
              </button>

              <button
                onClick={() => handleSimulateWebhook('PAYMENT_RECEIVED', true)}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                  <span>Webhook Duplicado</span>
                  <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] text-neutral-400">Testa idempotência: rejeita segundo crédito</div>
              </button>

              <button
                onClick={() => handleSimulateWebhook('PAYMENT_FAILED', false)}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-red-500/30 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between text-red-400 text-xs font-bold">
                  <span>Webhook Falha</span>
                  <AlertTriangle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] text-neutral-400">Atualiza status para Failed sem crédito</div>
              </button>

              <button
                onClick={handleExecuteCompensatingRefund}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-purple-500/30 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
                  <span>Estorno Compensatório</span>
                  <RotateCcw className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] text-neutral-400">Gera nova linha no ledger invertendo valores</div>
              </button>
            </div>
          </div>

          {/* Raw Webhook Event Ingestion Log */}
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-2">
            <h4 className="text-xs font-bold text-white">Eventos Brutos Ingeridos ({financialEvents.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {financialEvents.map((ev) => (
                <div key={ev.id} className="bg-neutral-900 rounded-xl p-2.5 border border-neutral-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">{ev.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        ev.processingStatus === 'PROCESSED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ev.processingStatus === 'DUPLICATE_IGNORED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {ev.processingStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 flex justify-between">
                    <span>MerchantTx: <span className="text-neutral-200">{ev.merchantTransactionID}</span></span>
                    <span>Tipo: <span className="text-[#FFC107]">{ev.eventType}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVRO-RAZÃO IMUTÁVEL (POSTGRES DOUBLE ENTRY) */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#FFC107] uppercase tracking-wider">
                Livro-Razão Contábil Imutável (PostgreSQL Double-Entry)
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                Fonte da Verdade Contábil: RIDING.ao
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Cada linha representa um lançamento contábil auditável. Estornos não alteram linhas passadas; geram novos registros de compensação.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[10px]">
                    <th className="py-2 px-2">ID Lançamento</th>
                    <th className="py-2 px-2">MerchantTx</th>
                    <th className="py-2 px-2">Tipo Entrada</th>
                    <th className="py-2 px-2">Bruto</th>
                    <th className="py-2 px-2">Motorista (85%)</th>
                    <th className="py-2 px-2">Plataforma (15%)</th>
                    <th className="py-2 px-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-200">
                  {financialLedgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-neutral-800/50">
                      <td className="py-2 px-2 font-bold text-white">{entry.id}</td>
                      <td className="py-2 px-2 text-neutral-400 truncate max-w-[120px]">{entry.merchantTransactionID}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            entry.entryType === 'FARE_CREDIT'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : entry.entryType === 'COMPENSATING_REFUND'
                              ? 'bg-purple-500/20 text-purple-400'
                              : entry.entryType === 'CASH_COMMISSION_DEBIT'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold text-white">{formatAOA(entry.grossAmountAOA)}</td>
                      <td className="py-2 px-2 text-emerald-400 font-bold">{formatAOA(entry.driverShareAOA)}</td>
                      <td className="py-2 px-2 text-amber-400 font-bold">{formatAOA(entry.platformCommissionAOA)}</td>
                      <td className="py-2 px-2 text-neutral-500 text-[10px]">
                        {new Date(entry.createdAt).toLocaleTimeString('pt-AO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONCILIAÇÃO APPYPAY ↔ RIDING */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#FFC107] uppercase tracking-wider">
                  Motor de Conciliação Automática AppyPay ↔ RIDING.ao
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cruza o extrato de liquidação do Gateway externo contra as entradas no Livro-Razão interno.
                </p>
              </div>
              <button
                onClick={handleRunRecon}
                className="px-3 py-2 bg-[#005A2B] hover:bg-[#007038] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Executar Conciliação</span>
              </button>
            </div>

            {lastReconciliationReport && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">ID do Relatório:</span>
                  <span className="font-bold text-white">{lastReconciliationReport.reportId}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-[10px]">Total Gateway:</span>
                    <div className="font-bold text-white">{formatAOA(lastReconciliationReport.totalAppyPayVolumeAOA)}</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-[10px]">Total Ledger RIDING:</span>
                    <div className="font-bold text-emerald-400">{formatAOA(lastReconciliationReport.totalRidingLedgerVolumeAOA)}</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-[10px]">Conciliados:</span>
                    <div className="font-bold text-white">{lastReconciliationReport.matchedCount}</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-[10px]">Discrepâncias:</span>
                    <div className="font-bold text-amber-400">{lastReconciliationReport.discrepanciesCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: RETRIES INTERNOS */}
      {activeSubTab === 'retry' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#FFC107] uppercase tracking-wider">
                  Fila de Retries Internos (Backoff Seguro RIDING.ao)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Política de retentativas gerenciada internamente pelo RIDING.ao com tolerância a falhas.
                </p>
              </div>
              <button
                onClick={handleCreateRetry}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#FFC107]" />
                <span>Enfileirar Job de Teste</span>
              </button>
            </div>

            <div className="space-y-2">
              {financialRetryQueue.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs">
                  Nenhum job de retry pendente no momento.
                </div>
              ) : (
                financialRetryQueue.map((job) => (
                  <div key={job.id} className="bg-neutral-900 rounded-xl p-3 border border-neutral-800 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{job.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                        {job.status} (Tentativa {job.attempts}/{job.maxAttempts})
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 flex justify-between">
                      <span>MerchantTxID: <span className="text-neutral-200">{job.merchantTransactionID}</span></span>
                      <span>Ação: <span className="text-[#FFC107]">{job.action}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
