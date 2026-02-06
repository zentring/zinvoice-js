import {
  Allowance,
  CreateAllowanceProps,
} from '../domain/allowance/Allowance.js';
import { AllowanceItem } from '../domain/allowance/AllowanceItem.js';
import {
  AllowanceRepository,
  IssueAllowanceResult,
  AllowanceQueryResult,
  AllowanceStatusResult,
  ListAllowancesOptions,
} from '../domain/allowance/AllowanceRepository.js';
import { InvoiceNumber } from '../domain/invoice/InvoiceNumber.js';
import { TaxId } from '../domain/shared/TaxId.js';
import { Money } from '../domain/shared/Money.js';
import { TaxType } from '../domain/shared/TaxType.js';

/**
 * Simplified input for creating allowance items
 */
export interface CreateAllowanceItemInput {
  /** 原發票品名 */
  originalDescription: string;
  /** 數量 */
  quantity: number;
  /** 單價 */
  unitPrice: number;
  /** 金額 (optional, auto-calculated if not provided) */
  amount?: number;
  /** 單位 */
  unit?: string;
  /** 課稅別 (default: TAXABLE) */
  taxType?: TaxType;
}

/**
 * Simplified input for issuing an allowance
 */
export interface IssueAllowanceInput {
  /** 原發票號碼 */
  originalInvoiceNumber: string;
  /** 原發票日期 (Date object or YYYYMMDD string) */
  originalInvoiceDate: Date | string;
  /** 買方統一編號 */
  buyerTaxId?: string;
  /** 賣方統一編號 */
  sellerTaxId: string;
  /** 折讓明細 */
  items: CreateAllowanceItemInput[];
  /** 買方名稱 */
  buyerName?: string;
  /** 賣方名稱 */
  sellerName?: string;
  /** 明細含稅或未稅 (default: true) */
  pricesIncludeTax?: boolean;
}

/**
 * Allowance Application Service
 *
 * Provides high-level operations for allowance management.
 * Acts as the main entry point for allowance-related use cases.
 */
export class AllowanceService {
  constructor(private readonly repository: AllowanceRepository) {}

  /**
   * Issue a new allowance
   */
  async issue(input: IssueAllowanceInput): Promise<IssueAllowanceResult> {
    // Convert input items to domain items
    const items = input.items.map((item) => {
      const unitPrice = Money.create(item.unitPrice);

      if (item.amount !== undefined) {
        return AllowanceItem.create({
          originalDescription: item.originalDescription,
          quantity: item.quantity,
          unitPrice,
          amount: Money.create(item.amount),
          unit: item.unit,
          taxType: item.taxType,
        });
      }

      return AllowanceItem.createWithAutoAmount({
        originalDescription: item.originalDescription,
        quantity: item.quantity,
        unitPrice,
        unit: item.unit,
        taxType: item.taxType,
      });
    });

    // Parse date if string
    let invoiceDate: Date;
    if (typeof input.originalInvoiceDate === 'string') {
      const dateStr = input.originalInvoiceDate;
      if (dateStr.length === 8) {
        // YYYYMMDD format
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        invoiceDate = new Date(year, month, day);
      } else {
        invoiceDate = new Date(dateStr);
      }
    } else {
      invoiceDate = input.originalInvoiceDate;
    }

    // Create allowance props
    const props: CreateAllowanceProps = {
      originalInvoiceNumber: InvoiceNumber.create(input.originalInvoiceNumber),
      originalInvoiceDate: invoiceDate,
      buyerTaxId: input.buyerTaxId
        ? TaxId.tryCreate(input.buyerTaxId) ?? TaxId.none()
        : TaxId.none(),
      sellerTaxId: TaxId.create(input.sellerTaxId),
      items,
      buyerName: input.buyerName,
      sellerName: input.sellerName,
      pricesIncludeTax: input.pricesIncludeTax,
    };

    // Create and issue allowance
    const allowance = Allowance.create(props);
    return this.repository.issue(allowance);
  }

  /**
   * Void an allowance
   */
  async void(allowanceNumber: string): Promise<void> {
    return this.repository.void(allowanceNumber);
  }

  /**
   * Query allowance by allowance number
   */
  async findByAllowanceNumber(
    allowanceNumber: string
  ): Promise<AllowanceQueryResult | null> {
    return this.repository.findByAllowanceNumber(allowanceNumber);
  }

  /**
   * Query allowances by original invoice number
   */
  async findByInvoiceNumber(
    invoiceNumber: string
  ): Promise<AllowanceQueryResult[]> {
    const number = InvoiceNumber.create(invoiceNumber);
    return this.repository.findByInvoiceNumber(number);
  }

  /**
   * Check allowance status
   */
  async getStatus(allowanceNumbers: string[]): Promise<AllowanceStatusResult[]> {
    return this.repository.getStatus(allowanceNumbers);
  }

  /**
   * List allowances
   */
  async list(options: ListAllowancesOptions): Promise<{
    allowances: AllowanceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }> {
    return this.repository.list(options);
  }
}
