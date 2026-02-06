import { ValidationError } from '../../errors/index.js';

/**
 * Pagination Value Object
 *
 * 分頁參數。
 */
export class Pagination {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MIN_LIMIT = 20;
  private static readonly MAX_LIMIT = 500;

  private constructor(
    private readonly _page: number,
    private readonly _limit: number
  ) {}

  /**
   * Create pagination with specified page and limit
   */
  static create(options: { page?: number; limit?: number } = {}): Pagination {
    const page = options.page ?? 1;
    const limit = options.limit ?? Pagination.DEFAULT_LIMIT;

    if (page < 1) {
      throw new ValidationError('page', 'Page must be at least 1');
    }

    if (limit < Pagination.MIN_LIMIT || limit > Pagination.MAX_LIMIT) {
      throw new ValidationError(
        'limit',
        `Limit must be between ${Pagination.MIN_LIMIT} and ${Pagination.MAX_LIMIT}`
      );
    }

    return new Pagination(page, limit);
  }

  /**
   * Create first page with default limit
   */
  static first(limit?: number): Pagination {
    return Pagination.create({ page: 1, limit });
  }

  /**
   * Get the page number (1-based)
   */
  get page(): number {
    return this._page;
  }

  /**
   * Get the limit (items per page)
   */
  get limit(): number {
    return this._limit;
  }

  /**
   * Get the offset (0-based, for SQL queries)
   */
  get offset(): number {
    return (this._page - 1) * this._limit;
  }

  /**
   * Create next page pagination
   */
  next(): Pagination {
    return new Pagination(this._page + 1, this._limit);
  }

  /**
   * Create previous page pagination (min page 1)
   */
  previous(): Pagination {
    return new Pagination(Math.max(1, this._page - 1), this._limit);
  }
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Items on current page */
  items: T[];
  /** Total number of items */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Create a paginated result
 */
export function createPaginatedResult<T>(
  items: T[],
  totalCount: number,
  pagination: Pagination
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / pagination.limit);
  return {
    items,
    totalCount,
    totalPages,
    currentPage: pagination.page,
    pageSize: pagination.limit,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}
