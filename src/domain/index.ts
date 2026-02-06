// Shared value objects
export {
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
} from './shared/index.js';

// Invoice aggregate
export {
  InvoiceNumber,
  InvoiceItem,
  Invoice,
  InvoiceStatus,
  InvoiceType,
  InvoiceQuery,
  type InvoiceItemProps,
  type CreateInvoiceProps,
  type InvoiceRepository,
  type IssueInvoiceResult,
  type InvoiceQueryResult,
  type InvoiceStatusResult,
  type ListInvoicesOptions,
  type InvoiceService,
  type InvoiceStatusInfo,
} from './invoice/index.js';

// Allowance aggregate
export {
  AllowanceItem,
  Allowance,
  AllowanceStatus,
  AllowanceType,
  type AllowanceItemProps,
  type CreateAllowanceProps,
  type AllowanceRepository,
  type IssueAllowanceResult,
  type AllowanceQueryResult,
  type AllowanceStatusResult,
  type ListAllowancesOptions,
  type AllowanceService,
  type AllowanceStatusInfo,
  type AllowanceQuery,
} from './allowance/index.js';

// Domain services
export { TaxCalculator, type TaxCalculationResult } from './services/index.js';
