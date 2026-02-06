import { InvoiceNumber } from '../invoice/InvoiceNumber.js';
import { AllowanceItem } from './AllowanceItem.js';
import { TaxId } from '../shared/TaxId.js';
import { Money } from '../shared/Money.js';
import { TaxType, TAX_RATE } from '../shared/TaxType.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Allowance status
 */
export enum AllowanceStatus {
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
 * Allowance type based on MIG
 */
export enum AllowanceType {
  /** B2C 存證折讓開立 */
  B2C_ISSUE = 'C0701',
  /** B2C 存證折讓作廢 */
  B2C_VOID = 'C0801',
  /** B2B 存證折讓開立 */
  B2B_ISSUE = 'A0701',
  /** B2B 存證折讓作廢 */
  B2B_VOID = 'A0801',
}

/**
 * Properties for creating an Allowance
 */
export interface CreateAllowanceProps {
  /** 原發票號碼 */
  originalInvoiceNumber: InvoiceNumber;
  /** 原發票日期 */
  originalInvoiceDate: Date;
  /** 買方統一編號 */
  buyerTaxId: TaxId;
  /** 賣方統一編號 */
  sellerTaxId: TaxId;
  /** 折讓明細 */
  items: AllowanceItem[];
  /** 買方名稱 (optional) */
  buyerName?: string;
  /** 賣方名稱 (optional) */
  sellerName?: string;
  /** 明細含稅或未稅 (default: true = 含稅) */
  pricesIncludeTax?: boolean;
}

/**
 * Allowance Aggregate Root
 *
 * Represents an allowance (折讓) in Taiwan's electronic invoice system.
 * Used for partial refunds or corrections to invoices.
 */
export class Allowance {
  private _allowanceNumber?: string;
  private _allowanceDate?: Date;

  private constructor(
    private readonly _originalInvoiceNumber: InvoiceNumber,
    private readonly _originalInvoiceDate: Date,
    private readonly _buyerTaxId: TaxId,
    private readonly _sellerTaxId: TaxId,
    private readonly _buyerName: string,
    private readonly _sellerName: string,
    private readonly _items: AllowanceItem[],
    private readonly _taxType: TaxType,
    private readonly _pricesIncludeTax: boolean = true,
    private _status: AllowanceStatus = AllowanceStatus.PENDING,
    private _type: AllowanceType = AllowanceType.B2C_ISSUE
  ) {}

  /**
   * Create a new Allowance
   */
  static create(props: CreateAllowanceProps): Allowance {
    // Validate items
    if (!props.items || props.items.length === 0) {
      throw new ValidationError('items', 'At least one item is required');
    }
    if (props.items.length > 9999) {
      throw new ValidationError('items', 'Maximum 9999 items allowed');
    }

    // Determine tax type from items
    const taxType = Allowance.determineTaxType(props.items);

    // Determine allowance type (B2B or B2C)
    const isB2B = !props.buyerTaxId.isNone();

    return new Allowance(
      props.originalInvoiceNumber,
      props.originalInvoiceDate,
      props.buyerTaxId,
      props.sellerTaxId,
      props.buyerName?.trim() ?? '',
      props.sellerName?.trim() ?? '',
      props.items,
      taxType,
      props.pricesIncludeTax ?? true,
      AllowanceStatus.PENDING,
      isB2B ? AllowanceType.B2B_ISSUE : AllowanceType.B2C_ISSUE
    );
  }

  /**
   * Determine overall tax type from items
   */
  private static determineTaxType(items: AllowanceItem[]): TaxType {
    const taxTypes = new Set(items.map((item) => item.taxType));

    if (taxTypes.size === 1) {
      return items[0]!.taxType;
    }

    // Mixed tax types
    return TaxType.MIXED;
  }

  // --- Calculated amounts ---

  /**
   * Calculate taxable sales amount (應稅銷售額)
   */
  calculateTaxableAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.TAXABLE)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate free tax sales amount (免稅銷售額)
   */
  calculateFreeTaxAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.TAX_EXEMPT)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate zero tax sales amount (零稅率銷售額)
   */
  calculateZeroTaxAmount(): Money {
    return this._items
      .filter((item) => item.taxType === TaxType.ZERO_RATED)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate tax amount (營業稅額)
   */
  calculateTaxAmount(): Money {
    const taxableAmount = this.calculateTaxableAmount();

    if (this._pricesIncludeTax) {
      // Tax included: tax = taxableAmount - round(taxableAmount / 1.05)
      const beforeTax = taxableAmount.divide(1 + TAX_RATE).round();
      return taxableAmount.subtract(beforeTax);
    } else {
      // Tax excluded: tax = round(taxableAmount * 0.05)
      return taxableAmount.multiply(TAX_RATE).round();
    }
  }

  /**
   * Calculate total amount (總計)
   */
  calculateTotalAmount(): Money {
    const taxableAmount = this.calculateTaxableAmount();
    const freeTaxAmount = this.calculateFreeTaxAmount();
    const zeroTaxAmount = this.calculateZeroTaxAmount();
    const taxAmount = this.calculateTaxAmount();

    if (this._pricesIncludeTax) {
      // Prices include tax
      return taxableAmount.add(freeTaxAmount).add(zeroTaxAmount);
    } else {
      // Prices exclude tax
      return taxableAmount
        .add(freeTaxAmount)
        .add(zeroTaxAmount)
        .add(taxAmount);
    }
  }

  // --- State mutations ---

  /**
   * Set allowance number after issuing
   */
  setAllowanceNumber(number: string, date: Date): void {
    this._allowanceNumber = number;
    this._allowanceDate = date;
  }

  /**
   * Update status
   */
  updateStatus(status: AllowanceStatus): void {
    this._status = status;
  }

  /**
   * Mark as voided
   */
  markAsVoided(): void {
    this._type = this.isB2B ? AllowanceType.B2B_VOID : AllowanceType.B2C_VOID;
  }

  // --- Getters ---

  get originalInvoiceNumber(): InvoiceNumber {
    return this._originalInvoiceNumber;
  }

  get originalInvoiceDate(): Date {
    return this._originalInvoiceDate;
  }

  get allowanceNumber(): string | undefined {
    return this._allowanceNumber;
  }

  get allowanceDate(): Date | undefined {
    return this._allowanceDate;
  }

  get buyerTaxId(): TaxId {
    return this._buyerTaxId;
  }

  get sellerTaxId(): TaxId {
    return this._sellerTaxId;
  }

  get buyerName(): string {
    return this._buyerName;
  }

  get sellerName(): string {
    return this._sellerName;
  }

  get items(): readonly AllowanceItem[] {
    return this._items;
  }

  get taxType(): TaxType {
    return this._taxType;
  }

  get pricesIncludeTax(): boolean {
    return this._pricesIncludeTax;
  }

  get status(): AllowanceStatus {
    return this._status;
  }

  get type(): AllowanceType {
    return this._type;
  }

  /**
   * Check if this is a B2B allowance (has buyer tax ID)
   */
  get isB2B(): boolean {
    return !this._buyerTaxId.isNone();
  }

  /**
   * Check if allowance has been issued
   */
  get isIssued(): boolean {
    return this._allowanceNumber !== undefined;
  }
}
