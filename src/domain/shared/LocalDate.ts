import { ValidationError } from '../../errors/index.js';

/**
 * LocalDate Value Object
 *
 * 表示日期（不含時間），類似 Java 的 LocalDate。
 * 內部使用 YYYYMMDD 格式儲存。
 */
export class LocalDate {
  private constructor(
    private readonly _year: number,
    private readonly _month: number,
    private readonly _day: number
  ) {}

  /**
   * Create a LocalDate from year, month, day
   */
  static of(year: number, month: number, day: number): LocalDate {
    if (month < 1 || month > 12) {
      throw new ValidationError('month', 'Month must be between 1 and 12');
    }
    if (day < 1 || day > 31) {
      throw new ValidationError('day', 'Day must be between 1 and 31');
    }
    return new LocalDate(year, month, day);
  }

  /**
   * Create a LocalDate from a JavaScript Date
   */
  static fromDate(date: Date): LocalDate {
    return new LocalDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  }

  /**
   * Create a LocalDate from YYYYMMDD string or number
   */
  static parse(value: string | number): LocalDate {
    const str = String(value);
    if (str.length !== 8) {
      throw new ValidationError('date', 'Date must be in YYYYMMDD format');
    }

    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10);
    const day = parseInt(str.substring(6, 8), 10);

    return LocalDate.of(year, month, day);
  }

  /**
   * Get today's date
   */
  static today(): LocalDate {
    return LocalDate.fromDate(new Date());
  }

  /**
   * Get the year
   */
  get year(): number {
    return this._year;
  }

  /**
   * Get the month (1-12)
   */
  get month(): number {
    return this._month;
  }

  /**
   * Get the day of month
   */
  get day(): number {
    return this._day;
  }

  /**
   * Convert to YYYYMMDD number (for API calls)
   */
  toNumber(): number {
    return this._year * 10000 + this._month * 100 + this._day;
  }

  /**
   * Convert to YYYYMMDD string
   */
  toString(): string {
    const month = String(this._month).padStart(2, '0');
    const day = String(this._day).padStart(2, '0');
    return `${this._year}${month}${day}`;
  }

  /**
   * Convert to JavaScript Date (at midnight)
   */
  toDate(): Date {
    return new Date(this._year, this._month - 1, this._day);
  }

  /**
   * Convert to ISO date string (YYYY-MM-DD)
   */
  toISOString(): string {
    const month = String(this._month).padStart(2, '0');
    const day = String(this._day).padStart(2, '0');
    return `${this._year}-${month}-${day}`;
  }

  /**
   * Check if this date is before another
   */
  isBefore(other: LocalDate): boolean {
    return this.toNumber() < other.toNumber();
  }

  /**
   * Check if this date is after another
   */
  isAfter(other: LocalDate): boolean {
    return this.toNumber() > other.toNumber();
  }

  /**
   * Check equality
   */
  equals(other: LocalDate): boolean {
    return this.toNumber() === other.toNumber();
  }
}

/**
 * DateRange Value Object
 *
 * 表示日期區間（起始日期 ~ 結束日期）。
 */
export class DateRange {
  private constructor(
    private readonly _start: LocalDate,
    private readonly _end: LocalDate
  ) {}

  /**
   * Create a date range between two dates
   */
  static between(start: LocalDate, end: LocalDate): DateRange {
    if (start.isAfter(end)) {
      throw new ValidationError(
        'dateRange',
        'Start date must be before or equal to end date'
      );
    }
    return new DateRange(start, end);
  }

  /**
   * Create a date range for a single day
   */
  static on(date: LocalDate): DateRange {
    return new DateRange(date, date);
  }

  /**
   * Get the start date
   */
  get start(): LocalDate {
    return this._start;
  }

  /**
   * Get the end date
   */
  get end(): LocalDate {
    return this._end;
  }

  /**
   * Check if a date is within this range (inclusive)
   */
  contains(date: LocalDate): boolean {
    return !date.isBefore(this._start) && !date.isAfter(this._end);
  }
}

/**
 * Date type for queries
 */
export enum DateType {
  /** 發票日期 */
  INVOICE_DATE = 1,
  /** 建立日期 */
  CREATE_DATE = 2,
}
