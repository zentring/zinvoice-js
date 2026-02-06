import { ValidationError } from '../../errors/index.js';

/**
 * Order ID Value Object
 *
 * 訂單編號，用於識別發票對應的訂單。
 * 最大長度 40 字元，不可為空。
 */
export class OrderId {
  private static readonly MAX_LENGTH = 40;

  private constructor(private readonly value: string) {}

  /**
   * Create an OrderId
   * @throws ValidationError if invalid
   */
  static create(value: string): OrderId {
    const trimmed = value?.trim();

    if (!trimmed || trimmed.length === 0) {
      throw new ValidationError('orderId', 'Order ID is required');
    }

    if (trimmed.length > OrderId.MAX_LENGTH) {
      throw new ValidationError(
        'orderId',
        `Order ID must not exceed ${OrderId.MAX_LENGTH} characters`
      );
    }

    return new OrderId(trimmed);
  }

  /**
   * Try to create an OrderId, returns null if invalid
   */
  static tryCreate(value: string): OrderId | null {
    try {
      return OrderId.create(value);
    } catch {
      return null;
    }
  }

  /**
   * Get the string value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality
   */
  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
