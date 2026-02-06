import { AmegoConfig } from './AmegoConfig.js';
import { AmegoInvoiceRepository } from './AmegoInvoiceRepository.js';
import {
  InvoiceService,
  IssueInvoiceResult,
  InvoiceStatusInfo,
} from '../../domain/invoice/InvoiceService.js';
import { Invoice } from '../../domain/invoice/Invoice.js';
import { InvoiceNumber } from '../../domain/invoice/InvoiceNumber.js';
import { InvoiceQuery } from '../../domain/invoice/InvoiceQuery.js';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../domain/shared/Pagination.js';
import { DateType } from '../../domain/shared/LocalDate.js';

/**
 * Amego Invoice Service
 *
 * Implements InvoiceService using Amego (光貿) provider.
 */
export class AmegoInvoiceService implements InvoiceService {
  private readonly repository: AmegoInvoiceRepository;

  constructor(config: AmegoConfig) {
    this.repository = new AmegoInvoiceRepository(config);
  }

  /**
   * Issue a new invoice (開立發票)
   */
  async issue(invoice: Invoice): Promise<IssueInvoiceResult> {
    const result = await this.repository.issue(invoice);

    return {
      invoiceNumber: result.invoiceNumber,
      invoiceTime: result.invoiceTime,
      randomNumber: result.randomNumber,
      barcode: result.barcode,
      qrcodeLeft: result.qrcodeLeft,
      qrcodeRight: result.qrcodeRight,
      printData: result.printData,
    };
  }

  /**
   * Void an invoice (作廢發票)
   */
  async void(invoiceNumber: InvoiceNumber): Promise<void> {
    await this.repository.void(invoiceNumber);
  }

  /**
   * Find invoice by invoice number
   */
  async findByNumber(invoiceNumber: InvoiceNumber): Promise<Invoice | null> {
    const result = await this.repository.findByInvoiceNumber(invoiceNumber);
    return result?.invoice ?? null;
  }

  /**
   * Find invoice by order ID
   */
  async findByOrderId(orderId: string): Promise<Invoice | null> {
    const result = await this.repository.findByOrderId(orderId);
    return result?.invoice ?? null;
  }

  /**
   * List invoices with query
   */
  async list(query: InvoiceQuery): Promise<PaginatedResult<Invoice>> {
    const result = await this.repository.list({
      dateType: query.dateType === DateType.CREATE_DATE ? 2 : 1,
      startDate: query.dateRange.start.toNumber().toString(),
      endDate: query.dateRange.end.toNumber().toString(),
      limit: query.pagination.limit,
      page: query.pagination.page,
    });

    const invoices = result.invoices.map((r) => r.invoice);

    return createPaginatedResult(invoices, result.totalCount, query.pagination);
  }

  /**
   * Get invoice status
   */
  async getStatus(invoiceNumbers: InvoiceNumber[]): Promise<InvoiceStatusInfo[]> {
    const results = await this.repository.getStatus(invoiceNumbers);

    return results.map((r) => ({
      invoiceNumber: r.invoiceNumber,
      type: r.type,
      status: r.status,
      totalAmount: r.totalAmount,
    }));
  }
}
