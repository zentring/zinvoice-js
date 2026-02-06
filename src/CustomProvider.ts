import { Capability } from './Provider.js';
import {
  InvoiceService,
  IssueInvoiceResult,
  InvoiceStatusInfo,
} from './domain/invoice/InvoiceService.js';
import {
  AllowanceService,
  IssueAllowanceResult,
  AllowanceStatusInfo,
  AllowanceQuery,
} from './domain/allowance/AllowanceService.js';
import { Invoice } from './domain/invoice/Invoice.js';
import { InvoiceNumber } from './domain/invoice/InvoiceNumber.js';
import { InvoiceQuery } from './domain/invoice/InvoiceQuery.js';
import { Allowance } from './domain/allowance/Allowance.js';
import { PaginatedResult } from './domain/shared/Pagination.js';
import { ValidationError, UnsupportedCapabilityError } from './errors/index.js';

/**
 * Custom invoice service handlers
 */
export interface CustomInvoiceHandlers {
  /** 開立發票 (B2C/B2B capability) */
  issue?: (invoice: Invoice) => Promise<IssueInvoiceResult>;
  /** 作廢發票 (VOID capability) */
  void?: (invoiceNumber: InvoiceNumber) => Promise<void>;
  /** 依發票號碼查詢 (QUERY capability) */
  findByNumber?: (invoiceNumber: InvoiceNumber) => Promise<Invoice | null>;
  /** 依訂單編號查詢 (QUERY capability) */
  findByOrderId?: (orderId: string) => Promise<Invoice | null>;
  /** 查詢發票狀態 (QUERY capability) */
  getStatus?: (invoiceNumbers: InvoiceNumber[]) => Promise<InvoiceStatusInfo[]>;
  /** 發票列表 (LIST capability) */
  list?: (query: InvoiceQuery) => Promise<PaginatedResult<Invoice>>;
}

/**
 * Custom allowance service handlers
 */
export interface CustomAllowanceHandlers {
  /** 開立折讓 (ALLOWANCE capability) */
  issue?: (allowance: Allowance) => Promise<IssueAllowanceResult>;
  /** 作廢折讓 (ALLOWANCE capability) */
  void?: (allowanceNumber: string) => Promise<void>;
  /** 依折讓單號查詢 (ALLOWANCE capability) */
  findByNumber?: (allowanceNumber: string) => Promise<Allowance | null>;
  /** 依發票號碼查詢折讓 (ALLOWANCE capability) */
  findByInvoiceNumber?: (invoiceNumber: InvoiceNumber) => Promise<Allowance[]>;
  /** 查詢折讓狀態 (ALLOWANCE capability) */
  getStatus?: (allowanceNumbers: string[]) => Promise<AllowanceStatusInfo[]>;
  /** 折讓列表 (ALLOWANCE capability) */
  list?: (query: AllowanceQuery) => Promise<PaginatedResult<Allowance>>;
}

/**
 * Configuration for custom provider
 */
export interface CustomProviderConfig {
  /** 自訂系統商名稱 */
  name: string;
  /** 支援的能力 */
  capabilities: Capability[];
  /** 發票服務實作 */
  invoices?: CustomInvoiceHandlers;
  /** 折讓服務實作 */
  allowances?: CustomAllowanceHandlers;
}

/**
 * Capability to required handlers mapping
 */
const CAPABILITY_REQUIREMENTS: Record<Capability, { invoices?: (keyof CustomInvoiceHandlers)[]; allowances?: (keyof CustomAllowanceHandlers)[] }> = {
  [Capability.B2C]: { invoices: ['issue'] },
  [Capability.B2B]: { invoices: ['issue'] },
  [Capability.CARRIER]: {}, // Part of issue, no separate handler
  [Capability.DONATION]: {}, // Part of issue, no separate handler
  [Capability.VOID]: { invoices: ['void'] },
  [Capability.QUERY]: { invoices: ['findByNumber', 'findByOrderId', 'getStatus'] },
  [Capability.LIST]: { invoices: ['list'] },
  [Capability.ALLOWANCE]: { allowances: ['issue', 'void', 'findByNumber', 'findByInvoiceNumber', 'getStatus', 'list'] },
  [Capability.EXCHANGE]: {}, // TODO: Add exchange handlers when implemented
  [Capability.PRINT]: {}, // Part of issue result, no separate handler
};

/**
 * Validate that all required handlers are implemented for the given capabilities
 */
export function validateCustomProviderConfig(config: CustomProviderConfig): void {
  const missingHandlers: string[] = [];

  for (const capability of config.capabilities) {
    const requirements = CAPABILITY_REQUIREMENTS[capability];

    // Check invoice handlers
    if (requirements.invoices) {
      for (const handler of requirements.invoices) {
        if (!config.invoices?.[handler]) {
          missingHandlers.push(`invoices.${handler} (required for ${capability})`);
        }
      }
    }

    // Check allowance handlers
    if (requirements.allowances) {
      for (const handler of requirements.allowances) {
        if (!config.allowances?.[handler]) {
          missingHandlers.push(`allowances.${handler} (required for ${capability})`);
        }
      }
    }
  }

  if (missingHandlers.length > 0) {
    throw new ValidationError(
      'customProvider',
      `Missing required handlers for registered capabilities:\n  - ${missingHandlers.join('\n  - ')}`
    );
  }
}

/**
 * Create a custom invoice service from handlers
 */
export function createCustomInvoiceService(
  providerName: string,
  capabilities: Set<Capability>,
  handlers: CustomInvoiceHandlers = {}
): InvoiceService {
  const notImplemented = (method: string, capability: Capability) => {
    return async () => {
      if (!capabilities.has(capability)) {
        throw new UnsupportedCapabilityError(capability, providerName as any);
      }
      throw new Error(`${providerName}: ${method} is not implemented`);
    };
  };

  return {
    issue: handlers.issue ?? notImplemented('issue', Capability.B2C) as any,
    void: handlers.void ?? notImplemented('void', Capability.VOID) as any,
    findByNumber: handlers.findByNumber ?? notImplemented('findByNumber', Capability.QUERY) as any,
    findByOrderId: handlers.findByOrderId ?? notImplemented('findByOrderId', Capability.QUERY) as any,
    getStatus: handlers.getStatus ?? notImplemented('getStatus', Capability.QUERY) as any,
    list: handlers.list ?? notImplemented('list', Capability.LIST) as any,
  };
}

/**
 * Create a custom allowance service from handlers
 */
export function createCustomAllowanceService(
  providerName: string,
  capabilities: Set<Capability>,
  handlers: CustomAllowanceHandlers = {}
): AllowanceService {
  const notImplemented = (method: string) => {
    return async () => {
      if (!capabilities.has(Capability.ALLOWANCE)) {
        throw new UnsupportedCapabilityError(Capability.ALLOWANCE, providerName);
      }
      throw new Error(`${providerName}: ${method} is not implemented`);
    };
  };

  return {
    issue: handlers.issue ?? notImplemented('issue') as any,
    void: handlers.void ?? notImplemented('void') as any,
    findByNumber: handlers.findByNumber ?? notImplemented('findByNumber') as any,
    findByInvoiceNumber: handlers.findByInvoiceNumber ?? notImplemented('findByInvoiceNumber') as any,
    getStatus: handlers.getStatus ?? notImplemented('getStatus') as any,
    list: handlers.list ?? notImplemented('list') as any,
  };
}
