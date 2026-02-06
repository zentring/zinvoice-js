import { Money } from '../shared/Money.js';
import { TaxType } from '../shared/TaxType.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Invoice Item properties for creation
 */
export interface InvoiceItemProps {
  /** 品名 (max 256 chars) */
  description: string;
  /** 數量 (up to 7 decimal places) */
  quantity: number;
  /** 單價 (up to 7 decimal places) */
  unitPrice: Money;
  /** 小計 (up to 7 decimal places) */
  amount: Money;
  /** 單位 (max 6 chars, optional) */
  unit?: string;
  /** 備註 (max 40 chars, optional) */
  remark?: string;
  /** 課稅別 */
  taxType?: TaxType;
}

/**
 * Invoice Item Entity
 *
 * Represents a line item in an invoice.
 */
export class InvoiceItem {
  private constructor(
    private readonly _description: string,
    private readonly _quantity: number,
    private readonly _unitPrice: Money,
    private readonly _amount: Money,
    private readonly _unit: string,
    private readonly _remark: string,
    private readonly _taxType: TaxType
  ) {}

  /**
   * Create an InvoiceItem
   */
  static create(props: InvoiceItemProps): InvoiceItem {
    // Validate description
    if (!props.description || props.description.trim().length === 0) {
      throw new ValidationError('description', 'Description is required');
    }
    if (props.description.length > 256) {
      throw new ValidationError(
        'description',
        'Description must not exceed 256 characters'
      );
    }

    // Validate quantity
    if (props.quantity === 0) {
      throw new ValidationError('quantity', 'Quantity cannot be zero');
    }

    // Validate unit
    if (props.unit && props.unit.length > 6) {
      throw new ValidationError('unit', 'Unit must not exceed 6 characters');
    }

    // Validate remark
    if (props.remark && props.remark.length > 40) {
      throw new ValidationError('remark', 'Remark must not exceed 40 characters');
    }

    return new InvoiceItem(
      props.description.trim(),
      props.quantity,
      props.unitPrice,
      props.amount,
      props.unit?.trim() ?? '',
      props.remark?.trim() ?? '',
      props.taxType ?? TaxType.TAXABLE
    );
  }

  /**
   * Create an InvoiceItem with auto-calculated amount
   */
  static createWithAutoAmount(
    props: Omit<InvoiceItemProps, 'amount'>
  ): InvoiceItem {
    const amount = props.unitPrice.multiply(props.quantity);
    return InvoiceItem.create({ ...props, amount });
  }

  // Getters
  get description(): string {
    return this._description;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get amount(): Money {
    return this._amount;
  }

  get unit(): string {
    return this._unit;
  }

  get remark(): string {
    return this._remark;
  }

  get taxType(): TaxType {
    return this._taxType;
  }

  /**
   * Check if this is a discount item (negative amount)
   */
  isDiscount(): boolean {
    return this._amount.isNegative();
  }
}
