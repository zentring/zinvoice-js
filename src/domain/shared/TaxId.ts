import { InvalidTaxIdError } from '../../errors/index.js';

/**
 * Tax ID (統一編號) Value Object
 *
 * Validates Taiwan business tax ID using the official checksum algorithm.
 * Reference: https://www.fia.gov.tw/singlehtml/3?cntId=c4d9cff38c8642ef8872774ee9987283
 */
export class TaxId {
  private static readonly WEIGHTS = [1, 2, 1, 2, 1, 2, 4, 1];
  private static readonly NO_TAX_ID = '0000000000';

  private constructor(private readonly value: string) {}

  /**
   * Create a TaxId from string
   * @throws InvalidTaxIdError if the tax ID is invalid
   */
  static create(value: string): TaxId {
    const normalized = value.trim();

    if (!TaxId.isValid(normalized)) {
      throw new InvalidTaxIdError(value);
    }

    return new TaxId(normalized);
  }

  /**
   * Create a "no tax ID" placeholder (0000000000)
   * Used for B2C invoices without buyer's tax ID
   */
  static none(): TaxId {
    return new TaxId(TaxId.NO_TAX_ID);
  }

  /**
   * Try to create a TaxId, return null if invalid
   */
  static tryCreate(value: string): TaxId | null {
    try {
      return TaxId.create(value);
    } catch {
      return null;
    }
  }

  /**
   * Validate a tax ID string
   */
  static isValid(value: string): boolean {
    // Allow the special "no tax ID" value
    if (value === TaxId.NO_TAX_ID) {
      return true;
    }

    // Must be exactly 8 digits
    if (!/^\d{8}$/.test(value)) {
      return false;
    }

    return TaxId.validateChecksum(value);
  }

  /**
   * Validate checksum using the official algorithm
   *
   * Algorithm:
   * 1. Multiply each digit by its weight [1,2,1,2,1,2,4,1]
   * 2. For each product, sum its digits (e.g., 18 -> 1+8=9)
   * 3. Sum all results
   * 4. If 7th digit is 7, check both (sum % 10 === 0) or ((sum + 1) % 10 === 0)
   * 5. Otherwise, check (sum % 10 === 0)
   */
  private static validateChecksum(value: string): boolean {
    const digits = value.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      const product = digits[i]! * TaxId.WEIGHTS[i]!;
      // Sum digits of product (e.g., 18 -> 1 + 8 = 9)
      sum += Math.floor(product / 10) + (product % 10);
    }

    // Special case: if 7th digit (index 6) is 7
    if (digits[6] === 7) {
      return sum % 10 === 0 || (sum + 1) % 10 === 0;
    }

    return sum % 10 === 0;
  }

  /**
   * Check if this is a "no tax ID" placeholder
   */
  isNone(): boolean {
    return this.value === TaxId.NO_TAX_ID;
  }

  /**
   * Get the string value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another TaxId
   */
  equals(other: TaxId): boolean {
    return this.value === other.value;
  }
}
