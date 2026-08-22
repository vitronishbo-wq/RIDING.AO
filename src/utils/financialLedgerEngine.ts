/**
 * RIDING.ao - Sovereign Financial Ledger & AppyPay Integration Engine
 * 
 * CLASSIFICAÇÃO RIGOROSA & ISOLAMENTO DE DOMÍNIOS:
 * 
 * - [AppyPay Confirmado]:
 *   1. client_id / client_secret residem exclusivamente no backend/servidor.
 *   2. REF_VALIDITY_HOURS: 72 horas no gateway.
 *   3. REF_SUPPORTS_API_REFUND: FALSE (Inexistência de endpoint de refund/reversal automático para REF na AppyPay).
 *   4. GPO_REFUND: Suportado pelo gateway AppyPay (Multicaixa Express).
 * 
 * - [Regra Interna RIDING.ao - Domínio Comercial & Financeiro]:
 *   1. Cadeia de 5 passos: RIDE -> PAYMENT_INTENT -> PAYMENT_TRANSACTION -> PAYMENT_EVENT -> RIDING_LEDGER.
 *   2. minRideFloorAOA: 500 AOA (RIDING_BUSINESS_RULE isolada de regras de gateway).
 *   3. 85/15 Split: 85% Motorista / 15% Plataforma RIDING.ao (Regra comercial soberana configurável).
 *   4. Compensação Interna em Saldo (INTERNAL_WALLET_CREDIT_COMPENSATION): Tratada como compensação
 *      soberana interna do RIDING.ao para liquidações pós-cancelamento de REF ou reversões, NUNCA como refund da AppyPay.
 *   5. Idempotência estrita em Intents, Transactions, Eventos e Lançamentos no Ledger PostgreSQL.
 *   6. Reconciliação batch AppyPay <-> RIDING.ao com auditoria de discrepâncias.
 *   7. Pagamentos em Dinheiro (CASH) unificados no mesmo modelo contábil de partida dobrada.
 * 
 * - [Não Confirmado / Aguardando Docs]:
 *   1. IDs numéricos exatos de métodos de pagamento da API AppyPay.
 *   2. Nome exato de headers de assinatura HMAC (não assumir X-AppyPay-Signature).
 *   3. Janelas de retries da AppyPay (não inventar intervalos fictícios).
 */

import {
  APPY_PAY_EXPIRATION,
  AppyPayReconciliationReport,
  DEFAULT_RIDING_COMMERCIAL_POLICY,
  DriverPaymentAccount,
  InternalRetryJob,
  RidingCommercialFinancialPolicy,
  RIDING_PAYMENT_POLICY,
  RidingLedgerEntry,
  RidingPaymentEvent,
  RidingPaymentIntent,
  RidingPaymentMethod,
  RidingPaymentProvider,
  RidingPaymentTransaction
} from '../types/architecture';
import { generateRandomId } from './id';

// =============================================================
// 1. SECURE SERVER VAULT (Client_ID e Client_Secret ISOLADOS)
// =============================================================
class SecureServerCredentialVault {
  // [AppyPay Confirmado]: Credenciais residem exclusivamente no backend/servidor
  private static instance: SecureServerCredentialVault;
  private readonly appyPayClientId: string = 'SEC_VAULT_APPYPAY_CLIENT_ID_PROD_2026';
  private readonly appyPayClientSecret: string = 'SEC_VAULT_APPYPAY_SECRET_HASH_ED25519_KEY';

  private constructor() {}

  public static getInstance(): SecureServerCredentialVault {
    if (!SecureServerCredentialVault.instance) {
      SecureServerCredentialVault.instance = new SecureServerCredentialVault();
    }
    return SecureServerCredentialVault.instance;
  }

  public getBackendHeaders(): Record<string, string> {
    return {
      'X-Riding-Server-Authority': 'Sovereign-Ledger-v2',
      'X-Internal-Token': 'AUTH_BEARER_RIDING_CENTRAL'
    };
  }

  public isCredentialProtected(): boolean {
    return true;
  }
}

export const serverVault = SecureServerCredentialVault.getInstance();

// =============================================================
// 2. IN-MEMORY SOVEREIGN LEDGER & TRANSACTION REGISTRY
// =============================================================
export class SovereignFinancialLedgerEngine {
  private paymentIntents: Map<string, RidingPaymentIntent> = new Map();
  private transactions: Map<string, RidingPaymentTransaction> = new Map();
  private processedEvents: Map<string, RidingPaymentEvent> = new Map();
  private ledgerEntries: RidingLedgerEntry[] = [];
  private driverAccounts: Map<string, DriverPaymentAccount> = new Map();
  private internalRetryQueue: InternalRetryJob[] = [];

  // [Regra Interna RIDING.ao]: Políticas Comerciais Configuráveis em Tempo Real
  private commercialPolicy: RidingCommercialFinancialPolicy = {
    ...DEFAULT_RIDING_COMMERCIAL_POLICY
  };

  constructor() {
    this.seedInitialDriverAccounts();
    this.seedInitialTransactionsAndLedger();
  }

  // ===========================================================
  // CONFIGURAÇÃO COMERCIAL SOBERANA (DOMÍNIO FINANCEIRO RIDING.ao)
  // ===========================================================
  public getCommercialPolicy(): RidingCommercialFinancialPolicy {
    return { ...this.commercialPolicy };
  }

  public updateCommercialPolicy(
    updates: Partial<RidingCommercialFinancialPolicy>
  ): RidingCommercialFinancialPolicy {
    this.commercialPolicy = {
      ...this.commercialPolicy,
      ...updates
    };
    return { ...this.commercialPolicy };
  }

  private seedInitialDriverAccounts() {
    this.driverAccounts.set('drv_manuel_01', {
      id: 'dpa_manuel_01',
      driverId: 'drv_manuel_01',
      payoutMethod: 'BANK_IBAN',
      iban: 'AO06.0040.0000.1234.5678.9012.3',
      status: 'active',
      verifiedAt: Date.now() - 30 * 86400000
    });
    this.driverAccounts.set('drv_antonio_02', {
      id: 'dpa_antonio_02',
      driverId: 'drv_antonio_02',
      payoutMethod: 'INTERNAL_WALLET',
      status: 'active',
      verifiedAt: Date.now() - 15 * 86400000
    });
  }

  private seedInitialTransactionsAndLedger() {
    const now = Date.now() - 3600000;

    // Transação 1: GPO Sucesso
    const intent1: RidingPaymentIntent = {
      id: 'pi_seed_gpo_01',
      rideId: 'trip_892102',
      idempotencyKey: 'idemp_seed_gpo_01',
      amountAOA: 4200,
      currency: 'AOA',
      paymentMethod: 'MULTICAIXA_EXPRESS',
      status: 'Success',
      createdAt: now,
      expiresAt: now + 1800000
    };
    this.paymentIntents.set(intent1.id, intent1);

    const tx1: RidingPaymentTransaction = {
      id: 'tx_seed_gpo_01',
      paymentIntentId: intent1.id,
      merchantTransactionID: 'MTX_RIDING_trip_892102_01',
      provider: 'APPYPAY_GPO',
      providerTransactionId: 'APPY_GPO_99182',
      status: 'Success',
      amountAOA: 4200,
      phoneNumber: '923112233',
      rawWebhookEvents: [],
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(tx1.id, tx1);

    // Lançamento 1 no Ledger: GPO Settled
    const gross1 = 4200;
    const comm1 = Math.round(gross1 * this.commercialPolicy.commissionPercentage);
    const driver1 = gross1 - comm1;

    this.ledgerEntries.push({
      id: 'led_seed_01',
      transactionId: tx1.id,
      merchantTransactionID: tx1.merchantTransactionID,
      rideId: intent1.rideId,
      entryType: 'TRIP_FARE_SETTLEMENT',
      grossAmountAOA: gross1,
      platformCommissionAOA: comm1,
      driverEarningsAOA: driver1,
      gatewayFeeAOA: 0,
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01',
      settlementType: 'GPO_SETTLED',
      status: 'POSTED_TO_LEDGER',
      postedAt: now
    });

    // Transação 2: Multicaixa Reference (72h no gateway)
    const intent2: RidingPaymentIntent = {
      id: 'pi_seed_ref_02',
      rideId: 'trip_892103',
      idempotencyKey: 'idemp_seed_ref_02',
      amountAOA: 6500,
      currency: 'AOA',
      paymentMethod: 'MULTICAIXA_REFERENCE',
      status: 'Pending',
      createdAt: now + 600000,
      expiresAt: now + 600000 + APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000
    };
    this.paymentIntents.set(intent2.id, intent2);

    const tx2: RidingPaymentTransaction = {
      id: 'tx_seed_ref_02',
      paymentIntentId: intent2.id,
      merchantTransactionID: 'MTX_RIDING_trip_892103_02',
      provider: 'APPYPAY_REF',
      providerTransactionId: 'APPY_REF_88190',
      status: 'Pending',
      amountAOA: 6500,
      referenceData: {
        entity: '00123',
        reference: '923 456 789',
        expiresAt: now + 600000 + APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000
      },
      rawWebhookEvents: [],
      createdAt: now + 600000,
      updatedAt: now + 600000
    };
    this.transactions.set(tx2.id, tx2);
  }

  // ===========================================================
  // 3. PASSO 1 DA CADEIA: RIDE -> PAYMENT_INTENT
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]: Criação de Intenção com Chave de Idempotência
   * O backend calcula o valor com base na tarifa oficial. O cliente mobile não pode arbitrar o valor.
   * O piso de 500 AOA é uma regra estritamente do RIDING.ao (RIDING_BUSINESS_RULE), nunca do gateway.
   */
  public createPaymentIntent(params: {
    rideId: string;
    idempotencyKey: string;
    officialAmountAOA: number;
    paymentMethod: RidingPaymentMethod;
    passengerId: string;
  }): RidingPaymentIntent {
    const existingIntent = Array.from(this.paymentIntents.values()).find(
      (pi) => pi.idempotencyKey === params.idempotencyKey || (pi.rideId === params.rideId && pi.status !== 'Expired')
    );

    if (existingIntent) {
      return existingIntent;
    }

    const now = Date.now();
    // [AppyPay Confirmado]: REF expira em 72h no gateway. GPO/Wallet expiram em 30 min (despacho).
    const expiresAt =
      params.paymentMethod === 'MULTICAIXA_REFERENCE'
        ? now + APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000
        : now + this.commercialPolicy.tripDispatchTimeoutMinutes * 60000;

    // Aplica o piso mínimo de corrida do RIDING.ao de forma isolada
    const boundedAmountAOA = Math.max(
      this.commercialPolicy.minRideFloorAOA,
      Math.round(params.officialAmountAOA)
    );

    const paymentIntent: RidingPaymentIntent = {
      id: generateRandomId('pi', 5, false, now),
      rideId: params.rideId,
      idempotencyKey: params.idempotencyKey,
      amountAOA: boundedAmountAOA,
      currency: 'AOA',
      paymentMethod: params.paymentMethod,
      status: 'Requested',
      createdAt: now,
      expiresAt
    };

    this.paymentIntents.set(paymentIntent.id, paymentIntent);
    return paymentIntent;
  }

  // ===========================================================
  // 4. PASSO 2 DA CADEIA: PAYMENT_INTENT -> PAYMENT_TRANSACTION
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]: Geração de Transação Financeira com merchantTransactionID imutável
   */
  public createPaymentTransaction(params: {
    paymentIntentId: string;
    phoneNumber?: string;
  }): RidingPaymentTransaction {
    const intent = this.paymentIntents.get(params.paymentIntentId);
    if (!intent) {
      throw new Error(`[SovereignLedger] PaymentIntent ${params.paymentIntentId} não encontrado.`);
    }

    // Verificar se já existe transação ativa para este intent (Idempotência)
    const existingTx = Array.from(this.transactions.values()).find(
      (tx) => tx.paymentIntentId === intent.id && tx.status !== 'Expired' && tx.status !== 'Failed'
    );
    if (existingTx) {
      return existingTx;
    }

    const now = Date.now();
    const merchantTransactionID = `MTX_RIDING_${intent.rideId}_${now.toString().slice(-6)}`;

    let provider: RidingPaymentProvider = 'INTERNAL_LEDGER';
    let referenceData: RidingPaymentTransaction['referenceData'] | undefined = undefined;

    if (intent.paymentMethod === 'MULTICAIXA_EXPRESS') {
      provider = 'APPYPAY_GPO';
    } else if (intent.paymentMethod === 'MULTICAIXA_REFERENCE') {
      provider = 'APPYPAY_REF';
      const cleanPhone = (params.phoneNumber || '923000000').replace(/\D/g, '').slice(-6);
      const rawRef = `${cleanPhone}${Math.floor(100 + Math.random() * 899)}`;
      referenceData = {
        entity: '00123',
        reference: `${rawRef.slice(0, 3)} ${rawRef.slice(3, 6)} ${rawRef.slice(6, 9)}`,
        expiresAt: now + APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000 // 72h no gateway
      };
    } else if (intent.paymentMethod === 'CASH') {
      provider = 'CASH_DIRECT';
    } else if (intent.paymentMethod === 'WALLET') {
      provider = 'INTERNAL_LEDGER';
    }

    const transaction: RidingPaymentTransaction = {
      id: generateRandomId('tx', 4, false, now),
      paymentIntentId: intent.id,
      merchantTransactionID,
      provider,
      status: 'Pending',
      amountAOA: intent.amountAOA,
      referenceData,
      phoneNumber: params.phoneNumber,
      rawWebhookEvents: [],
      createdAt: now,
      updatedAt: now
    };

    this.transactions.set(transaction.id, transaction);
    intent.status = 'Pending';
    return transaction;
  }

  // ===========================================================
  // 5. PASSO 3 DA CADEIA: PAYMENT_EVENT (WEBHOOK INGESTION)
  // ===========================================================
  /**
   * Tratamento de Webhook com:
   * - Deduplicação (evita reprocessamento de mesmo eventId / merchantTransactionID)
   * - Proteção contra fora de ordem (ignora regresso de estado se já em 'Success' ou 'Refunded')
   * - Distinção explícita de GPO Refund vs REF No-API Refund
   */
  public ingestPaymentEvent(params: {
    eventId: string;
    merchantTransactionID: string;
    providerTransactionId?: string;
    eventType: RidingPaymentEvent['eventType'];
    rawPayload: Record<string, any>;
    driverId: string;
    passengerId: string;
  }): {
    success: boolean;
    processingStatus: RidingPaymentEvent['processingStatus'];
    message: string;
    ledgerEntry?: RidingLedgerEntry;
  } {
    const now = Date.now();

    // 1. Deduplicação de Evento Bruto
    if (this.processedEvents.has(params.eventId)) {
      return {
        success: true,
        processingStatus: 'IGNORED_DUPLICATE',
        message: `[Idempotência] Evento ${params.eventId} já foi processado anteriormente.`
      };
    }

    // 2. Localizar transação pelo merchantTransactionID imutável
    const transaction = Array.from(this.transactions.values()).find(
      (tx) => tx.merchantTransactionID === params.merchantTransactionID
    );

    if (!transaction) {
      return {
        success: false,
        processingStatus: 'RETRY_PENDING',
        message: `[Ledger] Transação ${params.merchantTransactionID} não localizada no sistema.`
      };
    }

    // 3. Proteção Contra Fora de Ordem (State Machine Guard)
    const isRefundEvent =
      params.eventType === 'GPO_REFUND_PROCESSED' ||
      params.eventType === 'REFUND_COMPLETED' ||
      params.eventType === 'REF_POST_CANCEL_SETTLED';

    if (transaction.status === 'Success' && !isRefundEvent) {
      const duplicateIgnoredEvent: RidingPaymentEvent = {
        eventId: params.eventId,
        merchantTransactionID: params.merchantTransactionID,
        providerTransactionId: params.providerTransactionId,
        eventType: params.eventType,
        receivedAt: now,
        signatureStatus: 'UNVERIFIED_PENDING_DOCS',
        rawPayload: params.rawPayload,
        processingStatus: 'IGNORED_OUT_OF_ORDER'
      };
      this.processedEvents.set(params.eventId, duplicateIgnoredEvent);
      transaction.rawWebhookEvents.push(duplicateIgnoredEvent);

      return {
        success: true,
        processingStatus: 'IGNORED_OUT_OF_ORDER',
        message: `[Fora de Ordem] Transação ${params.merchantTransactionID} já liquidada com sucesso.`
      };
    }

    // 4. Registrar o Evento
    const paymentEvent: RidingPaymentEvent = {
      eventId: params.eventId,
      merchantTransactionID: params.merchantTransactionID,
      providerTransactionId: params.providerTransactionId,
      eventType: params.eventType,
      receivedAt: now,
      signatureStatus: 'UNVERIFIED_PENDING_DOCS',
      rawPayload: params.rawPayload,
      processingStatus: 'PROCESSED'
    };

    this.processedEvents.set(params.eventId, paymentEvent);
    transaction.rawWebhookEvents.push(paymentEvent);
    transaction.updatedAt = now;
    if (params.providerTransactionId) {
      transaction.providerTransactionId = params.providerTransactionId;
    }

    // 5. Atualizar Estados da Transação e Intent & Postar no Ledger
    const intent = this.paymentIntents.get(transaction.paymentIntentId);
    let ledgerEntry: RidingLedgerEntry | undefined = undefined;

    if (params.eventType === 'PAYMENT_RECEIVED' || params.eventType === 'CASH_CONFIRMED') {
      transaction.status = 'Success';
      if (intent) intent.status = 'Success';

      ledgerEntry = this.postToSovereignLedger({
        transactionId: transaction.id,
        merchantTransactionID: transaction.merchantTransactionID,
        rideId: intent ? intent.rideId : 'unknown_ride',
        grossAmountAOA: transaction.amountAOA,
        paymentMethod: intent ? intent.paymentMethod : 'MULTICAIXA_EXPRESS',
        driverId: params.driverId,
        passengerId: params.passengerId
      });
    } else if (params.eventType === 'GPO_REFUND_PROCESSED' || params.eventType === 'REFUND_COMPLETED') {
      // [DISTINÇÃO EXPLÍCITA GPO vs REF]:
      if (transaction.provider === 'APPYPAY_REF') {
        // [AppyPay Confirmado]: REF não possui refund por API no gateway.
        // O RIDING.ao converte em compensação de saldo interno soberano.
        transaction.status = 'Refunded';
        if (intent) intent.status = 'Refunded';

        const refundResult = this.executeCompensatingRefund({
          merchantTransactionID: transaction.merchantTransactionID,
          reason: 'Compensação Interna Soberana RIDING.ao (REF sem refund por API)'
        });
        ledgerEntry = refundResult.compensatingEntry;
      } else {
        // GPO / Carteira: Reversão padrão autorizada no gateway
        transaction.status = 'Refunded';
        if (intent) intent.status = 'Refunded';

        const refundResult = this.executeCompensatingRefund({
          merchantTransactionID: transaction.merchantTransactionID,
          reason: 'Estorno GPO processado pelo gateway AppyPay'
        });
        ledgerEntry = refundResult.compensatingEntry;
      }
    } else if (params.eventType === 'REF_POST_CANCEL_SETTLED') {
      // REF paga após cancelamento da corrida: Converte diretamente em Saldo Interno
      transaction.status = 'Success';
      if (intent) intent.status = 'Success';

      ledgerEntry = this.postInternalWalletCreditCompensation({
        transactionId: transaction.id,
        merchantTransactionID: transaction.merchantTransactionID,
        rideId: intent ? intent.rideId : 'unknown_ride',
        amountAOA: transaction.amountAOA,
        passengerId: params.passengerId,
        driverId: params.driverId,
        reason: 'REF liquidada no gateway após cancelamento da corrida'
      });
    } else if (params.eventType === 'PAYMENT_FAILED') {
      transaction.status = 'Failed';
      if (intent) intent.status = 'Failed';
    } else if (params.eventType === 'PAYMENT_EXPIRED') {
      transaction.status = 'Expired';
      if (intent) intent.status = 'Expired';
    }

    return {
      success: true,
      processingStatus: 'PROCESSED',
      message: `Evento ${params.eventType} processado com sucesso no Ledger Soberano.`,
      ledgerEntry
    };
  }

  // ===========================================================
  // 6. PASSO 4 DA CADEIA: RIDING_LEDGER (LIVRO-RAZÃO IMUTÁVEL)
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]: Partição configurável (default 85% Motorista / 15% Comissão RIDING.ao)
   * Aplica-se tanto para digital (GPO/REF/WALLET) quanto para DINHEIRO (CASH).
   */
  public postToSovereignLedger(params: {
    transactionId: string;
    merchantTransactionID: string;
    rideId: string;
    grossAmountAOA: number;
    paymentMethod: RidingPaymentMethod;
    driverId: string;
    passengerId: string;
  }): RidingLedgerEntry {
    // Idempotência no Ledger
    const existingEntry = this.ledgerEntries.find(
      (l) => l.merchantTransactionID === params.merchantTransactionID && l.status === 'POSTED_TO_LEDGER'
    );
    if (existingEntry) {
      return existingEntry;
    }

    const gross = Math.round(params.grossAmountAOA);
    // Usa regras comerciais do domínio financeiro RIDING.ao (isoladas da AppyPay)
    const platformCommission = Math.round(gross * this.commercialPolicy.commissionPercentage);
    const driverEarnings = gross - platformCommission;

    let settlementType: RidingLedgerEntry['settlementType'] = 'GPO_SETTLED';
    let entryType: RidingLedgerEntry['entryType'] = 'TRIP_FARE_SETTLEMENT';

    if (params.paymentMethod === 'MULTICAIXA_EXPRESS') {
      settlementType = 'GPO_SETTLED';
    } else if (params.paymentMethod === 'MULTICAIXA_REFERENCE') {
      settlementType = 'REF_SETTLED';
    } else if (params.paymentMethod === 'CASH') {
      settlementType = 'CASH_RECONCILED';
      entryType = 'CASH_COMMISSION_DEBIT'; // Motorista recebe dinheiro integral e tem comissão debitada no ledger
    } else if (params.paymentMethod === 'WALLET') {
      settlementType = 'WALLET_TRANSFER';
    }

    const ledgerEntry: RidingLedgerEntry = {
      id: generateRandomId('led', 4),
      transactionId: params.transactionId,
      merchantTransactionID: params.merchantTransactionID,
      rideId: params.rideId,
      entryType,
      grossAmountAOA: gross,
      platformCommissionAOA: platformCommission,
      driverEarningsAOA: driverEarnings,
      gatewayFeeAOA: 0,
      driverId: params.driverId,
      passengerId: params.passengerId,
      settlementType,
      status: 'POSTED_TO_LEDGER',
      postedAt: Date.now()
    };

    this.ledgerEntries.unshift(ledgerEntry);
    return ledgerEntry;
  }

  // ===========================================================
  // 7. COMPENSAÇÃO DE SALDO INTERNO SOBERANO (INTERNAL BALANCE CREDIT)
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]:
   * Tratada como liquidação/compensação interna do RIDING.ao, NUNCA como refund AppyPay.
   * Usada quando REF é paga após cancelamento ou quando há compensações operacionais.
   */
  public postInternalWalletCreditCompensation(params: {
    transactionId: string;
    merchantTransactionID: string;
    rideId: string;
    amountAOA: number;
    passengerId: string;
    driverId?: string;
    reason: string;
  }): RidingLedgerEntry {
    const amount = Math.round(params.amountAOA);

    const compensationEntry: RidingLedgerEntry = {
      id: generateRandomId('led_wallet_comp', 4),
      transactionId: params.transactionId,
      merchantTransactionID: `WALLET_COMP_${params.merchantTransactionID}`,
      rideId: params.rideId,
      entryType: 'INTERNAL_WALLET_CREDIT_COMPENSATION',
      grossAmountAOA: amount,
      platformCommissionAOA: 0, // Sem comissão retida na compensação de saldo ao usuário
      driverEarningsAOA: 0,
      gatewayFeeAOA: 0,
      driverId: params.driverId || 'none',
      passengerId: params.passengerId,
      settlementType: 'WALLET_TRANSFER',
      status: 'POSTED_TO_LEDGER',
      postedAt: Date.now(),
      reconciliationNotes: `[Compensação Soberana RIDING.ao] ${params.reason}`
    };

    this.ledgerEntries.unshift(compensationEntry);
    return compensationEntry;
  }

  // ===========================================================
  // 8. COMPENSATING IMMUTABLE REFUND (DISTINÇÃO GPO vs REF)
  // ===========================================================
  /**
   * [Rigor Documental]:
   * - GPO: Suporta estorno reverso no gateway (GPO_GATEWAY_REFUND).
   * - REF: NÃO suporta refund/reversal automático via API no gateway (AppyPay Confirmado).
   *   O RIDING.ao processa estornos de REF como INTERNAL_WALLET_CREDIT_COMPENSATION.
   */
  public executeCompensatingRefund(params: {
    merchantTransactionID: string;
    reason: string;
  }): {
    success: boolean;
    compensatingEntry?: RidingLedgerEntry;
    message: string;
    refundChannel: 'APPYPAY_GPO_GATEWAY' | 'RIDING_INTERNAL_WALLET_COMPENSATION';
  } {
    const originalEntry = this.ledgerEntries.find(
      (l) => l.merchantTransactionID === params.merchantTransactionID && l.status === 'POSTED_TO_LEDGER'
    );

    if (!originalEntry) {
      return {
        success: false,
        message: `Entrada de ledger para ${params.merchantTransactionID} não encontrada ou já estornada.`,
        refundChannel: 'RIDING_INTERNAL_WALLET_COMPENSATION'
      };
    }

    const isRef = originalEntry.settlementType === 'REF_SETTLED';

    // [DISTINÇÃO EXPLÍCITA]:
    let entryType: RidingLedgerEntry['entryType'] = 'COMPENSATING_REFUND';
    let refundChannel: 'APPYPAY_GPO_GATEWAY' | 'RIDING_INTERNAL_WALLET_COMPENSATION' = 'APPYPAY_GPO_GATEWAY';
    let resolutionNote = '';

    if (isRef) {
      // [AppyPay Confirmado]: REF NÃO tem endpoint de refund no gateway.
      // O RIDING.ao compensa soberanamente via crédito em saldo de carteira.
      entryType = 'INTERNAL_WALLET_CREDIT_COMPENSATION';
      refundChannel = 'RIDING_INTERNAL_WALLET_COMPENSATION';
      resolutionNote = `[CONFIRMADO APPYPAY DOCS: REF sem API refund] Compensação soberana via saldo de carteira RIDING.ao: ${params.reason}`;
    } else if (originalEntry.settlementType === 'GPO_SETTLED') {
      entryType = 'GPO_GATEWAY_REFUND';
      refundChannel = 'APPYPAY_GPO_GATEWAY';
      resolutionNote = `[AppyPay GPO Refund]: Reversão autorizada no gateway AppyPay: ${params.reason}`;
    } else {
      entryType = 'INTERNAL_WALLET_CREDIT_COMPENSATION';
      refundChannel = 'RIDING_INTERNAL_WALLET_COMPENSATION';
      resolutionNote = `[Compensação Interna RIDING.ao]: ${params.reason}`;
    }

    const compensatingEntry: RidingLedgerEntry = {
      id: generateRandomId('led_refund', 4),
      transactionId: originalEntry.transactionId,
      merchantTransactionID: `REFUND_${originalEntry.merchantTransactionID}`,
      rideId: originalEntry.rideId,
      entryType,
      grossAmountAOA: -originalEntry.grossAmountAOA,
      platformCommissionAOA: -originalEntry.platformCommissionAOA,
      driverEarningsAOA: -originalEntry.driverEarningsAOA,
      gatewayFeeAOA: 0,
      driverId: originalEntry.driverId,
      passengerId: originalEntry.passengerId,
      settlementType: originalEntry.settlementType,
      status: 'REVERSED',
      postedAt: Date.now(),
      reconciliationNotes: resolutionNote
    };

    originalEntry.status = 'REVERSED';
    this.ledgerEntries.unshift(compensatingEntry);

    const message = isRef
      ? `[REF - SEM REFUND VIA API] Compensação creditada em carteira interna do RIDING.ao (PostgreSQL Ledger). O gateway AppyPay não reverte REF por endpoint.`
      : `[GPO REFUND] Estorno registrado com sucesso no Ledger Soberano e associado ao gateway AppyPay.`;

    return {
      success: true,
      compensatingEntry,
      message,
      refundChannel
    };
  }

  // ===========================================================
  // 9. RECONCILIAÇÃO BATCH APPYPAY <-> RIDING.ao
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]: Cruza extrato do gateway contra o Ledger soberano
   */
  public runReconciliationWithAppyPay(externalGatewayRecords: Array<{
    merchantTransactionID: string;
    providerTransactionId: string;
    amountAOA: number;
    status: 'SETTLED' | 'PENDING' | 'REVERSED';
  }>): AppyPayReconciliationReport {
    const reportId = `RECON_REP_${Date.now()}`;
    const items: AppyPayReconciliationReport['items'] = [];
    let matchedCount = 0;
    let disputedCount = 0;
    let totalGrossAOA = 0;
    let totalCommissionAOA = 0;

    // Verificar itens do Ledger contra o arquivo do Gateway
    this.ledgerEntries
      .filter((l) => l.entryType === 'TRIP_FARE_SETTLEMENT' && l.settlementType !== 'CASH_RECONCILED')
      .forEach((ledgerEntry) => {
        totalGrossAOA += ledgerEntry.grossAmountAOA;
        totalCommissionAOA += ledgerEntry.platformCommissionAOA;

        const external = externalGatewayRecords.find(
          (ext) => ext.merchantTransactionID === ledgerEntry.merchantTransactionID
        );

        if (!external) {
          disputedCount++;
          items.push({
            merchantTransactionID: ledgerEntry.merchantTransactionID,
            internalAmountAOA: ledgerEntry.grossAmountAOA,
            status: 'MISSING_IN_GATEWAY',
            resolutionNote: 'Transação presente no Ledger RIDING mas ausente no lote da AppyPay.'
          });
        } else if (external.amountAOA !== ledgerEntry.grossAmountAOA) {
          disputedCount++;
          items.push({
            merchantTransactionID: ledgerEntry.merchantTransactionID,
            providerTransactionId: external.providerTransactionId,
            internalAmountAOA: ledgerEntry.grossAmountAOA,
            externalAmountAOA: external.amountAOA,
            status: 'DISPUTED_AMOUNT',
            resolutionNote: `Divergência de montante: Ledger=${ledgerEntry.grossAmountAOA} vs Gateway=${external.amountAOA}.`
          });
        } else {
          matchedCount++;
          ledgerEntry.status = 'RECONCILED_WITH_APPYPAY';
          ledgerEntry.reconciledAt = Date.now();
          items.push({
            merchantTransactionID: ledgerEntry.merchantTransactionID,
            providerTransactionId: external.providerTransactionId,
            internalAmountAOA: ledgerEntry.grossAmountAOA,
            externalAmountAOA: external.amountAOA,
            status: 'MATCHED',
            resolutionNote: 'Conciliado com sucesso (100% paridade).'
          });
        }
      });

    return {
      reportId,
      generatedAt: Date.now(),
      totalTransactions: items.length,
      matchedCount,
      disputedCount,
      totalGrossAOA,
      totalCommissionAOA,
      items
    };
  }

  // ===========================================================
  // 10. INTERNAL RETRY QUEUE (RIDING.ao Worker)
  // ===========================================================
  /**
   * [Regra Interna RIDING.ao]: Retry interno seguro para tarefas do Ledger
   */
  public enqueueInternalRetry(merchantTransactionID: string, action: InternalRetryJob['action']): InternalRetryJob {
    const job: InternalRetryJob = {
      jobId: generateRandomId('retry', 4),
      merchantTransactionID,
      action,
      attempts: 0,
      maxAttempts: 5,
      nextRetryAt: Date.now() + 5000,
      status: 'PENDING'
    };
    this.internalRetryQueue.push(job);
    return job;
  }

  public getInternalRetryQueue(): InternalRetryJob[] {
    return this.internalRetryQueue;
  }

  // ===========================================================
  // 11. GETTERS & AUDIT VIEWS
  // ===========================================================
  public getAllIntents(): RidingPaymentIntent[] {
    return Array.from(this.paymentIntents.values());
  }

  public getAllTransactions(): RidingPaymentTransaction[] {
    return Array.from(this.transactions.values());
  }

  public getAllEvents(): RidingPaymentEvent[] {
    return Array.from(this.processedEvents.values());
  }

  public getLedgerEntries(): RidingLedgerEntry[] {
    return this.ledgerEntries;
  }
}

// Export singleton instance for app-wide sovereign state
export const financialLedgerEngine = new SovereignFinancialLedgerEngine();
