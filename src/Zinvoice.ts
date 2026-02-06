import {
  Provider,
  Capability,
  PROVIDER_CAPABILITIES,
  PROVIDER_NAMES,
} from './Provider.js';
import {
  UnsupportedCapabilityError,
  ProviderNotImplementedError,
} from './errors/index.js';
import { InvoiceService } from './domain/invoice/InvoiceService.js';
import { AllowanceService } from './domain/allowance/AllowanceService.js';
import { AmegoInvoiceService } from './infrastructure/amego/AmegoInvoiceService.js';
import { AmegoAllowanceService } from './infrastructure/amego/AmegoAllowanceService.js';
import {
  CustomProviderConfig,
  validateCustomProviderConfig,
  createCustomInvoiceService,
  createCustomAllowanceService,
} from './CustomProvider.js';

/**
 * Zinvoice client configuration
 */
export interface ZinvoiceConfig {
  /** Provider to use */
  provider: Provider;
  /** Seller tax ID (統一編號) */
  sellerTaxId: string;
  /** API key */
  apiKey: string;
  /** API base URL (optional, uses provider default) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Zinvoice - Taiwan E-Invoice SDK
 *
 * Main entry point for the zinvoice SDK.
 * Provides a unified interface across different e-invoice providers.
 */
export class Zinvoice {
  private readonly _provider: Provider | 'custom';
  private readonly _providerName: string;
  private readonly _invoiceService: InvoiceService;
  private readonly _allowanceService: AllowanceService;
  private readonly _capabilities: Set<Capability>;

  private constructor(
    provider: Provider | 'custom',
    providerName: string,
    capabilities: Set<Capability>,
    invoiceService: InvoiceService,
    allowanceService: AllowanceService
  ) {
    this._provider = provider;
    this._providerName = providerName;
    this._capabilities = capabilities;
    this._invoiceService = invoiceService;
    this._allowanceService = allowanceService;
  }

  /**
   * Create a Zinvoice client
   */
  static create(config: ZinvoiceConfig): Zinvoice {
    switch (config.provider) {
      case Provider.AMEGO:
        return Zinvoice.createAmego(config);
      default:
        throw new ProviderNotImplementedError(config.provider);
    }
  }

  /**
   * Create a Zinvoice client for Amego provider
   */
  private static createAmego(config: ZinvoiceConfig): Zinvoice {
    const amegoConfig = {
      baseUrl: config.baseUrl ?? 'https://invoice-api.amego.tw',
      sellerTaxId: config.sellerTaxId,
      apiKey: config.apiKey,
      timeout: config.timeout,
    };

    const invoiceService = new AmegoInvoiceService(amegoConfig);
    const allowanceService = new AmegoAllowanceService(amegoConfig);

    return new Zinvoice(
      Provider.AMEGO,
      PROVIDER_NAMES[Provider.AMEGO],
      PROVIDER_CAPABILITIES[Provider.AMEGO],
      invoiceService,
      allowanceService
    );
  }

  /**
   * Create a custom Zinvoice client with user-provided handlers
   *
   * @example
   * ```typescript
   * const client = Zinvoice.custom({
   *   name: '自訂系統商',
   *   capabilities: [Capability.B2C, Capability.QUERY, Capability.LIST],
   *   invoices: {
   *     issue: async (invoice) => {
   *       // 實作開立發票邏輯
   *       return { invoiceNumber, invoiceTime, randomNumber };
   *     },
   *     findByNumber: async (number) => {
   *       // 實作查詢邏輯
   *       return invoice;
   *     },
   *     findByOrderId: async (orderId) => { ... },
   *     getStatus: async (numbers) => { ... },
   *     list: async (query) => { ... },
   *   },
   * });
   * ```
   *
   * @throws {ValidationError} If required handlers are not implemented for registered capabilities
   */
  static custom(config: CustomProviderConfig): Zinvoice {
    // Validate that all required handlers are implemented
    validateCustomProviderConfig(config);

    const capabilities = new Set(config.capabilities);
    const invoiceService = createCustomInvoiceService(
      config.name,
      capabilities,
      config.invoices
    );
    const allowanceService = createCustomAllowanceService(
      config.name,
      capabilities,
      config.allowances
    );

    return new Zinvoice(
      'custom',
      config.name,
      capabilities,
      invoiceService,
      allowanceService
    );
  }

  /**
   * Get the invoice service
   */
  get invoices(): InvoiceService {
    return this._invoiceService;
  }

  /**
   * Get the allowance service
   */
  get allowances(): AllowanceService {
    return this._allowanceService;
  }

  /**
   * Get the current provider
   * Returns 'custom' for custom providers
   */
  get provider(): Provider | 'custom' {
    return this._provider;
  }

  /**
   * Get the provider display name
   */
  get providerName(): string {
    return this._providerName;
  }

  /**
   * Check if a capability is supported
   */
  supports(capability: Capability): boolean {
    return this._capabilities.has(capability);
  }

  /**
   * Get all supported capabilities
   */
  getCapabilities(): Capability[] {
    return Array.from(this._capabilities);
  }

  /**
   * Assert that a capability is supported, throw if not
   */
  requireCapability(capability: Capability): void {
    if (!this.supports(capability)) {
      throw new UnsupportedCapabilityError(capability, this._providerName);
    }
  }

  /**
   * Check if this is a custom provider
   */
  get isCustom(): boolean {
    return this._provider === 'custom';
  }
}
