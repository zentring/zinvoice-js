import { InvoiceNumber } from './InvoiceNumber.js';
import { InvoiceItem } from './InvoiceItem.js';
import { Money } from '../shared/Money.js';
import { OrderId } from '../shared/OrderId.js';
import { Buyer } from '../shared/Buyer.js';
import { Carrier } from '../shared/Carrier.js';
import { Donation } from '../shared/Donation.js';
import {
  TaxType,
  ZeroTaxRateReason,
  CustomsClearanceMark,
} from '../shared/TaxType.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Invoice status for upload to government
 */
export enum InvoiceStatus {
  /** 待處理 */
  PENDING = 1,
  /** 上傳中 */
  UPLOADING = 2,
  /** 已上傳 */
  UPLOADED = 3,
  /** 處理中 */
  PROCESSING = 31,
  /** 處理完成/待確認 */
  AWAITING_CONFIRMATION = 32,
  /** 錯誤 */
  ERROR = 91,
  /** 完成 */
  COMPLETED = 99,
}

/**
 * Invoice type based on MIG
 */
export enum InvoiceType {
  /** B2C 存證發票開立 */
  B2C_ISSUE = 'C0401',
  /** B2C 存證發票作廢 */
  B2C_VOID = 'C0501',
  /** B2C 存證發票註銷 */
  B2C_CANCEL = 'C0701',
  /** B2B 存證發票開立 */
  B2B_ISSUE = 'A0401',
  /** B2B 存證發票作廢 */
  B2B_VOID = 'A0501',
}

/**
 * Properties for creating an Invoice
 */
export interface CreateInvoiceProps {
  /** 訂單編號 */
  orderId: OrderId;
  /** 買方資訊 */
  buyer: Buyer;
  /** 商品明細 */
  items: InvoiceItem[];
  /** 載具 (optional) */
  carrier?: Carrier;
  /** 捐贈 (optional) */
  donation?: Donation;
  /** 總備註 (max 200 chars, optional) */
  remark?: string;
  /** 指定字軌代碼 (optional) */
  trackApiCode?: string;
  /** 通關方式 (required for zero-rated) */
  customsClearanceMark?: CustomsClearanceMark;
  /** 零稅率原因 (required for zero-rated) */
  zeroTaxRateReason?: ZeroTaxRateReason;
  /** 品牌名稱 (optional) */
  brandName?: string;
  /** 明細含稅或未稅 (default: true = 含稅) */
  pricesIncludeTax?: boolean;
}

/**
 * Invoice Aggregate Root
 *
 * Represents an e-invoice in Taiwan's electronic invoice system.
 */
export class Invoice {
  private _invoiceNumber?: InvoiceNumber;
  private _invoiceTime?: Date;
  private _randomNumber?: string;

  private constructor(
    private readonly _orderId: OrderId,
    private readonly _buyer: Buyer,
    private readonly _items: InvoiceItem[],
    private readonly _carrier: Carrier,
    private readonly _donation: Donation,
    private readonly _remark: string,
    private readonly _trackApiCode: string,
    private readonly _taxType: TaxType,
    private readonly _customsClearanceMark?: CustomsClearanceMark,
    private readonly _zeroTaxRateReason?: ZeroTaxRateReason,
    private readonly _brandName?: string,
    private readonly _pricesIncludeTax: boolean = true,
    private _status: InvoiceStatus = InvoiceStatus.PENDING,
    private _type: InvoiceType = InvoiceType.B2C_ISSUE
  ) {}

  /**
   * Create a new Invoice
   */
  static create(props: CreateInvoiceProps): Invoice {
    // Validate items
    if (!props.items || props.items.length === 0) {
      throw new ValidationError('items', 'At least one item is required');
    }
    if (props.items.length > 9999) {
      throw new ValidationError('items', 'Maximum 9999 items allowed');
    }

    // Validate remark
    if (props.remark && props.remark.length > 200) {
      throw new ValidationError(
        'remark',
        'Remark must not exceed 200 characters'
      );
    }

    // Determine tax type from items
    const taxType = Invoice.determineTaxType(props.items);

    // Validate zero-rated requirements
    if (taxType === TaxType.ZERO_RATED) {
      if (!props.customsClearanceMark) {
        throw new ValidationError(
          'customsClearanceMark',
          'Customs clearance mark is required for zero-rated invoices'
        );
      }
      if (!props.zeroTaxRateReason) {
        throw new ValidationError(
          'zeroTaxRateReason',
          'Zero tax rate reason is required for zero-rated invoices'
        );
      }
    }

    // Validate carrier and donation exclusivity
    const hasCarrier = props.carrier && !props.carrier.isEmpty;
    const hasDonation = props.donation && props.donation.isDonating;
    if (hasCarrier && hasDonation) {
      throw new ValidationError(
        'carrier',
        'Cannot have both carrier and donation on the same invoice'
      );
    }

    // Determine invoice type (B2B or B2C)
    const isB2B = props.buyer.isCompany;

    return new Invoice(
      props.orderId,
      props.buyer,
      props.items,
      props.carrier ?? Carrier.none(),
      props.donation ?? Donation.none(),
      props.remark?.trim() ?? '',
      props.trackApiCode?.trim() ?? '',
      taxType,
      props.customsClearanceMark,
      props.zeroTaxRateReason,
      props.brandName?.trim(),
      props.pricesIncludeTax ?? true,
      InvoiceStatus.PENDING,
      isB2B ? InvoiceType.B2B_ISSUE : InvoiceType.B2C_ISSUE
    );
  }

  /**
   * Determine overall tax type from items
   */
  private static determineTaxType(items: InvoiceItem[]): TaxType {
    const taxTypes = new Set(items.map((item) => item.taxType));

    if (taxTypes.size === 1) {
      return items[0]!.taxType;
    }

    // Mixed tax types
    return TaxType.MIXED;
  }

  // --- Calculated amounts ---

  /**
   * Calculate sales amount (應稅銷售額)
   */
  calculateSalesAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.TAXABLE)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate free tax sales amount (免稅銷售額)
   */
  calculateFreeTaxSalesAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.TAX_EXEMPT)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate zero tax sales amount (零稅率銷售額)
   */
  calculateZeroTaxSalesAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.ZERO_RATED)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate tax amount (營業稅額)
   */
  calculateTaxAmount(): Money {
    // B2C without tax ID: tax amount is always 0
    if (this._buyer.isAnonymous) {
      return Money.zero();
    }

    // B2B: calculate 5% tax
    const salesAmount = this.calculateSalesAmount();

    if (this._pricesIncludeTax) {
      // Tax included: tax = salesAmount - round(salesAmount / 1.05)
      const beforeTax = salesAmount.divide(1.05).round();
      return salesAmount.subtract(beforeTax);
    } else {
      // Tax excluded: tax = round(salesAmount * 0.05)
      return salesAmount.multiply(0.05).round();
    }
  }

  /**
   * Calculate total amount (總計)
   */
  calculateTotalAmount(): Money {
    const salesAmount = this.calculateSalesAmount();
    const freeTaxAmount = this.calculateFreeTaxSalesAmount();
    const zeroTaxAmount = this.calculateZeroTaxSalesAmount();
    const taxAmount = this.calculateTaxAmount();

    if (this._pricesIncludeTax) {
      // Prices include tax
      return salesAmount.add(freeTaxAmount).add(zeroTaxAmount);
    } else {
      // Prices exclude tax
      return salesAmount
        .add(freeTaxAmount)
        .add(zeroTaxAmount)
        .add(taxAmount);
    }
  }

  // --- State mutations ---

  /**
   * Set invoice number after issuing
   */
  setInvoiceNumber(
    number: InvoiceNumber,
    time: Date,
    randomNumber: string
  ): void {
    this._invoiceNumber = number;
    this._invoiceTime = time;
    this._randomNumber = randomNumber;
  }

  /**
   * Update status
   */
  updateStatus(status: InvoiceStatus): void {
    this._status = status;
  }

  /**
   * Mark as voided
   */
  markAsVoided(): void {
    this._type = this.isB2B ? InvoiceType.B2B_VOID : InvoiceType.B2C_VOID;
  }

  // --- Getters ---

  get orderId(): OrderId {
    return this._orderId;
  }

  get invoiceNumber(): InvoiceNumber | undefined {
    return this._invoiceNumber;
  }

  get invoiceTime(): Date | undefined {
    return this._invoiceTime;
  }

  get randomNumber(): string | undefined {
    return this._randomNumber;
  }

  get buyer(): Buyer {
    return this._buyer;
  }

  get carrier(): Carrier {
    return this._carrier;
  }

  get donation(): Donation {
    return this._donation;
  }

  get remark(): string {
    return this._remark;
  }

  get trackApiCode(): string {
    return this._trackApiCode;
  }

  get items(): readonly InvoiceItem[] {
    return this._items;
  }

  get taxType(): TaxType {
    return this._taxType;
  }

  get customsClearanceMark(): CustomsClearanceMark | undefined {
    return this._customsClearanceMark;
  }

  get zeroTaxRateReason(): ZeroTaxRateReason | undefined {
    return this._zeroTaxRateReason;
  }

  get brandName(): string | undefined {
    return this._brandName;
  }

  get pricesIncludeTax(): boolean {
    return this._pricesIncludeTax;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  get type(): InvoiceType {
    return this._type;
  }

  /**
   * Check if this is a B2B invoice (has buyer tax ID)
   */
  get isB2B(): boolean {
    return this._buyer.isCompany;
  }

  /**
   * Check if invoice has been issued
   */
  get isIssued(): boolean {
    return this._invoiceNumber !== undefined;
  }

  /**
   * Check if invoice has carrier
   */
  get hasCarrier(): boolean {
    return !this._carrier.isEmpty;
  }

  /**
   * Check if invoice is donated
   */
  get isDonated(): boolean {
    return this._donation.isDonating;
  }

  // --- Backward compatibility getters (deprecated) ---

  /** @deprecated Use buyer.taxId instead */
  get buyerTaxId() {
    return this._buyer.taxId;
  }

  /** @deprecated Use buyer.name instead */
  get buyerName(): string {
    return this._buyer.name;
  }

  /** @deprecated Use buyer.address instead */
  get buyerAddress(): string {
    return this._buyer.address;
  }

  /** @deprecated Use buyer.phone instead */
  get buyerPhone(): string {
    return this._buyer.phone;
  }

  /** @deprecated Use buyer.email instead */
  get buyerEmail(): string {
    return this._buyer.email;
  }

  /** @deprecated Use donation.code instead */
  get donationCode(): string {
    return this._donation.code;
  }
}
