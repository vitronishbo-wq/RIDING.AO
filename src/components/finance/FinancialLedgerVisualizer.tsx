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
  const [activeTab, setActiveTab] = useState<'transactions' | 'webhooks' | 'ledger' | 'reconciliation' | 'policy'>(
    'transactions'
  );

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
                {financialTransactions.map((tx) => {
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
                  financialEvents.map((evt) => (
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
                {financialLedgerEntries.map((entry) => (
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
                  {lastReconciliationReport.items.map((item, idx) => (
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
    </div>
  );
};
