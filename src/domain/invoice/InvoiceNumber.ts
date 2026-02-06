import { InvalidInvoiceNumberError } from '../../errors/index.js';

/**
 * Invoice Number (發票號碼) Value Object
 *
 * Format: 2 uppercase letters + 8 digits (e.g., AB12345678)
 */
export class InvoiceNumber {
  private static readonly PATTERN = /^[A-Z]{2}\d{8}$/;

  private constructor(private readonly value: string) {}

  /**
   * Create an InvoiceNumber from string
   * @throws InvalidInvoiceNumberError if format is invalid
   */
  static create(value: string): InvoiceNumber {
    const normalized = value.trim().toUpperCase();

    if (!InvoiceNumber.isValid(normalized)) {
      throw new InvalidInvoiceNumberError(value);
    }

    return new InvoiceNumber(normalized);
  }

  /**
   * Try to create an InvoiceNumber, return null if invalid
   */
  static tryCreate(value: string): InvoiceNumber | null {
    try {
      return InvoiceNumber.create(value);
    } catch {
      return null;
    }
  }

  /**
   * Validate invoice number format
   */
  static isValid(value: string): boolean {
    return InvoiceNumber.PATTERN.test(value);
  }

  /**
   * Get the track (字軌) - first 2 letters
   */
  getTrack(): string {
    return this.value.substring(0, 2);
  }

  /**
   * Get the number part - last 8 digits
   */
  getNumber(): string {
    return this.value.substring(2);
  }

  /**
   * Get the full invoice number
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality
   */
  equals(other: InvoiceNumber): boolean {
    return this.value === other.value;
  }
}
