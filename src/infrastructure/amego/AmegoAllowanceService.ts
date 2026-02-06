import { AmegoConfig } from './AmegoConfig.js';
import { AmegoAllowanceRepository } from './AmegoAllowanceRepository.js';
import {
  AllowanceService,
  IssueAllowanceResult,
  AllowanceStatusInfo,
  AllowanceQuery,
} from '../../domain/allowance/AllowanceService.js';
import { Allowance } from '../../domain/allowance/Allowance.js';
import { InvoiceNumber } from '../../domain/invoice/InvoiceNumber.js';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../domain/shared/Pagination.js';
import { DateType } from '../../domain/shared/LocalDate.js';

/**
 * Amego Allowance Service
 *
 * Implements AllowanceService using Amego (光貿) provider.
 */
export class AmegoAllowanceService implements AllowanceService {
  private readonly repository: AmegoAllowanceRepository;

  constructor(config: AmegoConfig) {
    this.repository = new AmegoAllowanceRepository(config);
  }

  /**
   * Issue a new allowance (開立折讓)
   */
  async issue(allowance: Allowance): Promise<IssueAllowanceResult> {
    const result = await this.repository.issue(allowance);

    return {
      allowanceNumber: result.allowanceNumber,
      allowanceDate: result.allowanceDate,
    };
  }

  /**
   * Void an allowance (作廢折讓)
   */
  async void(allowanceNumber: string): Promise<void> {
    await this.repository.void(allowanceNumber);
  }

  /**
   * Find allowance by allowance number
   */
  async findByNumber(allowanceNumber: string): Promise<Allowance | null> {
    const result = await this.repository.findByAllowanceNumber(allowanceNumber);
    return result?.allowance ?? null;
  }

  /**
   * Find allowances by original invoice number
   */
  async findByInvoiceNumber(invoiceNumber: InvoiceNumber): Promise<Allowance[]> {
    const results = await this.repository.findByInvoiceNumber(invoiceNumber);
    return results.map((r) => r.allowance);
  }

  /**
   * List allowances with query
   */
  async list(query: AllowanceQuery): Promise<PaginatedResult<Allowance>> {
    const result = await this.repository.list({
      dateType: query.dateType === DateType.CREATE_DATE ? 2 : 1,
      startDate: query.dateRange.start.toNumber().toString(),
      endDate: query.dateRange.end.toNumber().toString(),
      limit: query.pagination.limit,
      page: query.pagination.page,
    });

    const allowances = result.allowances.map((r) => r.allowance);

    return createPaginatedResult(allowances, result.totalCount, query.pagination);
  }

  /**
   * Get allowance status
   */
  async getStatus(allowanceNumbers: string[]): Promise<AllowanceStatusInfo[]> {
    const results = await this.repository.getStatus(allowanceNumbers);

    return results.map((r) => ({
      allowanceNumber: r.allowanceNumber,
      status: r.status,
      totalAmount: r.totalAmount,
    }));
  }
}
