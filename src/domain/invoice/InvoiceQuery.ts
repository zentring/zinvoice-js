import { DateRange, DateType, LocalDate } from '../shared/LocalDate.js';
import { Pagination } from '../shared/Pagination.js';

/**
 * Invoice Query Value Object
 *
 * 發票查詢條件。
 */
export class InvoiceQuery {
  private constructor(
    private readonly _dateRange: DateRange,
    private readonly _dateType: DateType,
    private readonly _pagination: Pagination
  ) {}

  /**
   * Create a query with all parameters
   */
  static create(options: {
    dateRange: DateRange;
    dateType?: DateType;
    pagination?: Pagination;
  }): InvoiceQuery {
    return new InvoiceQuery(
      options.dateRange,
      options.dateType ?? DateType.INVOICE_DATE,
      options.pagination ?? Pagination.first()
    );
  }

  /**
   * Create a query by invoice date
   */
  static byInvoiceDate(
    dateRange: DateRange,
    pagination?: Pagination
  ): InvoiceQuery {
    return InvoiceQuery.create({
      dateRange,
      dateType: DateType.INVOICE_DATE,
      pagination,
    });
  }

  /**
   * Create a query by create date
   */
  static byCreateDate(
    dateRange: DateRange,
    pagination?: Pagination
  ): InvoiceQuery {
    return InvoiceQuery.create({
      dateRange,
      dateType: DateType.CREATE_DATE,
      pagination,
    });
  }

  /**
   * Create a query for a specific month
   */
  static forMonth(year: number, month: number, pagination?: Pagination): InvoiceQuery {
    const start = LocalDate.of(year, month, 1);
    // Get last day of month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const lastDay = new Date(nextYear, nextMonth - 1, 0).getDate();
    const end = LocalDate.of(year, month, lastDay);

    return InvoiceQuery.create({
      dateRange: DateRange.between(start, end),
      dateType: DateType.INVOICE_DATE,
      pagination,
    });
  }

  /**
   * Create a query for a specific year
   */
  static forYear(year: number, pagination?: Pagination): InvoiceQuery {
    return InvoiceQuery.create({
      dateRange: DateRange.between(
        LocalDate.of(year, 1, 1),
        LocalDate.of(year, 12, 31)
      ),
      dateType: DateType.INVOICE_DATE,
      pagination,
    });
  }

  /**
   * Get the date range
   */
  get dateRange(): DateRange {
    return this._dateRange;
  }

  /**
   * Get the date type
   */
  get dateType(): DateType {
    return this._dateType;
  }

  /**
   * Get the pagination
   */
  get pagination(): Pagination {
    return this._pagination;
  }

  /**
   * Create a new query with different pagination
   */
  withPagination(pagination: Pagination): InvoiceQuery {
    return new InvoiceQuery(this._dateRange, this._dateType, pagination);
  }

  /**
   * Create a query for the next page
   */
  nextPage(): InvoiceQuery {
    return this.withPagination(this._pagination.next());
  }
}
