import { Invoice } from '../domain/invoice/Invoice.js';
import { InvoiceNumber } from '../domain/invoice/InvoiceNumber.js';
import { InvoiceItem } from '../domain/invoice/InvoiceItem.js';
import {
  InvoiceRepository,
  IssueInvoiceResult,
  InvoiceQueryResult,
  InvoiceStatusResult,
  ListInvoicesOptions,
} from '../domain/invoice/InvoiceRepository.js';
import { TaxId } from '../domain/shared/TaxId.js';
import { Money } from '../domain/shared/Money.js';
import { TaxType } from '../domain/shared/TaxType.js';
import { OrderId } from '../domain/shared/OrderId.js';
import { Buyer } from '../domain/shared/Buyer.js';
import { Carrier } from '../domain/shared/Carrier.js';
import { Donation } from '../domain/shared/Donation.js';

/**
 * Simplified input for creating invoice items
 */
export interface CreateInvoiceItemInput {
  /** 品名 */
  description: string;
  /** 數量 */
  quantity: number;
  /** 單價 */
  unitPrice: number;
  /** 小計 (optional, auto-calculated if not provided) */
  amount?: number;
  /** 單位 */
  unit?: string;
  /** 備註 */
  remark?: string;
  /** 課稅別 (default: TAXABLE) */
  taxType?: TaxType;
}

/**
 * Simplified input for issuing an invoice
 */
export interface IssueInvoiceInput {
  /** 訂單編號 */
  orderId: string;
  /** 買方統一編號 (empty or '0000000000' for B2C) */
  buyerTaxId?: string;
  /** 買方名稱 */
  buyerName: string;
  /** 商品明細 */
  items: CreateInvoiceItemInput[];
  /** 買方地址 */
  buyerAddress?: string;
  /** 買方電話 */
  buyerPhone?: string;
  /** 買方信箱 */
  buyerEmail?: string;
  /** 總備註 */
  remark?: string;
  /** 載具類型與號碼 */
  carrier?: {
    type: 'mobile' | 'certificate' | 'amego';
    value: string;
  };
  /** 捐贈碼 */
  donationCode?: string;
  /** 字軌 API 代碼 */
  trackApiCode?: string;
  /** 通關方式 (for zero-rated) */
  customsClearanceMark?: 1 | 2;
  /** 零稅率原因 (for zero-rated) */
  zeroTaxRateReason?: number;
  /** 品牌名稱 */
  brandName?: string;
  /** 明細含稅或未稅 (default: true) */
  pricesIncludeTax?: boolean;
}

/**
 * Invoice Application Service (Legacy)
 *
 * @deprecated Use Zinvoice facade instead:
 * ```typescript
 * const client = Zinvoice.create({ provider: Provider.AMEGO, ... });
 * await client.invoices.issue(invoice);
 * ```
 */
export class InvoiceService {
  constructor(private readonly repository: InvoiceRepository) {}

  /**
   * Issue a new invoice
   */
  async issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
    // Convert input items to domain items
    const items = input.items.map((item) => {
      const unitPrice = Money.create(item.unitPrice);

      if (item.amount !== undefined) {
        return InvoiceItem.create({
          description: item.description,
          quantity: item.quantity,
          unitPrice,
          amount: Money.create(item.amount),
          unit: item.unit,
          remark: item.remark,
          taxType: item.taxType,
        });
      }

      return InvoiceItem.createWithAutoAmount({
        description: item.description,
        quantity: item.quantity,
        unitPrice,
        unit: item.unit,
        remark: item.remark,
        taxType: item.taxType,
      });
    });

    // Build Buyer
    const buyerTaxId = input.buyerTaxId
      ? TaxId.tryCreate(input.buyerTaxId) ?? TaxId.none()
      : TaxId.none();

    const buyer = buyerTaxId.isNone()
      ? Buyer.anonymous(input.buyerName)
      : Buyer.company({
          taxId: buyerTaxId,
          name: input.buyerName,
          address: input.buyerAddress,
          phone: input.buyerPhone,
          email: input.buyerEmail,
        });

    // Build Carrier
    let carrier: Carrier | undefined;
    if (input.carrier) {
      switch (input.carrier.type) {
        case 'mobile':
          carrier = Carrier.mobile(input.carrier.value);
          break;
        case 'certificate':
          carrier = Carrier.certificate(input.carrier.value);
          break;
        case 'amego':
          carrier = Carrier.custom('amego' as any, input.carrier.value);
          break;
      }
    }

    // Build Donation
    const donation = input.donationCode
      ? Donation.tryCreate(input.donationCode)
      : undefined;

    // Create and issue invoice
    const invoice = Invoice.create({
      orderId: OrderId.create(input.orderId),
      buyer,
      items,
      carrier,
      donation,
      remark: input.remark,
      trackApiCode: input.trackApiCode,
      customsClearanceMark: input.customsClearanceMark,
      zeroTaxRateReason: input.zeroTaxRateReason,
      brandName: input.brandName,
      pricesIncludeTax: input.pricesIncludeTax,
    });

    return this.repository.issue(invoice);
  }

  /**
   * Void an invoice
   */
  async void(invoiceNumber: string): Promise<void> {
    const number = InvoiceNumber.create(invoiceNumber);
    return this.repository.void(number);
  }

  /**
   * Query invoice by invoice number
   */
  async findByInvoiceNumber(
    invoiceNumber: string
  ): Promise<InvoiceQueryResult | null> {
    const number = InvoiceNumber.create(invoiceNumber);
    return this.repository.findByInvoiceNumber(number);
  }

  /**
   * Query invoice by order ID
   */
  async findByOrderId(orderId: string): Promise<InvoiceQueryResult | null> {
    return this.repository.findByOrderId(orderId);
  }

  /**
   * Check invoice status
   */
  async getStatus(invoiceNumbers: string[]): Promise<InvoiceStatusResult[]> {
    const numbers = invoiceNumbers.map((n) => InvoiceNumber.create(n));
    return this.repository.getStatus(numbers);
  }

  /**
   * List invoices
   */
  async list(options: ListInvoicesOptions): Promise<{
    invoices: InvoiceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }> {
    return this.repository.list(options);
  }
}
