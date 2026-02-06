import { InvalidCarrierCodeError } from '../../errors/index.js';

/**
 * Carrier types supported by Taiwan e-invoice system
 */
export enum CarrierType {
  /** Mobile barcode (手機條碼) */
  MOBILE = '3J0002',
  /** Natural person certificate (自然人憑證條碼) */
  CERTIFICATE = 'CQ0001',
  /** Amego member carrier (光貿會員載具) */
  AMEGO = 'amego',
  /** No carrier */
  NONE = '',
}

/**
 * Carrier Code Value Object
 *
 * Represents a carrier (載具) for Taiwan e-invoice.
 * Validates format based on carrier type.
 */
export class CarrierCode {
  private constructor(
    private readonly _type: CarrierType | string,
    private readonly _code1: string,
    private readonly _code2: string
  ) {}

  /**
   * Create a CarrierCode for mobile barcode
   * Format: /[A-Z0-9.+-]{7}
   */
  static mobile(code: string): CarrierCode {
    const normalized = code.trim().toUpperCase();

    if (!CarrierCode.isValidMobileBarcode(normalized)) {
      throw new InvalidCarrierCodeError(code, CarrierType.MOBILE);
    }

    return new CarrierCode(CarrierType.MOBILE, normalized, normalized);
  }

  /**
   * Create a CarrierCode for natural person certificate
   * Format: 2 letters + 14 digits
   */
  static certificate(code: string): CarrierCode {
    const normalized = code.trim().toUpperCase();

    if (!CarrierCode.isValidCertificate(normalized)) {
      throw new InvalidCarrierCodeError(code, CarrierType.CERTIFICATE);
    }

    return new CarrierCode(CarrierType.CERTIFICATE, normalized, normalized);
  }

  /**
   * Create a CarrierCode for Amego member
   * Format: a+phone number (a0911222333) or email
   */
  static amego(code: string): CarrierCode {
    const normalized = code.trim().toLowerCase();

    if (!CarrierCode.isValidAmego(normalized)) {
      throw new InvalidCarrierCodeError(code, CarrierType.AMEGO);
    }

    return new CarrierCode(CarrierType.AMEGO, normalized, normalized);
  }

  /**
   * Create a CarrierCode for custom carrier type
   */
  static custom(type: string, code1: string, code2: string): CarrierCode {
    return new CarrierCode(type, code1.trim(), code2.trim());
  }

  /**
   * Create an empty carrier (no carrier)
   */
  static none(): CarrierCode {
    return new CarrierCode(CarrierType.NONE, '', '');
  }

  /**
   * Validate mobile barcode format
   * Format: starts with "/" followed by 7 characters (A-Z, 0-9, +, -, .)
   */
  static isValidMobileBarcode(code: string): boolean {
    return /^\/[A-Z0-9.+-]{7}$/.test(code);
  }

  /**
   * Validate natural person certificate format
   * Format: 2 uppercase letters + 14 digits
   */
  static isValidCertificate(code: string): boolean {
    return /^[A-Z]{2}\d{14}$/.test(code);
  }

  /**
   * Validate Amego member carrier format
   * Format: "a" + phone number or email
   */
  static isValidAmego(code: string): boolean {
    // Phone format: a0911222333
    if (/^a09\d{8}$/.test(code)) {
      return true;
    }
    // Email format
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(code)) {
      return true;
    }
    return false;
  }

  /**
   * Get carrier type (alias for type property)
   */
  getType(): CarrierType | string {
    return this._type;
  }

  /**
   * Get carrier code 1 (顯碼)
   */
  getCode1(): string {
    return this._code1;
  }

  /**
   * Get carrier code 2 (隱碼)
   */
  getCode2(): string {
    return this._code2;
  }

  /**
   * Carrier type for API usage
   */
  get type(): CarrierType | string {
    return this._type;
  }

  /**
   * Carrier value (code1) for API usage
   */
  get value(): string {
    return this._code1;
  }

  /**
   * Check if this is an empty carrier
   */
  isEmpty(): boolean {
    return this._type === CarrierType.NONE;
  }

  /**
   * Check if this is a mobile barcode carrier
   */
  isMobile(): boolean {
    return this._type === CarrierType.MOBILE;
  }

  /**
   * Check equality
   */
  equals(other: CarrierCode): boolean {
    return (
      this._type === other._type &&
      this._code1 === other._code1 &&
      this._code2 === other._code2
    );
  }
}
