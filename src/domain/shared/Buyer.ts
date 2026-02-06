import { TaxId } from './TaxId.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Buyer type
 */
export enum BuyerType {
  /** 個人消費者 (B2C) */
  ANONYMOUS = 'anonymous',
  /** 公司行號 (B2B) */
  COMPANY = 'company',
}

/**
 * Company buyer properties
 */
export interface CompanyBuyerProps {
  taxId: TaxId;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * Buyer Value Object
 *
 * 發票買方資訊。可以是個人消費者 (B2C) 或公司行號 (B2B)。
 */
export class Buyer {
  private constructor(
    private readonly _type: BuyerType,
    private readonly _taxId: TaxId,
    private readonly _name: string,
    private readonly _address: string,
    private readonly _phone: string,
    private readonly _email: string
  ) {}

  /**
   * Create an anonymous buyer (B2C)
   * @param name Buyer name (default: '消費者')
   */
  static anonymous(name?: string): Buyer {
    // If name is explicitly provided (including empty string), validate it
    // If name is undefined/not provided, use default
    const trimmedName = name === undefined ? '消費者' : name.trim();
    Buyer.validateName(trimmedName);

    return new Buyer(
      BuyerType.ANONYMOUS,
      TaxId.none(),
      trimmedName,
      '',
      '',
      ''
    );
  }

  /**
   * Create a company buyer (B2B)
   */
  static company(props: CompanyBuyerProps): Buyer {
    const name = props.name?.trim();
    Buyer.validateName(name);

    if (props.taxId.isNone()) {
      throw new ValidationError('taxId', 'Company buyer must have a tax ID');
    }

    return new Buyer(
      BuyerType.COMPANY,
      props.taxId,
      name,
      props.address?.trim() ?? '',
      props.phone?.trim() ?? '',
      props.email?.trim() ?? ''
    );
  }

  /**
   * Validate buyer name
   */
  private static validateName(name: string): void {
    if (!name || name.length === 0) {
      throw new ValidationError('buyerName', 'Buyer name is required');
    }

    const invalidNames = ['0', '00', '000', '0000'];
    if (invalidNames.includes(name)) {
      throw new ValidationError(
        'buyerName',
        'Buyer name cannot be 0, 00, 000, or 0000'
      );
    }
  }

  /**
   * Get the buyer type
   */
  get type(): BuyerType {
    return this._type;
  }

  /**
   * Get the tax ID
   */
  get taxId(): TaxId {
    return this._taxId;
  }

  /**
   * Get the name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the address
   */
  get address(): string {
    return this._address;
  }

  /**
   * Get the phone
   */
  get phone(): string {
    return this._phone;
  }

  /**
   * Get the email
   */
  get email(): string {
    return this._email;
  }

  /**
   * Check if this is a B2B buyer (company)
   */
  get isCompany(): boolean {
    return this._type === BuyerType.COMPANY;
  }

  /**
   * Check if this is a B2C buyer (anonymous)
   */
  get isAnonymous(): boolean {
    return this._type === BuyerType.ANONYMOUS;
  }
}
