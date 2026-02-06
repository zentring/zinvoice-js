import { Allowance } from './Allowance.js';
import { InvoiceNumber } from '../invoice/InvoiceNumber.js';
import { DateRange, DateType } from '../shared/LocalDate.js';
import { Pagination, PaginatedResult } from '../shared/Pagination.js';

/**
 * Result of issuing an allowance
 */
export interface IssueAllowanceResult {
  /** 折讓單號碼 */
  allowanceNumber: string;
  /** 折讓開立時間 */
  allowanceDate: Date;
}

/**
 * Allowance status info
 */
export interface AllowanceStatusInfo {
  allowanceNumber: string;
  status: number;
  totalAmount: number;
}

/**
 * Allowance query options
 */
export interface AllowanceQuery {
  dateRange: DateRange;
  dateType: DateType;
  pagination: Pagination;
}

/**
 * Allowance Service Interface
 *
 * Provider-agnostic interface for allowance operations.
 * Implemented by each provider's service class.
 */
export interface AllowanceService {
  /**
   * Issue a new allowance (開立折讓)
   */
  issue(allowance: Allowance): Promise<IssueAllowanceResult>;

  /**
   * Void an allowance (作廢折讓)
   */
  void(allowanceNumber: string): Promise<void>;

  /**
   * Find allowance by allowance number
   */
  findByNumber(allowanceNumber: string): Promise<Allowance | null>;

  /**
   * Find allowances by original invoice number
   */
  findByInvoiceNumber(invoiceNumber: InvoiceNumber): Promise<Allowance[]>;

  /**
   * List allowances with query
   */
  list(query: AllowanceQuery): Promise<PaginatedResult<Allowance>>;

  /**
   * Get allowance status
   */
  getStatus(allowanceNumbers: string[]): Promise<AllowanceStatusInfo[]>;
}
