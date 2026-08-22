import { RidingPaymentIntent, RidingPaymentMethod, RidingPaymentTransaction } from '../types/architecture';
import { SovereignFinancialLedgerEngine } from './financialLedgerEngine';

const PASSENGER_ID = 'usr_p1';
const PASSENGER_PHONE = '+244 923 100 200';

export interface PaymentChain {
  intent: RidingPaymentIntent;
  transaction: RidingPaymentTransaction;
}

export function createPaymentChain(
  engine: SovereignFinancialLedgerEngine,
  params: {
    rideId: string;
    idempotencyKey: string;
    officialAmountAOA: number;
    paymentMethod: RidingPaymentMethod;
  }
): PaymentChain {
  const intent = engine.createPaymentIntent({
    rideId: params.rideId,
    idempotencyKey: params.idempotencyKey,
    officialAmountAOA: params.officialAmountAOA,
    paymentMethod: params.paymentMethod,
    passengerId: PASSENGER_ID
  });

  const transaction = engine.createPaymentTransaction({
    paymentIntentId: intent.id,
    phoneNumber: PASSENGER_PHONE
  });

  return { intent, transaction };
}
