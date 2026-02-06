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
  private readonly _provider: Provider;
  private readonly _invoiceService: InvoiceService;
  private readonly _allowanceService: AllowanceService;
  private readonly _capabilities: Set<Capability>;

  private constructor(
    provider: Provider,
    invoiceService: InvoiceService,
    allowanceService: AllowanceService
  ) {
    this._provider = provider;
    this._invoiceService = invoiceService;
    this._allowanceService = allowanceService;
    this._capabilities = PROVIDER_CAPABILITIES[provider];
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

    return new Zinvoice(Provider.AMEGO, invoiceService, allowanceService);
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
   */
  get provider(): Provider {
    return this._provider;
  }

  /**
   * Get the provider display name
   */
  get providerName(): string {
    return PROVIDER_NAMES[this._provider];
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
      throw new UnsupportedCapabilityError(capability, this._provider);
    }
  }
}
