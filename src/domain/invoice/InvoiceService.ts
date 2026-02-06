import { Invoice } from './Invoice.js';
import { InvoiceNumber } from './InvoiceNumber.js';
import { InvoiceQuery } from './InvoiceQuery.js';
import { PaginatedResult } from '../shared/Pagination.js';

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
 * Invoice status info
 */
export interface InvoiceStatusInfo {
  invoiceNumber: string;
  type: string;
  status: number;
  totalAmount: number;
}

/**
 * Invoice Service Interface
 *
 * Provider-agnostic interface for invoice operations.
 * Implemented by each provider's service class.
 */
export interface InvoiceService {
  /**
   * Issue a new invoice (開立發票)
   */
  issue(invoice: Invoice): Promise<IssueInvoiceResult>;

  /**
   * Void an invoice (作廢發票)
   */
  void(invoiceNumber: InvoiceNumber): Promise<void>;

  /**
   * Find invoice by invoice number
   */
  findByNumber(invoiceNumber: InvoiceNumber): Promise<Invoice | null>;

  /**
   * Find invoice by order ID
   */
  findByOrderId(orderId: string): Promise<Invoice | null>;

  /**
   * List invoices with query
   */
  list(query: InvoiceQuery): Promise<PaginatedResult<Invoice>>;

  /**
   * Get invoice status
   */
  getStatus(invoiceNumbers: InvoiceNumber[]): Promise<InvoiceStatusInfo[]>;
}
