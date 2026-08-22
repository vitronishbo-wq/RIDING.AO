import { beforeEach, describe, expect, it } from 'vitest';
import { APPY_PAY_EXPIRATION, DEFAULT_RIDING_COMMERCIAL_POLICY } from '../types/architecture';
import { SovereignFinancialLedgerEngine, financialLedgerEngine, serverVault } from './financialLedgerEngine';

let engine: SovereignFinancialLedgerEngine;

beforeEach(() => {
  engine = new SovereignFinancialLedgerEngine();
});

function settledGpoRide(overrides: { amount?: number; method?: 'MULTICAIXA_EXPRESS' | 'MULTICAIXA_REFERENCE' | 'CASH' | 'WALLET' } = {}) {
  const intent = engine.createPaymentIntent({
    rideId: `ride_${Math.random().toString(36).slice(2, 8)}`,
    idempotencyKey: `idemp_${Math.random().toString(36).slice(2, 8)}`,
    officialAmountAOA: overrides.amount ?? 4000,
    paymentMethod: overrides.method ?? 'MULTICAIXA_EXPRESS',
    passengerId: 'pass_silva_01'
  });
  const tx = engine.createPaymentTransaction({ paymentIntentId: intent.id, phoneNumber: '923112233' });
  return { intent, tx };
}

describe('serverVault', () => {
  it('keeps AppyPay credentials on the server and exposes only internal headers', () => {
    expect(serverVault.isCredentialProtected()).toBe(true);
    const headers = serverVault.getBackendHeaders();
    expect(Object.keys(headers)).toEqual(['X-Riding-Server-Authority', 'X-Internal-Token']);
    expect(JSON.stringify(headers)).not.toContain('SECRET');
  });

  it('is a singleton shared by the app', () => {
    expect(serverVault.getBackendHeaders()).toEqual(serverVault.getBackendHeaders());
  });
});

describe('commercial policy', () => {
  it('starts from the sovereign RIDING.ao defaults', () => {
    expect(engine.getCommercialPolicy()).toEqual(DEFAULT_RIDING_COMMERCIAL_POLICY);
  });

  it('returns a copy so callers cannot mutate the policy in place', () => {
    const policy = engine.getCommercialPolicy();
    policy.commissionPercentage = 0.9;
    expect(engine.getCommercialPolicy().commissionPercentage).toBe(DEFAULT_RIDING_COMMERCIAL_POLICY.commissionPercentage);
  });

  it('applies partial updates and keeps the remaining rules', () => {
    const updated = engine.updateCommercialPolicy({ commissionPercentage: 0.2, minRideFloorAOA: 800 });
    expect(updated.commissionPercentage).toBe(0.2);
    expect(updated.minRideFloorAOA).toBe(800);
    expect(updated.cancellationCompFeeAOA).toBe(DEFAULT_RIDING_COMMERCIAL_POLICY.cancellationCompFeeAOA);
  });
});

describe('createPaymentIntent', () => {
  it('creates a requested intent bounded by the internal minimum ride floor', () => {
    const intent = engine.createPaymentIntent({
      rideId: 'ride_floor',
      idempotencyKey: 'idemp_floor',
      officialAmountAOA: 120,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      passengerId: 'pass_silva_01'
    });
    expect(intent.amountAOA).toBe(DEFAULT_RIDING_COMMERCIAL_POLICY.minRideFloorAOA);
    expect(intent.status).toBe('Requested');
    expect(intent.currency).toBe('AOA');
  });

  it('rounds the official amount above the floor', () => {
    const intent = engine.createPaymentIntent({
      rideId: 'ride_round',
      idempotencyKey: 'idemp_round',
      officialAmountAOA: 3200.6,
      paymentMethod: 'CASH',
      passengerId: 'pass_silva_01'
    });
    expect(intent.amountAOA).toBe(3201);
  });

  it('is idempotent on the idempotency key', () => {
    const first = engine.createPaymentIntent({
      rideId: 'ride_a',
      idempotencyKey: 'idemp_shared',
      officialAmountAOA: 2000,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      passengerId: 'pass_silva_01'
    });
    const second = engine.createPaymentIntent({
      rideId: 'ride_b',
      idempotencyKey: 'idemp_shared',
      officialAmountAOA: 9000,
      paymentMethod: 'CASH',
      passengerId: 'pass_silva_01'
    });
    expect(second).toBe(first);
    expect(second.amountAOA).toBe(2000);
  });

  it('reuses the active intent of a ride even under a new idempotency key', () => {
    const first = engine.createPaymentIntent({
      rideId: 'ride_same',
      idempotencyKey: 'idemp_1',
      officialAmountAOA: 2000,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      passengerId: 'pass_silva_01'
    });
    const second = engine.createPaymentIntent({
      rideId: 'ride_same',
      idempotencyKey: 'idemp_2',
      officialAmountAOA: 2000,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      passengerId: 'pass_silva_01'
    });
    expect(second.id).toBe(first.id);
  });

  it('expires references after the confirmed 72h gateway window and dispatch methods after the timeout', () => {
    const ref = engine.createPaymentIntent({
      rideId: 'ride_ref',
      idempotencyKey: 'idemp_ref',
      officialAmountAOA: 6500,
      paymentMethod: 'MULTICAIXA_REFERENCE',
      passengerId: 'pass_silva_01'
    });
    expect(ref.expiresAt - ref.createdAt).toBe(APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000);

    const gpo = engine.createPaymentIntent({
      rideId: 'ride_gpo',
      idempotencyKey: 'idemp_gpo',
      officialAmountAOA: 6500,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      passengerId: 'pass_silva_01'
    });
    expect(gpo.expiresAt - gpo.createdAt).toBe(
      DEFAULT_RIDING_COMMERCIAL_POLICY.tripDispatchTimeoutMinutes * 60000
    );
  });
});

describe('createPaymentTransaction', () => {
  it('throws for an unknown intent', () => {
    expect(() => engine.createPaymentTransaction({ paymentIntentId: 'pi_missing' })).toThrow(/não encontrado/);
  });

  it('routes each payment method to its provider and moves the intent to pending', () => {
    const cases: Array<[Parameters<typeof engine.createPaymentIntent>[0]['paymentMethod'], string]> = [
      ['MULTICAIXA_EXPRESS', 'APPYPAY_GPO'],
      ['MULTICAIXA_REFERENCE', 'APPYPAY_REF'],
      ['CASH', 'CASH_DIRECT'],
      ['WALLET', 'INTERNAL_LEDGER']
    ];
    for (const [method, provider] of cases) {
      const intent = engine.createPaymentIntent({
        rideId: `ride_${method}`,
        idempotencyKey: `idemp_${method}`,
        officialAmountAOA: 3000,
        paymentMethod: method,
        passengerId: 'pass_silva_01'
      });
      const tx = engine.createPaymentTransaction({ paymentIntentId: intent.id, phoneNumber: '923456789' });
      expect(tx.provider).toBe(provider);
      expect(tx.status).toBe('Pending');
      expect(tx.amountAOA).toBe(intent.amountAOA);
      expect(tx.merchantTransactionID).toContain(intent.rideId);
      expect(intent.status).toBe('Pending');
    }
  });

  it('generates reference data only for Multicaixa Reference', () => {
    const { tx: gpoTx } = settledGpoRide();
    expect(gpoTx.referenceData).toBeUndefined();

    const intent = engine.createPaymentIntent({
      rideId: 'ride_ref_data',
      idempotencyKey: 'idemp_ref_data',
      officialAmountAOA: 6500,
      paymentMethod: 'MULTICAIXA_REFERENCE',
      passengerId: 'pass_silva_01'
    });
    const tx = engine.createPaymentTransaction({ paymentIntentId: intent.id, phoneNumber: '+244 923 456 789' });
    expect(tx.referenceData?.entity).toBe('00123');
    expect(tx.referenceData?.reference).toMatch(/^\d{3} \d{3} \d{3}$/);
    expect(tx.referenceData!.expiresAt - tx.createdAt).toBe(APPY_PAY_EXPIRATION.REF_VALIDITY_HOURS * 3600000);
  });

  it('is idempotent while a transaction is still active', () => {
    const { intent, tx } = settledGpoRide();
    expect(engine.createPaymentTransaction({ paymentIntentId: intent.id })).toBe(tx);
  });

  it('allows a new transaction after the previous one failed', () => {
    const { intent, tx } = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_fail_retry',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_FAILED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const retry = engine.createPaymentTransaction({ paymentIntentId: intent.id });
    expect(retry.id).not.toBe(tx.id);
  });
});

describe('ingestPaymentEvent', () => {
  it('settles a GPO payment and posts the 85/15 split to the ledger', () => {
    const { tx } = settledGpoRide({ amount: 4000 });
    const result = engine.ingestPaymentEvent({
      eventId: 'evt_paid_01',
      merchantTransactionID: tx.merchantTransactionID,
      providerTransactionId: 'APPY_GPO_1',
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: { amount: 4000 },
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });

    expect(result.processingStatus).toBe('PROCESSED');
    expect(tx.status).toBe('Success');
    expect(tx.providerTransactionId).toBe('APPY_GPO_1');
    expect(result.ledgerEntry).toMatchObject({
      entryType: 'TRIP_FARE_SETTLEMENT',
      settlementType: 'GPO_SETTLED',
      grossAmountAOA: 4000,
      platformCommissionAOA: 600,
      driverEarningsAOA: 3400,
      status: 'POSTED_TO_LEDGER'
    });
  });

  it('records the raw webhook payload on the transaction with an unverified signature', () => {
    const { tx } = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_raw_01',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: { foo: 'bar' },
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    expect(tx.rawWebhookEvents).toHaveLength(1);
    expect(tx.rawWebhookEvents[0].signatureStatus).toBe('UNVERIFIED_PENDING_DOCS');
    expect(tx.rawWebhookEvents[0].rawPayload).toEqual({ foo: 'bar' });
  });

  it('ignores a duplicated event id without posting twice', () => {
    const { tx } = settledGpoRide();
    const params = {
      eventId: 'evt_dup_01',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED' as const,
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    };
    engine.ingestPaymentEvent(params);
    const before = engine.getLedgerEntries().length;
    const duplicate = engine.ingestPaymentEvent(params);

    expect(duplicate.processingStatus).toBe('IGNORED_DUPLICATE');
    expect(engine.getLedgerEntries()).toHaveLength(before);
  });

  it('ignores a non refund event arriving after a successful settlement', () => {
    const { tx } = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_ooo_1',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const late = engine.ingestPaymentEvent({
      eventId: 'evt_ooo_2',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_FAILED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });

    expect(late.processingStatus).toBe('IGNORED_OUT_OF_ORDER');
    expect(tx.status).toBe('Success');
    expect(tx.rawWebhookEvents.at(-1)?.processingStatus).toBe('IGNORED_OUT_OF_ORDER');
  });

  it('queues a retry-pending result when the transaction is unknown', () => {
    const result = engine.ingestPaymentEvent({
      eventId: 'evt_orphan',
      merchantTransactionID: 'MTX_UNKNOWN',
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    expect(result).toMatchObject({ success: false, processingStatus: 'RETRY_PENDING' });
    expect(result.ledgerEntry).toBeUndefined();
  });

  it('marks failed and expired payments on both transaction and intent', () => {
    const failed = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_failed',
      merchantTransactionID: failed.tx.merchantTransactionID,
      eventType: 'PAYMENT_FAILED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    expect(failed.tx.status).toBe('Failed');
    expect(failed.intent.status).toBe('Failed');

    const expired = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_expired',
      merchantTransactionID: expired.tx.merchantTransactionID,
      eventType: 'PAYMENT_EXPIRED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    expect(expired.tx.status).toBe('Expired');
    expect(expired.intent.status).toBe('Expired');
  });

  it('reverses a GPO settlement through the AppyPay gateway channel', () => {
    const { tx } = settledGpoRide({ amount: 4000 });
    engine.ingestPaymentEvent({
      eventId: 'evt_gpo_paid',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const refund = engine.ingestPaymentEvent({
      eventId: 'evt_gpo_refund',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'GPO_REFUND_PROCESSED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });

    expect(tx.status).toBe('Refunded');
    expect(refund.ledgerEntry).toMatchObject({
      entryType: 'GPO_GATEWAY_REFUND',
      grossAmountAOA: -4000,
      platformCommissionAOA: -600,
      driverEarningsAOA: -3400,
      status: 'REVERSED'
    });
  });

  it('converts a reference refund into an internal wallet compensation, never an AppyPay refund', () => {
    const intent = engine.createPaymentIntent({
      rideId: 'ride_ref_refund',
      idempotencyKey: 'idemp_ref_refund',
      officialAmountAOA: 6500,
      paymentMethod: 'MULTICAIXA_REFERENCE',
      passengerId: 'pass_silva_01'
    });
    const tx = engine.createPaymentTransaction({ paymentIntentId: intent.id, phoneNumber: '923456789' });
    engine.ingestPaymentEvent({
      eventId: 'evt_ref_paid',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const refund = engine.ingestPaymentEvent({
      eventId: 'evt_ref_refund',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'REFUND_COMPLETED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });

    expect(refund.ledgerEntry?.entryType).toBe('INTERNAL_WALLET_CREDIT_COMPENSATION');
    expect(refund.ledgerEntry?.reconciliationNotes).toContain('REF sem API refund');
  });

  it('credits the wallet when a reference is settled after the ride was cancelled', () => {
    const intent = engine.createPaymentIntent({
      rideId: 'ride_post_cancel',
      idempotencyKey: 'idemp_post_cancel',
      officialAmountAOA: 5000,
      paymentMethod: 'MULTICAIXA_REFERENCE',
      passengerId: 'pass_silva_01'
    });
    const tx = engine.createPaymentTransaction({ paymentIntentId: intent.id, phoneNumber: '923456789' });
    const result = engine.ingestPaymentEvent({
      eventId: 'evt_post_cancel',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'REF_POST_CANCEL_SETTLED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });

    expect(tx.status).toBe('Success');
    expect(result.ledgerEntry).toMatchObject({
      entryType: 'INTERNAL_WALLET_CREDIT_COMPENSATION',
      grossAmountAOA: 5000,
      platformCommissionAOA: 0,
      driverEarningsAOA: 0,
      settlementType: 'WALLET_TRANSFER'
    });
    expect(result.ledgerEntry?.merchantTransactionID).toBe(`WALLET_COMP_${tx.merchantTransactionID}`);
  });
});

describe('postToSovereignLedger', () => {
  const base = {
    transactionId: 'tx_direct',
    merchantTransactionID: 'MTX_DIRECT_01',
    rideId: 'ride_direct',
    grossAmountAOA: 4000,
    driverId: 'drv_manuel_01',
    passengerId: 'pass_silva_01'
  };

  it('splits the fare using the configured commission percentage', () => {
    engine.updateCommercialPolicy({ commissionPercentage: 0.2 });
    const entry = engine.postToSovereignLedger({ ...base, paymentMethod: 'MULTICAIXA_EXPRESS' });
    expect(entry.platformCommissionAOA).toBe(800);
    expect(entry.driverEarningsAOA).toBe(3200);
    expect(entry.grossAmountAOA).toBe(entry.platformCommissionAOA + entry.driverEarningsAOA);
  });

  it('classifies the settlement type per payment method', () => {
    expect(engine.postToSovereignLedger({ ...base, merchantTransactionID: 'MTX_M1', paymentMethod: 'MULTICAIXA_EXPRESS' }).settlementType).toBe('GPO_SETTLED');
    expect(engine.postToSovereignLedger({ ...base, merchantTransactionID: 'MTX_M2', paymentMethod: 'MULTICAIXA_REFERENCE' }).settlementType).toBe('REF_SETTLED');
    expect(engine.postToSovereignLedger({ ...base, merchantTransactionID: 'MTX_M3', paymentMethod: 'WALLET' }).settlementType).toBe('WALLET_TRANSFER');
  });

  it('debits the commission for cash rides instead of settling the fare', () => {
    const entry = engine.postToSovereignLedger({ ...base, merchantTransactionID: 'MTX_CASH', paymentMethod: 'CASH' });
    expect(entry.settlementType).toBe('CASH_RECONCILED');
    expect(entry.entryType).toBe('CASH_COMMISSION_DEBIT');
  });

  it('never charges a gateway fee', () => {
    expect(engine.postToSovereignLedger({ ...base, paymentMethod: 'MULTICAIXA_EXPRESS' }).gatewayFeeAOA).toBe(0);
  });

  it('is idempotent per merchantTransactionID', () => {
    const first = engine.postToSovereignLedger({ ...base, paymentMethod: 'MULTICAIXA_EXPRESS' });
    const before = engine.getLedgerEntries().length;
    const second = engine.postToSovereignLedger({ ...base, paymentMethod: 'MULTICAIXA_EXPRESS' });
    expect(second).toBe(first);
    expect(engine.getLedgerEntries()).toHaveLength(before);
  });

  it('prepends the newest entry to the ledger', () => {
    const entry = engine.postToSovereignLedger({ ...base, paymentMethod: 'MULTICAIXA_EXPRESS' });
    expect(engine.getLedgerEntries()[0]).toBe(entry);
  });
});

describe('executeCompensatingRefund', () => {
  it('fails when the original ledger entry does not exist', () => {
    const result = engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_NOPE', reason: 'teste' });
    expect(result).toMatchObject({ success: false, refundChannel: 'RIDING_INTERNAL_WALLET_COMPENSATION' });
    expect(result.compensatingEntry).toBeUndefined();
  });

  it('reverses the original entry and mirrors the amounts with the opposite sign', () => {
    const original = engine.postToSovereignLedger({
      transactionId: 'tx_rev',
      merchantTransactionID: 'MTX_REV_01',
      rideId: 'ride_rev',
      grossAmountAOA: 2000,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const result = engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_REV_01', reason: 'cancelamento' });

    expect(result.success).toBe(true);
    expect(result.refundChannel).toBe('APPYPAY_GPO_GATEWAY');
    expect(original.status).toBe('REVERSED');
    expect(result.compensatingEntry).toMatchObject({
      merchantTransactionID: 'REFUND_MTX_REV_01',
      grossAmountAOA: -2000,
      status: 'REVERSED'
    });
    expect(result.message).toContain('GPO REFUND');
  });

  it('compensates internally for references because the gateway has no refund API', () => {
    engine.postToSovereignLedger({
      transactionId: 'tx_ref_rev',
      merchantTransactionID: 'MTX_REF_REV',
      rideId: 'ride_ref_rev',
      grossAmountAOA: 3000,
      paymentMethod: 'MULTICAIXA_REFERENCE',
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const result = engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_REF_REV', reason: 'passageiro desistiu' });

    expect(result.refundChannel).toBe('RIDING_INTERNAL_WALLET_COMPENSATION');
    expect(result.compensatingEntry?.entryType).toBe('INTERNAL_WALLET_CREDIT_COMPENSATION');
    expect(result.message).toContain('SEM REFUND VIA API');
  });

  it('compensates internally for cash and wallet settlements', () => {
    engine.postToSovereignLedger({
      transactionId: 'tx_cash_rev',
      merchantTransactionID: 'MTX_CASH_REV',
      rideId: 'ride_cash_rev',
      grossAmountAOA: 1500,
      paymentMethod: 'CASH',
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const result = engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_CASH_REV', reason: 'ajuste operacional' });
    expect(result.refundChannel).toBe('RIDING_INTERNAL_WALLET_COMPENSATION');
    expect(result.compensatingEntry?.reconciliationNotes).toContain('Compensação Interna RIDING.ao');
  });

  it('refuses to reverse the same entry twice', () => {
    engine.postToSovereignLedger({
      transactionId: 'tx_twice',
      merchantTransactionID: 'MTX_TWICE',
      rideId: 'ride_twice',
      grossAmountAOA: 1000,
      paymentMethod: 'MULTICAIXA_EXPRESS',
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_TWICE', reason: 'primeira' });
    expect(engine.executeCompensatingRefund({ merchantTransactionID: 'MTX_TWICE', reason: 'segunda' }).success).toBe(false);
  });
});

describe('runReconciliationWithAppyPay', () => {
  it('matches ledger entries against the gateway batch', () => {
    const seeded = engine.getLedgerEntries()[0];
    const report = engine.runReconciliationWithAppyPay([
      {
        merchantTransactionID: seeded.merchantTransactionID,
        providerTransactionId: 'APPY_GPO_99182',
        amountAOA: seeded.grossAmountAOA,
        status: 'SETTLED'
      }
    ]);

    expect(report.matchedCount).toBe(1);
    expect(report.disputedCount).toBe(0);
    expect(report.items[0]).toMatchObject({ status: 'MATCHED', providerTransactionId: 'APPY_GPO_99182' });
    expect(seeded.status).toBe('RECONCILED_WITH_APPYPAY');
    expect(seeded.reconciledAt).toBeTypeOf('number');
    expect(report.reportId).toMatch(/^RECON_REP_\d+$/);
  });

  it('flags ledger entries missing from the gateway batch', () => {
    const report = engine.runReconciliationWithAppyPay([]);
    expect(report.disputedCount).toBe(report.totalTransactions);
    expect(report.items.every((i) => i.status === 'MISSING_IN_GATEWAY')).toBe(true);
  });

  it('flags amount divergences between the ledger and the gateway', () => {
    const seeded = engine.getLedgerEntries()[0];
    const report = engine.runReconciliationWithAppyPay([
      {
        merchantTransactionID: seeded.merchantTransactionID,
        providerTransactionId: 'APPY_GPO_99182',
        amountAOA: seeded.grossAmountAOA + 100,
        status: 'SETTLED'
      }
    ]);
    expect(report.items[0].status).toBe('DISPUTED_AMOUNT');
    expect(report.items[0].resolutionNote).toContain('Divergência de montante');
    expect(seeded.status).toBe('POSTED_TO_LEDGER');
  });

  it('totals gross and commission over the reconciled scope', () => {
    const { tx } = settledGpoRide({ amount: 4000 });
    engine.ingestPaymentEvent({
      eventId: 'evt_recon_totals',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const report = engine.runReconciliationWithAppyPay([]);
    expect(report.totalGrossAOA).toBe(8200); // 4200 seeded + 4000
    expect(report.totalCommissionAOA).toBe(1230);
  });

  it('excludes cash settlements from the gateway reconciliation scope', () => {
    engine.postToSovereignLedger({
      transactionId: 'tx_cash_scope',
      merchantTransactionID: 'MTX_CASH_SCOPE',
      rideId: 'ride_cash_scope',
      grossAmountAOA: 2500,
      paymentMethod: 'CASH',
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    const report = engine.runReconciliationWithAppyPay([]);
    expect(report.items.some((i) => i.merchantTransactionID === 'MTX_CASH_SCOPE')).toBe(false);
  });
});

describe('internal retry queue', () => {
  it('starts empty and enqueues jobs with bounded attempts', () => {
    expect(engine.getInternalRetryQueue()).toHaveLength(0);
    const job = engine.enqueueInternalRetry('MTX_RETRY', 'RECONCILE_BATCH');
    expect(job).toMatchObject({
      merchantTransactionID: 'MTX_RETRY',
      action: 'RECONCILE_BATCH',
      attempts: 0,
      maxAttempts: 5,
      status: 'PENDING'
    });
    expect(job.nextRetryAt).toBeGreaterThan(Date.now());
    expect(engine.getInternalRetryQueue()).toEqual([job]);
  });
});

describe('audit views', () => {
  it('exposes the seeded GPO and reference chain', () => {
    expect(engine.getAllIntents().map((i) => i.id)).toContain('pi_seed_gpo_01');
    expect(engine.getAllTransactions().map((t) => t.id)).toEqual(
      expect.arrayContaining(['tx_seed_gpo_01', 'tx_seed_ref_02'])
    );
    expect(engine.getAllEvents()).toHaveLength(0);
    expect(engine.getLedgerEntries()).toHaveLength(1);
  });

  it('lists every processed event once ingested', () => {
    const { tx } = settledGpoRide();
    engine.ingestPaymentEvent({
      eventId: 'evt_audit',
      merchantTransactionID: tx.merchantTransactionID,
      eventType: 'PAYMENT_RECEIVED',
      rawPayload: {},
      driverId: 'drv_manuel_01',
      passengerId: 'pass_silva_01'
    });
    expect(engine.getAllEvents().map((e) => e.eventId)).toEqual(['evt_audit']);
  });
});

describe('financialLedgerEngine singleton', () => {
  it('is seeded and shared app-wide', () => {
    expect(financialLedgerEngine).toBeInstanceOf(SovereignFinancialLedgerEngine);
    expect(financialLedgerEngine.getCommercialPolicy().minRideFloorAOA).toBe(500);
    expect(financialLedgerEngine.getAllTransactions().length).toBeGreaterThan(0);
  });
});
