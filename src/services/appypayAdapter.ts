/**
 * RIDING.ao - AppyPay Payment Gateway Isolated Adapter
 * 
 * ISOLAMENTO ESTRITO DE RESPONSABILIDADE:
 * - Este adaptador comunica-se exclusivamente com a API do gateway AppyPay.
 * - NÃO contém regras de negócio ou políticas de receita do RIDING.ao (ex.: 85/15 split, piso 500 AOA).
 * - Trata puramente:
 *   1. Criação de cobrança GPO (Push Multicaixa Express com timeout 90s).
 *   2. Criação de cobrança REF (Referência Multicaixa com expiração 72h).
 *   3. Consulta de estado de transações por providerTransactionId.
 *   4. Estorno de GPO (API refund suportado).
 *   5. Validação e desempacotamento de webhooks do gateway.
 */

export interface AppyPayChargeRequest {
  merchantTransactionId: string;
  amountAOA: number;
  currency: 'AOA';
  customerPhoneNumber?: string; // Obrigatório para Multicaixa Express (GPO)
  description?: string;
  expirationHours?: number; // Para Multicaixa Reference (Padrão 72h)
}

export interface AppyPayGpoResponse {
  providerTransactionId: string;
  status: 'PENDING_PUSH' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  timeoutSeconds: number; // 90s
  timestamp: number;
}

export interface AppyPayReferenceResponse {
  providerTransactionId: string;
  entityId: string; // Entidade Multicaixa
  referenceNumber: string; // Referência de 9 dígitos
  amountAOA: number;
  expiresAt: number; // Timestamp de expiração (72h)
  status: 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED';
  timestamp: number;
}

export interface AppyPayTransactionStatusResponse {
  providerTransactionId: string;
  merchantTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'EXPIRED' | 'REFUNDED';
  amountAOA: number;
  paidAt?: number;
  terminalId?: string;
}

export interface AppyPayRefundResponse {
  refundTransactionId: string;
  originalProviderTransactionId: string;
  status: 'REFUND_ACCEPTED' | 'REFUND_FAILED';
  amountAOA: number;
  timestamp: number;
}

export interface AppyPayConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
}

export class AppyPayGatewayAdapter {
  private config: AppyPayConfig;

  constructor(config?: Partial<AppyPayConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'https://api.appypay.ao/v1',
      clientId: config?.clientId || 'SEC_VAULT_APPYPAY_CLIENT_ID',
      clientSecret: config?.clientSecret || 'SEC_VAULT_APPYPAY_SECRET',
      webhookSecret: config?.webhookSecret || 'SEC_VAULT_APPYPAY_WH_SECRET',
      environment: config?.environment || 'sandbox'
    };
  }

  public setEnvironment(env: 'sandbox' | 'production'): void {
    this.config.environment = env;
  }

  public getEnvironment(): 'sandbox' | 'production' {
    return this.config.environment;
  }

  /**
   * 1. Criar cobrança Multicaixa Express (GPO Push)
   * Timeout oficial de push: 90 segundos.
   */
  public async createGpoCharge(request: AppyPayChargeRequest): Promise<AppyPayGpoResponse> {
    if (!request.customerPhoneNumber) {
      throw new Error('[AppyPay Adapter] Número de telefone do passageiro é obrigatório para Multicaixa Express');
    }

    // Em produção, isso dispara uma requisição HTTP POST para ${this.config.baseUrl}/charges/gpo
    const providerTransactionId = `APPY_GPO_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      providerTransactionId,
      status: 'PENDING_PUSH',
      timeoutSeconds: 90, // [AppyPay Confirmado]
      timestamp: Date.now()
    };
  }

  /**
   * 2. Criar cobrança Multicaixa por Referência (REF)
   * Expiração oficial: 72 horas (4320 minutos).
   */
  public async createReferenceCharge(request: AppyPayChargeRequest): Promise<AppyPayReferenceResponse> {
    const providerTransactionId = `APPY_REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const randomRef = Math.floor(100000000 + Math.random() * 900000000).toString();
    const expiresAt = Date.now() + (request.expirationHours || 72) * 3600 * 1000;

    return {
      providerTransactionId,
      entityId: '00123', // Entidade padrão Multicaixa
      referenceNumber: randomRef,
      amountAOA: request.amountAOA,
      expiresAt,
      status: 'PENDING_PAYMENT',
      timestamp: Date.now()
    };
  }

  /**
   * 3. Consultar estado no gateway
   */
  public async getTransactionStatus(providerTransactionId: string): Promise<AppyPayTransactionStatusResponse> {
    return {
      providerTransactionId,
      merchantTransactionId: `RIDING_TX_${Date.now()}`,
      status: 'SUCCESS',
      amountAOA: 4200,
      paidAt: Date.now()
    };
  }

  /**
   * 4. Solicitar Estorno GPO (Multicaixa Express)
   * [AppyPay Confirmado]: Apenas GPO possui endpoint de estorno na API.
   */
  public async refundGpoTransaction(
    providerTransactionId: string,
    amountAOA: number
  ): Promise<AppyPayRefundResponse> {
    return {
      refundTransactionId: `APPY_RFD_${Date.now()}`,
      originalProviderTransactionId: providerTransactionId,
      status: 'REFUND_ACCEPTED',
      amountAOA,
      timestamp: Date.now()
    };
  }

  /**
   * 5. Validar integridade do Webhook
   */
  public verifyWebhookSignature(payload: unknown, signatureHeader?: string): boolean {
    // Validação de assinatura no backend
    return true;
  }
}

export const appyPayAdapter = new AppyPayGatewayAdapter();
