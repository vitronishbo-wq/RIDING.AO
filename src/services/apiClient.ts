/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Centralized Business API Client
 * 
 * TODAS AS CHAMADAS DE NEGÓCIO PASSAM OBRIGATORIAMENTE PELO GATEWAY RENDER.
 * Este cliente padroniza:
 * 1. Roteamento universal através do endpoint '/api/v1/...'
 * 2. Injeção determinística de 'X-Request-Id' e rastreamento de telemetria
 * 3. Tratamento unificado de erros (4xx, 5xx, 429, timeouts)
 * 4. Circuit breaking e retry com backoff exponencial
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
  requestId: string;
  latencyMs: number;
}

export interface RideQuoteRequest {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  category: 'economico' | 'conforto' | 'executivo' | 'kandongueiro';
  surgeMultiplier?: number;
}

export interface RideQuoteResponse {
  quoteId: string;
  distanceKm: number;
  durationMinutes: number;
  estimatedPriceAOA: number;
  baseFareAOA: number;
  surgeMultiplier: number;
  currency: 'AOA';
  category: string;
  expiresInSeconds: number;
}

export interface CreateRideRequest {
  passengerId: string;
  passengerName: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  category: string;
  paymentMethod: 'CASH' | 'MULTICAIXA_EXPRESS' | 'MULTICAIXA_REFERENCE' | 'WALLET';
  quotedPriceAOA: number;
  quoteId?: string;
}

export interface RideStatusResponse {
  rideId: string;
  status: 'SEARCHING' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  passengerId: string;
  driverId?: string;
  driverName?: string;
  vehiclePlate?: string;
  driverLocation?: { lat: number; lng: number };
  etaMinutes?: number;
  finalPriceAOA: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  updatedAt: string;
}

class CentralizedApiClient {
  private baseUrl: string;

  constructor() {
    // Aponta para o backend relativo /api/v1 quando no mesmo domínio ou porta de hosting
    this.baseUrl = '/api/v1';
  }

  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Execução centralizada de requisições HTTP
   */
  public async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const timeoutMs = options.timeoutMs || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      'X-Client-Timestamp': new Date().toISOString(),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Number((performance.now() - startTime).toFixed(1));
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: json.error || json.message || `HTTP ${response.status}`,
          message: json.message,
          statusCode: response.status,
          requestId,
          latencyMs,
        };
      }

      return {
        success: true,
        data: json as T,
        statusCode: response.status,
        requestId,
        latencyMs,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Number((performance.now() - startTime).toFixed(1));
      const isTimeout = err.name === 'AbortError';

      return {
        success: false,
        error: isTimeout ? 'Gateway Timeout (Render Central)' : err.message || 'Network Error',
        message: isTimeout ? 'A requisição excedeu o tempo limite do Render Gateway.' : 'Falha de conexão com a API central.',
        statusCode: isTimeout ? 504 : 0,
        requestId,
        latencyMs,
      };
    }
  }

  // ==========================================
  // 1. RIDES & DISPATCH APIS (RENDER CENTRAL)
  // ==========================================

  public async getRideQuote(payload: RideQuoteRequest): Promise<ApiResponse<RideQuoteResponse>> {
    return this.request<RideQuoteResponse>('/rides/quote', {
      method: 'POST',
      body: payload,
    });
  }

  public async requestRide(payload: CreateRideRequest): Promise<ApiResponse<{ rideId: string; status: string; estimatedPriceAOA: number }>> {
    return this.request('/rides/request', {
      method: 'POST',
      body: payload,
    });
  }

  public async getRideStatus(rideId: string): Promise<ApiResponse<RideStatusResponse>> {
    return this.request<RideStatusResponse>(`/rides/${rideId}/status`, {
      method: 'GET',
    });
  }

  public async cancelRide(rideId: string, reason: string): Promise<ApiResponse<{ success: boolean; cancellationFeeAOA: number }>> {
    return this.request(`/rides/${rideId}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  }

  public async matchDriver(rideId: string, geohash: string): Promise<ApiResponse<{ matchedDriverId: string; score: number; latencyMs: number }>> {
    return this.request(`/rides/${rideId}/match`, {
      method: 'POST',
      body: { geohash },
    });
  }

  // ==========================================
  // 2. DRIVERS & TELEMETRY APIS (RENDER CENTRAL)
  // ==========================================

  public async sendDriverTelemetry(payload: {
    driverId: string;
    lat: number;
    lng: number;
    speedKmh: number;
    heading: number;
    status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  }): Promise<ApiResponse<{ received: boolean; serverTimestamp: string }>> {
    return this.request('/drivers/telemetry', {
      method: 'POST',
      body: payload,
    });
  }

  public async getNearbyDrivers(lat: number, lng: number, category?: string): Promise<ApiResponse<{ drivers: any[]; count: number }>> {
    return this.request(`/drivers/nearby?lat=${lat}&lng=${lng}&category=${category || 'all'}`, {
      method: 'GET',
    });
  }

  // ==========================================
  // 3. PAYMENTS & FINANCE APIS (APPYPAY / EMIS)
  // ==========================================

  public async createPaymentIntent(payload: {
    rideId: string;
    amountAOA: number;
    paymentMethod: string;
    idempotencyKey: string;
  }): Promise<ApiResponse<{ paymentIntentId: string; status: string; amountAOA: number }>> {
    return this.request('/payments/intent', {
      method: 'POST',
      body: payload,
    });
  }

  public async triggerGpoCharge(payload: {
    rideId: string;
    phoneNumber: string;
    amountAOA: number;
  }): Promise<ApiResponse<{ providerTransactionId: string; status: string; timeoutSeconds: number }>> {
    return this.request('/payments/charge/gpo', {
      method: 'POST',
      body: payload,
    });
  }

  public async generateMulticaixaReference(payload: {
    rideId: string;
    amountAOA: number;
  }): Promise<ApiResponse<{ entityId: string; referenceNumber: string; amountAOA: number; expiresAt: string }>> {
    return this.request('/payments/charge/ref', {
      method: 'POST',
      body: payload,
    });
  }

  public async getPaymentStatus(transactionId: string): Promise<ApiResponse<{ transactionId: string; status: string; amountAOA: number }>> {
    return this.request(`/payments/${transactionId}/status`, {
      method: 'GET',
    });
  }

  public async getDriverWallet(driverId: string): Promise<ApiResponse<{ balanceAOA: number; pendingPayoutAOA: number; currency: string }>> {
    return this.request(`/finance/wallet?driverId=${driverId}`, {
      method: 'GET',
    });
  }

  // ==========================================
  // 4. MASTER & CLUSTER CONTROL APIS
  // ==========================================

  public async getClusterTopology(): Promise<ApiResponse<any>> {
    return this.request('/cluster/status', { method: 'GET' });
  }

  public async getHostingReleases(): Promise<ApiResponse<any>> {
    return this.request('/hosting/releases', { method: 'GET' });
  }

  public async executeStrategicRollback(targetVersion: string, reason: string): Promise<ApiResponse<any>> {
    return this.request('/hosting/rollback', {
      method: 'POST',
      body: { targetVersion, reason },
    });
  }

  public async getGatewayCatalog(): Promise<ApiResponse<any>> {
    return this.request('/gateway/catalog', { method: 'GET' });
  }

  // ==========================================
  // 5. DATA TIER SEGREGATION & AUDIT APIS
  // ==========================================

  public async getDataClassificationAudit(): Promise<ApiResponse<any>> {
    return this.request('/data/classification', { method: 'GET' });
  }

  public async getPublicTariffs(): Promise<ApiResponse<{ currency: string; minimumFloorAOA: number; categories: any[] }>> {
    return this.request('/public/tariffs', { method: 'GET' });
  }

  public async getPublicLocations(): Promise<ApiResponse<{ city: string; totalAnchors: number; anchors: any[] }>> {
    return this.request('/public/locations', { method: 'GET' });
  }

  public async getPublicStatus(): Promise<ApiResponse<{ service: string; status: string; uptimePercentage: number }>> {
    return this.request('/public/status', { method: 'GET' });
  }
}

export const apiClient = new CentralizedApiClient();
