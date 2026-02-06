import { Invoice, InvoiceStatus } from './Invoice.js';
import { InvoiceNumber } from './InvoiceNumber.js';

/**
 * Result of issuing an invoice
 */
export interface IssueInvoiceResult {
  /** 發票號碼 */
  invoiceNumber: InvoiceNumber;
  /** 發票開立時間 */
  invoiceTime: Date;
  /** 隨機碼 */
  randomNumber: string;
  /** 條碼內容 */
  barcode: string;
  /** 左側 QR Code 內容 */
  qrcodeLeft: string;
  /** 右側 QR Code 內容 */
  qrcodeRight: string;
  /** 列印格式字串 (base64) */
  printData?: string;
}

/**
 * Result of querying an invoice
 */
export interface InvoiceQueryResult {
  invoice: Invoice;
  status: InvoiceStatus;
}

/**
 * Result of checking invoice status
 */
export interface InvoiceStatusResult {
  invoiceNumber: string;
  type: string;
  status: InvoiceStatus;
  totalAmount: number;
}

/**
 * Options for listing invoices
 */
export interface ListInvoicesOptions {
  /** 日期條件 1: 發票日期 2: 建立日期 */
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
 * Invoice Repository Interface
 *
 * Defines the contract for invoice persistence operations.
 * Implemented by infrastructure layer (e.g., AmegoInvoiceRepository).
 */
export interface InvoiceRepository {
  /**
   * Issue a new invoice (開立發票)
   */
  issue(invoice: Invoice): Promise<IssueInvoiceResult>;

  /**
   * Void an invoice (作廢發票)
   */
  void(invoiceNumber: InvoiceNumber): Promise<void>;

  /**
   * Query invoice by invoice number or order ID
   */
  findByInvoiceNumber(invoiceNumber: InvoiceNumber): Promise<InvoiceQueryResult | null>;
  findByOrderId(orderId: string): Promise<InvoiceQueryResult | null>;

  /**
   * Check invoice status
   */
  getStatus(invoiceNumbers: InvoiceNumber[]): Promise<InvoiceStatusResult[]>;

  /**
   * List invoices
   */
  list(options: ListInvoicesOptions): Promise<{
    invoices: InvoiceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }>;
}
