import { ValidationError } from '../../errors/index.js';

/**
 * Donation Value Object
 *
 * 發票捐贈資訊（愛心碼）。
 * 愛心碼為 3-7 碼數字。
 */
export class Donation {
  private constructor(private readonly _code: string) {}

  /**
   * Create a "no donation" instance
   */
  static none(): Donation {
    return new Donation('');
  }

  /**
   * Create a donation with code (愛心碼)
   *
   * @param code The donation code (3-7 digits)
   */
  static code(code: string): Donation {
    const trimmed = code?.trim();

    if (!trimmed) {
      throw new ValidationError('donation', 'Donation code is required');
    }

    // 愛心碼格式: 3-7 碼數字
    if (!/^\d{3,7}$/.test(trimmed)) {
      throw new ValidationError(
        'donation',
        'Invalid donation code format. Expected: 3-7 digits'
      );
    }

    return new Donation(trimmed);
  }

  /**
   * Try to create a Donation, returns none() if invalid
   */
  static tryCreate(code: string): Donation {
    try {
      return Donation.code(code);
    } catch {
      return Donation.none();
    }
  }

  /**
   * Get the donation code
   */
  get code(): string {
    return this._code;
  }

  /**
   * Check if this is an empty donation (not donating)
   */
  get isEmpty(): boolean {
    return this._code.length === 0;
  }

  /**
   * Check if this invoice is being donated
   */
  get isDonating(): boolean {
    return this._code.length > 0;
  }

  /**
   * Get the string value
   */
  toString(): string {
    return this._code;
  }
}
