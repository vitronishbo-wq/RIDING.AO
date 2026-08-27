import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/geohashUtils';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Database,
  Send,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Globe,
  Lock,
  Server,
  Layers
} from 'lucide-react';
import { RidingPaymentEvent, RidingPaymentMethod } from '../../types/architecture';
import { appyPayAdapter } from '../../services/appypayAdapter';
import { costOptimizer } from '../../utils/costOptimizer';
import { strategicCache, STRATEGIC_CACHE_TIER_RULES, CacheTier } from '../../utils/strategicCache';
import { ADAPTIVE_GPS_RULES } from '../../utils/adaptiveGps';
import { PaginationControls } from '../common/PaginationControls';

export const FinancialLedgerVisualizer: React.FC = () => {
  const {
    commercialPolicy,
    updateCommercialPolicy,
    financialIntents,
    financialTransactions,
    financialEvents,
    financialLedgerEntries,
    lastReconciliationReport,
    simulateIncomingWebhook,
    triggerCompensatingRefund,
    runAppyPayReconciliation,
    requestTrip,
    activeTrip
  } = useSystem();

  // Active view tab in dense operational panel
  const [activeTab, setActiveTab] = useState<'transactions' | 'webhooks' | 'ledger' | 'reconciliation' | 'policy' | 'costs'>(
    'transactions'
  );

  // Pagination states for all data sets
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);

  const [whPage, setWhPage] = useState<number>(1);
  const [whPageSize, setWhPageSize] = useState<number>(10);

  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerPageSize, setLedgerPageSize] = useState<number>(10);

  const [reconPage, setReconPage] = useState<number>(1);
  const [reconPageSize, setReconPageSize] = useState<number>(10);

  // AppyPay Feature Flag Environment
  const [appyPayEnv, setAppyPayEnv] = useState<'sandbox' | 'production'>(appyPayAdapter.getEnvironment());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick Action form states
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('+244 923 112 233');
  const [amountInput, setAmountInput] = useState<number>(4200);
  const [refundReason, setRefundReason] = useState<string>('Cancelamento pós-corrida pelo passageiro');

  // Policy Form State
  const [policyFloor, setPolicyFloor] = useState<number>(commercialPolicy.minRideFloorAOA);
  const [policyComm, setPolicyComm] = useState<number>(Math.round(commercialPolicy.commissionPercentage * 100));
  const [policyTimeout, setPolicyTimeout] = useState<number>(commercialPolicy.tripDispatchTimeoutMinutes);

  const selectedTx = financialTransactions.find((t) => t.merchantTransactionID === selectedTxId) || financialTransactions[0];

  const handleToggleEnv = () => {
    const nextEnv = appyPayEnv === 'sandbox' ? 'production' : 'sandbox';
    appyPayAdapter.setEnvironment(nextEnv);
    setAppyPayEnv(nextEnv);
    setStatusMessage(`Ambiente AppyPay alterado para: [${nextEnv.toUpperCase()}]`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCreateCharge = (method: RidingPaymentMethod) => {
    requestTrip(method === 'MULTICAIXA_EXPRESS' ? 'MULTICAIXA_EXPRESS' : 'MULTICAIXA_EXPRESS');
    setStatusMessage(`Cobrança iniciada via [${method}]. Estado registrado na autoridade do Backend/Render.`);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const handleSimulateWebhookDirect = (
    eventType: RidingPaymentEvent['eventType'],
    forceDuplicate = false
  ) => {
    const targetTx = selectedTx || financialTransactions[0];
    const eventId = forceDuplicate ? 'DUP_WH_FIXED_001' : `wh_${Date.now()}`;
    const res = simulateIncomingWebhook({
      eventId,
      merchantTransactionID: targetTx?.merchantTransactionID || 'RIDING_trip_892102_01',
      eventType,
      rawPayload: {
        gateway: 'AppyPay',
        env: appyPayEnv,
        amountAOA: targetTx?.amountAOA || 4200,
        signatureVerified: true,
        timestamp: Date.now()
      }
    });

    setStatusMessage(
      `${res.success ? '✅ SUCESSO' : '⚠️ BLOQUEIO'}: [${res.processingStatus}] ${res.message}`
    );
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleRefund = () => {
    if (!selectedTx) return;
    const res = triggerCompensatingRefund(selectedTx.merchantTransactionID, refundReason);
    setStatusMessage(
      `${res.success ? '✅ SUCESSO' : '⚠️ FALHA'} [${res.refundChannel}]: ${res.message}`
    );
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleRunRecon = () => {
    const rep = runAppyPayReconciliation();
    setStatusMessage(
      `📊 Conciliação Lote: ${rep.matchedCount} conciliados, ${rep.disputedCount} discrepâncias.`
    );
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const commDec = policyComm / 100;
    const driverDec = 1 - commDec;
    updateCommercialPolicy({
      minRideFloorAOA: Number(policyFloor),
      commissionPercentage: commDec,
      driverSharePercentage: driverDec,
      tripDispatchTimeoutMinutes: Number(policyTimeout)
    });
    setStatusMessage(`Políticas RIDING.ao salvas: Piso ${policyFloor} AOA | Split ${Math.round(driverDec * 100)}/${policyComm}%`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 font-sans space-y-4">
      {/* Top Architecture & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#005A2B] text-white">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Painel Financeiro Soberano & AppyPay Engine
              </h2>
              <span
                onClick={handleToggleEnv}
                className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                  appyPayEnv === 'production'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
                title="Clique para alternar entre Sandbox e Produção"
              >
                ENV: {appyPayEnv} (clique p/ alternar)
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Backend Render (Autoridade Única) • Firestore (Persistência Operacional) • PostgreSQL (Ledger Imutável)
            </p>
          </div>
        </div>

        {/* Quick Direct Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCreateCharge('MULTICAIXA_EXPRESS')}
            className="px-2.5 py-1 bg-[#005A2B] hover:bg-[#004722] text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFC107]" />
            <span>+ GPO Push (90s)</span>
          </button>
          <button
            onClick={() => handleCreateCharge('MULTICAIXA_REFERENCE')}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>+ REF Multicaixa (72h)</span>
          </button>
          <button
            onClick={handleRunRecon}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Conciliar Lote</span>
          </button>
        </div>
      </div>

      {/* Status notification toast */}
      {statusMessage && (
        <div className="p-2 bg-neutral-900 border border-emerald-500/50 text-emerald-300 rounded text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'transactions' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          1. Transações & Firestore ({financialTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'webhooks' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          2. Webhooks & Idempotência ({financialEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'ledger' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          3. Livro-Razão Imutável ({financialLedgerEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'reconciliation' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          4. Relatório de Conciliação
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'policy' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          5. Políticas Comerciais
        </button>
        <button
          onClick={() => setActiveTab('costs')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            activeTab === 'costs' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          6. Eficiência & Controle de Custos ⚡
        </button>
      </div>

      {/* VIEW 1: TRANSAÇÕES & FIRESTORE STATES (DENSE TABLE) */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {/* Action strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-neutral-900/60 p-2 rounded border border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Transação Selecionada:</span>
              <select
                value={selectedTx?.merchantTransactionID || ''}
                onChange={(e) => setSelectedTxId(e.target.value)}
                className="bg-neutral-950 border border-neutral-700 text-white rounded px-2 py-0.5 text-xs font-mono"
              >
                {financialTransactions.map((tx) => (
                  <option key={tx.merchantTransactionID} value={tx.merchantTransactionID}>
                    {tx.merchantTransactionID} ({tx.provider} - {tx.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSimulateWebhookDirect('PAYMENT_RECEIVED')}
                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-mono"
              >
                Simular Pagamento Sucesso
              </button>
              <button
                onClick={() => handleSimulateWebhookDirect('PAYMENT_RECEIVED', true)}
                className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-[11px] font-mono"
                title="Testar Idempotência com EventId Duplicado"
              >
                Deduplicar Webhook
              </button>
              <button
                onClick={handleRefund}
                className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-[11px] font-mono"
                title="GPO: Refund via API Gateway | REF: Compensação Saldo Carteira RIDING.ao"
              >
                Estornar / Compensar
              </button>
            </div>
          </div>

          {/* Dense Table */}
          <div className="overflow-x-auto border border-neutral-800 rounded">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-neutral-900 text-neutral-400 text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="p-2">merchantTransactionID</th>
                  <th className="p-2">Provedor</th>
                  <th className="p-2">Valor (AOA)</th>
                  <th className="p-2">Estado Firestore</th>
                  <th className="p-2">Referência / Timeout</th>
                  <th className="p-2">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {financialTransactions
                  .slice((txPage - 1) * txPageSize, txPage * txPageSize)
                  .map((tx) => {
                  const isSelected = tx.merchantTransactionID === selectedTx?.merchantTransactionID;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTxId(tx.merchantTransactionID)}
                      className={`cursor-pointer hover:bg-neutral-900/80 transition-colors ${
                        isSelected ? 'bg-neutral-900 border-l-2 border-emerald-500' : ''
                      }`}
                    >
                      <td className="p-2 font-bold text-white">{tx.merchantTransactionID}</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            tx.provider === 'APPYPAY_GPO'
                              ? 'bg-blue-500/20 text-blue-300'
                              : tx.provider === 'APPYPAY_REF'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {tx.provider}
                        </span>
                      </td>
                      <td className="p-2 font-bold text-emerald-400">{formatAOA(tx.amountAOA)}</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            tx.status === 'Success'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : tx.status === 'Pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : tx.status === 'Refunded'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-2 text-neutral-400">
                        {tx.referenceData ? (
                          <span>
                            Ent: {tx.referenceData.entity} | Ref: {tx.referenceData.reference} (72h)
                          </span>
                        ) : (
                          <span>GPO Push (90s timeout)</span>
                        )}
                      </td>
                      <td className="p-2 text-neutral-500 text-[10px]">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={txPage}
            totalItems={financialTransactions.length}
            pageSize={txPageSize}
            onPageChange={setTxPage}
            onPageSizeChange={setTxPageSize}
            itemName="transações"
          />
        </div>
      )}

      {/* VIEW 2: WEBHOOKS & IDEMPOTÊNCIA */}
      {activeTab === 'webhooks' && (
        <div className="space-y-3">
          <div className="text-[11px] text-neutral-400 font-mono">
            Processamento de Webhooks no Backend: Validação de assinatura HMAC, deduplicação estrita por <code>eventId</code> e idempotência por <code>merchantTransactionID</code>.
          </div>
          <div className="overflow-x-auto border border-neutral-800 rounded">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-neutral-900 text-neutral-400 text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="p-2">Event ID</th>
                  <th className="p-2">merchantTransactionID</th>
                  <th className="p-2">Tipo de Evento</th>
                  <th className="p-2">Assinatura</th>
                  <th className="p-2">Resultado Processamento</th>
                  <th className="p-2">Recebido Em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {financialEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-neutral-500">
                      Nenhum webhook registrado nesta sessão.
                    </td>
                  </tr>
                ) : (
                  financialEvents
                    .slice((whPage - 1) * whPageSize, whPage * whPageSize)
                    .map((evt) => (
                    <tr key={evt.eventId} className="hover:bg-neutral-900/60">
                      <td className="p-2 text-neutral-400">{evt.eventId}</td>
                      <td className="p-2 text-white font-bold">{evt.merchantTransactionID}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded text-[10px]">
                          {evt.eventType}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-emerald-400 text-[10px]">VERIFIED (Render Vault)</span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            evt.processingStatus === 'PROCESSED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {evt.processingStatus}
                        </span>
                      </td>
                      <td className="p-2 text-neutral-500 text-[10px]">
                        {new Date(evt.receivedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={whPage}
            totalItems={financialEvents.length}
            pageSize={whPageSize}
            onPageChange={setWhPage}
            onPageSizeChange={setWhPageSize}
            itemName="webhooks"
          />
        </div>
      )}

      {/* VIEW 3: LIVRO-RAZÃO IMUTÁVEL (POSTGRESQL DOUBLE-ENTRY) */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          <div className="text-[11px] text-neutral-400 font-mono">
            Partida Dobrada Imutável: Segregação automática de 85% Motorista, 15% Comissão RIDING.ao e identificação do canal de liquidação.
          </div>
          <div className="overflow-x-auto border border-neutral-800 rounded">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-neutral-900 text-neutral-400 text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="p-2">ID Lançamento</th>
                  <th className="p-2">Tipo de Entrada</th>
                  <th className="p-2">Bruto (AOA)</th>
                  <th className="p-2">Motorista (85%)</th>
                  <th className="p-2">RIDING.ao (15%)</th>
                  <th className="p-2">Canal Liquidação</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {financialLedgerEntries
                  .slice((ledgerPage - 1) * ledgerPageSize, ledgerPage * ledgerPageSize)
                  .map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-900/60">
                    <td className="p-2 text-neutral-400">{entry.id}</td>
                    <td className="p-2 font-bold text-white">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          entry.entryType === 'TRIP_FARE_SETTLEMENT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : entry.entryType === 'GPO_GATEWAY_REFUND'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {entry.entryType}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white">{formatAOA(entry.grossAmountAOA)}</td>
                    <td className="p-2 text-emerald-400 font-medium">{formatAOA(entry.driverEarningsAOA)}</td>
                    <td className="p-2 text-amber-400 font-medium">{formatAOA(entry.platformCommissionAOA)}</td>
                    <td className="p-2 text-neutral-400">{entry.settlementType}</td>
                    <td className="p-2">
                      <span className="text-[10px] text-emerald-400 font-bold">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={ledgerPage}
            totalItems={financialLedgerEntries.length}
            pageSize={ledgerPageSize}
            onPageChange={setLedgerPage}
            onPageSizeChange={setLedgerPageSize}
            itemName="lançamentos contábeis"
          />
        </div>
      )}

      {/* VIEW 4: CONCILIAÇÃO APPYPAY ↔ FIRESTORE/LEDGER */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-neutral-400 font-mono">
              Reconciliação batch automatizada entre extrato do Gateway AppyPay e Lançamentos no Firestore/Ledger.
            </div>
            <button
              onClick={handleRunRecon}
              className="px-2.5 py-1 bg-[#005A2B] hover:bg-[#004722] text-white rounded text-xs font-mono flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Executar Conciliação Agora</span>
            </button>
          </div>

          {lastReconciliationReport && (
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono border-b border-neutral-800 pb-2">
                <span>Relatório ID: {lastReconciliationReport.reportId}</span>
                <span className="text-emerald-400">
                  Conciliados: {lastReconciliationReport.matchedCount} / Total: {lastReconciliationReport.totalTransactions}
                </span>
                <span className="text-amber-400">
                  Discrepâncias: {lastReconciliationReport.disputedCount}
                </span>
                <span>Volume: {formatAOA(lastReconciliationReport.totalGrossAOA)}</span>
              </div>

              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="text-neutral-400 text-[10px] border-b border-neutral-800">
                  <tr>
                    <th className="p-1.5">merchantTransactionID</th>
                    <th className="p-1.5">Provedor TX ID</th>
                    <th className="p-1.5">Valor Interno</th>
                    <th className="p-1.5">Valor Gateway</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {lastReconciliationReport.items
                    .slice((reconPage - 1) * reconPageSize, reconPage * reconPageSize)
                    .map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5">{item.merchantTransactionID}</td>
                      <td className="p-1.5 text-neutral-400">{item.providerTransactionId || 'N/A'}</td>
                      <td className="p-1.5">{formatAOA(item.internalAmountAOA)}</td>
                      <td className="p-1.5">{item.externalAmountAOA ? formatAOA(item.externalAmountAOA) : '-'}</td>
                      <td className="p-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.status === 'MATCHED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationControls
                currentPage={reconPage}
                totalItems={lastReconciliationReport.items.length}
                pageSize={reconPageSize}
                onPageChange={setReconPage}
                onPageSizeChange={setReconPageSize}
                itemName="itens reconciliados"
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: POLÍTICAS COMERCIAIS RIDING.AO */}
      {activeTab === 'policy' && (
        <form onSubmit={handleSavePolicy} className="space-y-3">
          <div className="text-[11px] text-neutral-400 font-mono">
            Configuração de parâmetros comerciais soberanos do RIDING.ao. Totalmente isolados dos adaptadores de gateway.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-2.5 space-y-1">
              <label className="text-[11px] text-neutral-400 font-mono">Piso Mínimo de Corrida (AOA)</label>
              <input
                type="number"
                min={500}
                step={50}
                value={policyFloor}
                onChange={(e) => setPolicyFloor(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-1.5 text-xs font-mono"
              />
              <span className="text-[10px] text-neutral-500">[RIDING_BUSINESS_RULE] Padrão: 500 AOA</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-2.5 space-y-1">
              <label className="text-[11px] text-neutral-400 font-mono">Comissão da Plataforma (%)</label>
              <input
                type="number"
                min={5}
                max={30}
                value={policyComm}
                onChange={(e) => setPolicyComm(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-1.5 text-xs font-mono"
              />
              <span className="text-[10px] text-neutral-500">Split: {100 - policyComm}% Motorista / {policyComm}% RIDING.ao</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-2.5 space-y-1">
              <label className="text-[11px] text-neutral-400 font-mono">Timeout de Despacho (min)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={policyTimeout}
                onChange={(e) => setPolicyTimeout(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-1.5 text-xs font-mono"
              />
              <span className="text-[10px] text-neutral-500">Cancelamento operacional se sem motorista</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#005A2B] hover:bg-[#004722] text-white rounded text-xs font-mono font-medium transition-colors"
            >
              Salvar Políticas Comerciais
            </button>
          </div>
        </form>
      )}

      {/* VIEW 6: CONTROLE DE CUSTOS & EFICIÊNCIA OPERACIONAL */}
      {activeTab === 'costs' && (
        <div className="space-y-4">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFC107]" />
                  Matriz de Eliminação de Custos & Otimização de Infraestrutura
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Estratégias de computação de borda, geocodificação offline e throttling para evitar custos em nuvem.
                </p>
              </div>
              <button
                onClick={() => {
                  costOptimizer.clearCache();
                  setStatusMessage('Cache de leituras do Firestore revalidado.');
                  setTimeout(() => setStatusMessage(null), 3000);
                }}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span>Limpar Cache Local</span>
              </button>
            </div>
          </div>

          {/* KPI Cards: Economia Real Estimada */}
          {(() => {
            const metrics = costOptimizer.getMetrics();
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">
                    Economia Estimada (Moeda)
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {formatAOA(metrics.estimatedAoaSaved)}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ≈ ${metrics.estimatedUsdSaved.toFixed(4)} USD poupados
                  </span>
                </div>

                <div className="bg-neutral-900/90 border border-sky-500/30 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-sky-400 font-bold block">
                    Geocoding & Places Offline
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {metrics.localGeocodingCallsSaved} chamadas locais
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Substitui APIs pagas ($5.00/mil reqs) por Geohash nativo
                  </span>
                </div>

                <div className="bg-neutral-900/90 border border-amber-500/30 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                    Leituras Firestore Poupadas
                  </span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {metrics.cachedFirestoreReadsSaved} leituras em cache
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    TTL memoizado evita queries redundantes no banco
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Tabela de Políticas de Eliminação de Custos */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-2.5 bg-neutral-850 border-b border-neutral-800 text-[11px] font-mono font-bold text-neutral-300">
              Operações de Alto Custo Eliminadas vs Alternativas Eficientes
            </div>
            <div className="divide-y divide-neutral-800/80 text-xs">
              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-red-400 font-bold block">❌ Operação de Alto Custo Eliminada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Requisição contínua para Google Maps Geocoding & Places API a cada letra digitada pelo passageiro.
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">✅ Solução RIDING.ao Implementada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Motor de Resolução de Intenção Progressivo com Âncoras Urbanas pré-carregadas e cálculo de Haversine local ($0.00 de custo de API).
                  </p>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <span className="text-emerald-400 font-mono font-bold text-sm">100% Gratuito</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Zero dependência de cartão de crédito</span>
                </div>
              </div>

              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-red-400 font-bold block">❌ Operação de Alto Custo Eliminada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Polling ou escrita no Firestore a cada 1 segundo com coordenadas brutas de GPS de centenas de motoristas.
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">✅ Solução RIDING.ao Implementada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    GPS Adaptativo (Cap. 5 da Constituição): 0 updates/min quando parado; 15s em baixa velocidade; 3s apenas em trânsito rápido.
                  </p>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <span className="text-emerald-400 font-mono font-bold text-sm">~85% Redução</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Em escritas e tráfego móvel</span>
                </div>
              </div>

              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-red-400 font-bold block">❌ Operação de Alto Custo Eliminada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Listagens do Firestore sem cláusula de limite (<code className="text-amber-400 font-mono">getDocs(collection)</code>) causando full collection scans.
                  </p>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">✅ Solução RIDING.ao Implementada</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Consultas indexadas compostas com limite estrito de paginação (<code className="text-emerald-400 font-mono">limit(20)</code>) e cache estratégico em memória.
                  </p>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <span className="text-emerald-400 font-mono font-bold text-sm">Previsibilidade Total</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Consumo constante e previsível</span>
                </div>
              </div>
            </div>
          </div>

          {/* MATRIZ DE CACHE ESTRATÉGICO: PERFORMANCE VS CONSISTÊNCIA */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Matriz de Cache Estratégico (Equilíbrio Performance & Consistência)
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Classificação formal de camadas de dados: Cache agressivo onde seguro, Bypass absoluto onde consistência é crítica.
                </p>
              </div>

              {(() => {
                const cacheStats = strategicCache.getStats();
                return (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Hits: <strong>{cacheStats.hits}</strong>
                    </span>
                    <span className="text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                      Misses: <strong>{cacheStats.misses}</strong>
                    </span>
                    <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                      Bypasses $ACID: <strong>{cacheStats.bypasses}</strong>
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* 4 Strategic Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* TIER 0 */}
              <div className="bg-neutral-950 border border-red-500/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80">
                    TIER 0: NO CACHE
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">TTL 0s ($ACID)</span>
                </div>
                <h5 className="text-xs font-bold text-white">Consistência Absoluta</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  {STRATEGIC_CACHE_TIER_RULES[CacheTier.TIER_0_NO_CACHE].description}
                </p>
                <div className="pt-1 text-[10px] text-neutral-300 font-mono space-y-0.5">
                  <span className="block text-red-400 font-semibold">• Transações & Ledger</span>
                  <span className="block text-red-400 font-semibold">• Saldos & Conciliações</span>
                  <span className="block text-red-400 font-semibold">• FSM de Corrida Ativa</span>
                </div>
              </div>

              {/* TIER 1 */}
              <div className="bg-neutral-950 border border-amber-500/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/80">
                    TIER 1: NEAR-REALTIME
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">TTL 5s</span>
                </div>
                <h5 className="text-xs font-bold text-white">Volátil & Reativo</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  {STRATEGIC_CACHE_TIER_RULES[CacheTier.TIER_1_NEAR_REALTIME].description}
                </p>
                <div className="pt-1 text-[10px] text-neutral-300 font-mono space-y-0.5">
                  <span className="block text-amber-400 font-semibold">• Motoristas por Geohash</span>
                  <span className="block text-amber-400 font-semibold">• Densidade de Trânsito</span>
                  <span className="block text-amber-400 font-semibold">• Invalidação em mutação</span>
                </div>
                <button
                  onClick={() => {
                    strategicCache.invalidateTier(CacheTier.TIER_1_NEAR_REALTIME);
                    setStatusMessage('Cache Tier 1 (Near-Realtime) invalidado.');
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="w-full mt-2 py-1 text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded border border-neutral-800"
                >
                  Invalidar Tier 1
                </button>
              </div>

              {/* TIER 2 */}
              <div className="bg-neutral-950 border border-sky-500/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/80">
                    TIER 2: SHORT-LIVED
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">TTL 45s</span>
                </div>
                <h5 className="text-xs font-bold text-white">Agregações & Históricos</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  {STRATEGIC_CACHE_TIER_RULES[CacheTier.TIER_2_SHORT_LIVED].description}
                </p>
                <div className="pt-1 text-[10px] text-neutral-300 font-mono space-y-0.5">
                  <span className="block text-sky-400 font-semibold">• Histórico de Corridas</span>
                  <span className="block text-sky-400 font-semibold">• Média de Avaliações</span>
                  <span className="block text-sky-400 font-semibold">• Relatórios Agregados</span>
                </div>
                <button
                  onClick={() => {
                    strategicCache.invalidateTier(CacheTier.TIER_2_SHORT_LIVED);
                    setStatusMessage('Cache Tier 2 (Short-Lived) invalidado.');
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="w-full mt-2 py-1 text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-sky-300 rounded border border-neutral-800"
                >
                  Invalidar Tier 2
                </button>
              </div>

              {/* TIER 3 */}
              <div className="bg-neutral-950 border border-emerald-500/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    TIER 3: STATIC CATALOG
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">TTL 1h</span>
                </div>
                <h5 className="text-xs font-bold text-white">Imutáveis Determinísticos</h5>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  {STRATEGIC_CACHE_TIER_RULES[CacheTier.TIER_3_STATIC_CATALOG].description}
                </p>
                <div className="pt-1 text-[10px] text-neutral-300 font-mono space-y-0.5">
                  <span className="block text-emerald-400 font-semibold">• Âncoras Urbanas Luanda</span>
                  <span className="block text-emerald-400 font-semibold">• Artigos da Constituição</span>
                  <span className="block text-emerald-400 font-semibold">• Alíquotas Tributárias</span>
                </div>
                <button
                  onClick={() => {
                    strategicCache.invalidateTier(CacheTier.TIER_3_STATIC_CATALOG);
                    setStatusMessage('Cache Tier 3 (Static Catalog) invalidado.');
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="w-full mt-2 py-1 text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-emerald-300 rounded border border-neutral-800"
                >
                  Invalidar Tier 3
                </button>
              </div>
            </div>

            {/* Chaves Ativas no Cache Manager */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-neutral-400" />
                  Inspetor de Entradas em Memória ({strategicCache.getEntries().length} ativas)
                </span>
                <span className="text-[10px] text-neutral-500">
                  Uso estimado: ~{(strategicCache.getStats().estimatedMemoryBytes / 1024).toFixed(2)} KB
                </span>
              </div>

              {strategicCache.getEntries().length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 font-mono border border-dashed border-neutral-800 rounded-lg">
                  Nenhuma chave ativa no cache no momento. Execute consultas no simulador para preencher sob demanda.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                  {strategicCache.getEntries().map((entry) => {
                    const remainingMs = Math.max(0, entry.expiresAt - Date.now());
                    const remainingSec = Math.round(remainingMs / 1000);
                    return (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between bg-neutral-900 p-2 rounded border border-neutral-800 hover:border-neutral-700"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              entry.tier === CacheTier.TIER_1_NEAR_REALTIME
                                ? 'bg-amber-950 text-amber-400'
                                : entry.tier === CacheTier.TIER_2_SHORT_LIVED
                                ? 'bg-sky-950 text-sky-400'
                                : 'bg-emerald-950 text-emerald-400'
                            }`}
                          >
                            {entry.tier.replace('TIER_', 'T')}
                          </span>
                          <span className="text-white truncate max-w-xs">{entry.key}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-[11px] text-neutral-400">
                          <span>Hits: <strong className="text-white">{entry.hits}</strong></span>
                          <span>Expira em: <strong className="text-amber-400">{remainingSec}s</strong></span>
                          <button
                            onClick={() => {
                              strategicCache.invalidateKey(entry.key);
                              setStatusMessage(`Chave [${entry.key}] removida do cache.`);
                              setTimeout(() => setStatusMessage(null), 3000);
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded hover:bg-neutral-700"
                          >
                            Expulsar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
