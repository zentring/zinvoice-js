/**
 * zinvoice - Taiwan E-Invoice SDK
 *
 * A TypeScript library for Taiwan's electronic invoice system.
 * Supports multiple providers (加值中心).
 *
 * @packageDocumentation
 */

// Main entry point
export { Zinvoice, type ZinvoiceConfig } from './Zinvoice.js';
export {
  Provider,
  Capability,
  PROVIDER_CAPABILITIES,
  PROVIDER_NAMES,
} from './Provider.js';

// Domain layer exports - Value Objects
export {
  // Shared value objects
  TaxId,
  Money,
  CarrierCode,
  CarrierType,
  TaxType,
  ZeroTaxRateReason,
  CustomsClearanceMark,
  TAX_RATE,
  Buyer,
  type CompanyBuyerProps,
  Carrier,
  Donation,
  OrderId,
  LocalDate,
  DateRange,
  DateType,
  Pagination,
  createPaginatedResult,
  type PaginatedResult,
  // Invoice aggregate
  InvoiceNumber,
  InvoiceItem,
  Invoice,
  InvoiceStatus,
  InvoiceType,
  InvoiceQuery,
  type InvoiceItemProps,
  type CreateInvoiceProps,
  type InvoiceService,
  type IssueInvoiceResult,
  type InvoiceStatusInfo,
  // Allowance aggregate
  AllowanceItem,
  Allowance,
  AllowanceStatus,
  AllowanceType,
  type AllowanceItemProps,
  type CreateAllowanceProps,
  type AllowanceService,
  type IssueAllowanceResult,
  type AllowanceStatusInfo,
  type AllowanceQuery,
  // Domain services
  TaxCalculator,
  type TaxCalculationResult,
} from './domain/index.js';

// Error types
export {
  ZinvoiceError,
  InvalidTaxIdError,
  InvalidCarrierCodeError,
  InvalidInvoiceNumberError,
  InvalidMoneyError,
  ProviderApiError,
  NetworkError,
  ValidationError,
  UnsupportedCapabilityError,
  ProviderNotImplementedError,
} from './errors/index.js';

// Infrastructure exports (for advanced usage)
export {
  type AmegoConfig,
  AmegoClient,
  AmegoSigner,
  AmegoMapper,
  AmegoInvoiceRepository,
  AmegoAllowanceRepository,
  AmegoInvoiceService,
  AmegoAllowanceService,
  AMEGO_ENDPOINTS,
  AMEGO_DEFAULTS,
} from './infrastructure/index.js';

// Legacy application layer (deprecated, use Zinvoice facade instead)
export {
  InvoiceService as LegacyInvoiceService,
  AllowanceService as LegacyAllowanceService,
  type IssueInvoiceInput,
  type CreateInvoiceItemInput,
  type IssueAllowanceInput,
  type CreateAllowanceItemInput,
} from './application/index.js';

// Legacy repository types (deprecated)
export {
  type InvoiceRepository,
  type InvoiceQueryResult,
  type InvoiceStatusResult,
  type ListInvoicesOptions,
  type AllowanceRepository,
  type AllowanceQueryResult,
  type AllowanceStatusResult,
  type ListAllowancesOptions,
} from './domain/index.js';
