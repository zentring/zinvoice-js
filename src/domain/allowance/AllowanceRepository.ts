import { Allowance, AllowanceStatus } from './Allowance.js';
import { InvoiceNumber } from '../invoice/InvoiceNumber.js';

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
 * Result of querying an allowance
 */
export interface AllowanceQueryResult {
  allowance: Allowance;
  status: AllowanceStatus;
}

/**
 * Result of checking allowance status
 */
export interface AllowanceStatusResult {
  allowanceNumber: string;
  status: AllowanceStatus;
  totalAmount: number;
}

/**
 * Options for listing allowances
 */
export interface ListAllowancesOptions {
  /** 日期條件 1: 折讓日期 2: 建立日期 */
  dateType: 1 | 2;
  /** 開始日期 YYYYMMDD */
  startDate: string;
  /** 結束日期 YYYYMMDD */
  endDate: string;
  /** 每頁筆數 20-500 */
  limit?: number;
  /** 頁數 */
  page?: number;
}

/**
 * Allowance Repository Interface
 *
 * Defines the contract for allowance persistence operations.
 * Implemented by infrastructure layer (e.g., AmegoAllowanceRepository).
 */
export interface AllowanceRepository {
  /**
   * Issue a new allowance (開立折讓)
   */
  issue(allowance: Allowance): Promise<IssueAllowanceResult>;

  /**
   * Void an allowance (作廢折讓)
   */
  void(allowanceNumber: string): Promise<void>;

  /**
   * Query allowance by allowance number
   */
  findByAllowanceNumber(
    allowanceNumber: string
  ): Promise<AllowanceQueryResult | null>;

  /**
   * Query allowances by original invoice number
   */
  findByInvoiceNumber(
    invoiceNumber: InvoiceNumber
  ): Promise<AllowanceQueryResult[]>;

  /**
   * Check allowance status
   */
  getStatus(allowanceNumbers: string[]): Promise<AllowanceStatusResult[]>;

  /**
   * List allowances
   */
  list(options: ListAllowancesOptions): Promise<{
    allowances: AllowanceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }>;
}
