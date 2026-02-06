import { InvalidMoneyError } from '../../errors/index.js';

/**
 * Money Value Object
 *
 * Handles monetary amounts with proper precision for Taiwan e-invoice.
 * Supports up to 7 decimal places as per API specification.
 */
export class Money {
  private constructor(private readonly amount: number) {}

  /**
   * Create Money from a number
   * @throws InvalidMoneyError if the amount is invalid
   */
  static create(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new InvalidMoneyError(amount, 'Amount must be a finite number');
    }

    return new Money(amount);
  }

  /**
   * Create Money representing zero
   */
  static zero(): Money {
    return new Money(0);
  }

  /**
   * Create Money from cents (integer)
   */
  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError(cents, 'Cents must be an integer');
    }
    return new Money(cents / 100);
  }

  /**
   * Get the numeric value
   */
  toNumber(): number {
    return this.amount;
  }

  /**
   * Get value rounded to integer
   */
  toInteger(): number {
    return Math.round(this.amount);
  }

  /**
   * Get value in cents (integer)
   */
  toCents(): number {
    return Math.round(this.amount * 100);
  }

  /**
   * Add another Money value
   */
  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  /**
   * Subtract another Money value
   */
  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  /**
   * Divide by a divisor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new InvalidMoneyError(this.amount, 'Cannot divide by zero');
    }
    return new Money(this.amount / divisor);
  }

  /**
   * Check if this amount is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if this amount is positive
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if this amount is negative
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(Math.abs(this.amount));
  }

  /**
   * Round to specified decimal places
   */
  round(decimals: number = 0): Money {
    const factor = Math.pow(10, decimals);
    return new Money(Math.round(this.amount * factor) / factor);
  }

  /**
   * Format as string with specified decimal places
   */
  format(decimals: number = 2): string {
    return this.amount.toFixed(decimals);
  }

  /**
   * Check equality with another Money
   */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  /**
   * Compare with another Money
   * Returns: -1 if less, 0 if equal, 1 if greater
   */
  compareTo(other: Money): number {
    if (this.amount < other.amount) return -1;
    if (this.amount > other.amount) return 1;
    return 0;
  }

  toString(): string {
    return this.amount.toString();
  }
}
