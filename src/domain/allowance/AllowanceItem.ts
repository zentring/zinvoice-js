import { Money } from '../shared/Money.js';
import { TaxType } from '../shared/TaxType.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Allowance Item properties for creation
 */
export interface AllowanceItemProps {
  /** 原發票品名 (max 256 chars) */
  originalDescription: string;
  /** 數量 (up to 7 decimal places) */
  quantity: number;
  /** 單價 (up to 7 decimal places) */
  unitPrice: Money;
  /** 金額 (up to 7 decimal places) */
  amount: Money;
  /** 單位 (max 6 chars, optional) */
  unit?: string;
  /** 課稅別 */
  taxType?: TaxType;
}

/**
 * Allowance Item Entity
 *
 * Represents a line item in an allowance (折讓明細).
 */
export class AllowanceItem {
  private constructor(
    private readonly _originalDescription: string,
    private readonly _quantity: number,
    private readonly _unitPrice: Money,
    private readonly _amount: Money,
    private readonly _unit: string,
    private readonly _taxType: TaxType
  ) {}

  /**
   * Create an AllowanceItem
   */
  static create(props: AllowanceItemProps): AllowanceItem {
    // Validate description
    if (
      !props.originalDescription ||
      props.originalDescription.trim().length === 0
    ) {
      throw new ValidationError(
        'originalDescription',
        'Original description is required'
      );
    }
    if (props.originalDescription.length > 256) {
      throw new ValidationError(
        'originalDescription',
        'Original description must not exceed 256 characters'
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

    return new AllowanceItem(
      props.originalDescription.trim(),
      props.quantity,
      props.unitPrice,
      props.amount,
      props.unit?.trim() ?? '',
      props.taxType ?? TaxType.TAXABLE
    );
  }

  /**
   * Create an AllowanceItem with auto-calculated amount
   */
  static createWithAutoAmount(
    props: Omit<AllowanceItemProps, 'amount'>
  ): AllowanceItem {
    const amount = props.unitPrice.multiply(props.quantity);
    return AllowanceItem.create({ ...props, amount });
  }

  // Getters
  get originalDescription(): string {
    return this._originalDescription;
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

  get taxType(): TaxType {
    return this._taxType;
  }
}
