import { AmegoClient } from './AmegoClient.js';
import { AmegoConfig, AMEGO_ENDPOINTS } from './AmegoConfig.js';
import {
  AmegoMapper,
  AmegoAllowanceVoidPayload,
  AmegoAllowanceListResponse,
  AmegoAllowanceQueryResponse,
  AmegoAllowanceStatusResponse,
} from './AmegoMapper.js';
import {
  AllowanceRepository,
  IssueAllowanceResult,
  AllowanceQueryResult,
  AllowanceStatusResult,
  ListAllowancesOptions,
} from '../../domain/allowance/AllowanceRepository.js';
import { Allowance, AllowanceStatus } from '../../domain/allowance/Allowance.js';
import { AllowanceItem } from '../../domain/allowance/AllowanceItem.js';
import { InvoiceNumber } from '../../domain/invoice/InvoiceNumber.js';
import { TaxId } from '../../domain/shared/TaxId.js';
import { Money } from '../../domain/shared/Money.js';

/**
 * API response for allowance issue (/json/g0401)
 * 光貿 API 折讓開立回應（不含太多資料，只有成功訊息）
 */
interface AmegoAllowanceIssueResponseData {
  code: number;
  msg: string;
}

/**
 * API payload for allowance query (/json/allowance_query)
 */
interface AmegoAllowanceQueryPayload {
  /** 查詢類型 */
  type: 'allowance' | 'invoice';
  /** 折讓單編號 (當 type=allowance 時使用) */
  allowance_number?: string;
  /** 發票號碼 (當 type=invoice 時使用，查詢該發票的折讓) */
  invoice_number?: string;
}

/**
 * API payload for allowance list (/json/allowance_list)
 */
interface AmegoAllowanceListPayload {
  /** 日期條件 1:折讓日期 2:建立日期 */
  date_select: number;
  /** 開始日期 YYYYMMDD (Number) */
  date_start: number;
  /** 結束日期 YYYYMMDD (Number) */
  date_end: number;
  /** 每頁顯示資料筆數 20~500 */
  limit?: number;
  /** 目前頁數 */
  page?: number;
}

/**
 * API payload for allowance status (/json/allowance_status)
 */
interface AmegoAllowanceStatusPayload {
  /** 折讓單編號 */
  AllowanceNumber: string;
}

/**
 * Counter for generating unique allowance numbers
 */
let allowanceCounter = 0;

/**
 * Generate a unique allowance number
 * Format: AL + YYYYMMDD + 6-digit sequence
 */
function generateAllowanceNumber(): string {
  const now = new Date();
  const datePart = AmegoMapper.formatDate(now);
  const seq = String(++allowanceCounter % 1000000).padStart(6, '0');
  return `AL${datePart}${seq}`;
}

/**
 * Amego Allowance Repository
 *
 * Implements AllowanceRepository using Amego (光貿) API.
 * 所有 API 都使用 POST 方法，並使用 form-urlencoded 格式。
 */
export class AmegoAllowanceRepository implements AllowanceRepository {
  private readonly client: AmegoClient;

  constructor(config: AmegoConfig) {
    this.client = new AmegoClient(config);
  }

  /**
   * Issue a new allowance (開立折讓)
   *
   * 使用 /json/g0401 endpoint
   */
  async issue(allowance: Allowance): Promise<IssueAllowanceResult> {
    // 產生折讓單編號 (光貿 API 需要我們自己產生)
    const allowanceNumber = generateAllowanceNumber();
    const payload = AmegoMapper.toAllowancePayload(allowance, allowanceNumber);

    await this.client.post<AmegoAllowanceIssueResponseData>(
      AMEGO_ENDPOINTS.ALLOWANCE_ISSUE,
      payload
    );

    // 折讓開立成功，使用 payload 中的日期
    const allowanceDate = AmegoMapper.parseDate(payload.AllowanceDate);

    // Update the allowance with issued data
    allowance.setAllowanceNumber(allowanceNumber, allowanceDate);
    allowance.updateStatus(AllowanceStatus.UPLOADED);

    return {
      allowanceNumber,
      allowanceDate,
    };
  }

  /**
   * Void an allowance (作廢折讓)
   *
   * 使用 /json/g0501 endpoint
   */
  async void(allowanceNumber: string): Promise<void> {
    const payload: AmegoAllowanceVoidPayload = {
      CancelAllowanceNumber: allowanceNumber,
    };

    await this.client.post(AMEGO_ENDPOINTS.ALLOWANCE_VOID, payload);
  }

  /**
   * Query allowance by allowance number (查詢折讓 - 依折讓單編號)
   *
   * 使用 /json/allowance_query endpoint
   */
  async findByAllowanceNumber(
    allowanceNumber: string
  ): Promise<AllowanceQueryResult | null> {
    try {
      const payload: AmegoAllowanceQueryPayload = {
        type: 'allowance',
        allowance_number: allowanceNumber,
      };

      const response = await this.client.post<AmegoAllowanceQueryResponse>(
        AMEGO_ENDPOINTS.ALLOWANCE_QUERY,
        payload
      );

      if (!response.data) {
        return null;
      }

      return this.mapQueryResponse(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Query allowances by original invoice number (查詢折讓 - 依原發票號碼)
   *
   * 使用 /json/allowance_query endpoint
   */
  async findByInvoiceNumber(
    invoiceNumber: InvoiceNumber
  ): Promise<AllowanceQueryResult[]> {
    try {
      const payload: AmegoAllowanceQueryPayload = {
        type: 'invoice',
        invoice_number: invoiceNumber.toString(),
      };

      const response = await this.client.post<AmegoAllowanceQueryResponse>(
        AMEGO_ENDPOINTS.ALLOWANCE_QUERY,
        payload
      );

      if (!response.data) {
        return [];
      }

      // 如果是查詢發票的折讓，可能回傳多筆
      // 這裡假設回傳單筆，如果 API 回傳陣列需要調整
      return [this.mapQueryResponse(response.data)];
    } catch {
      return [];
    }
  }

  /**
   * Check allowance status (查詢折讓狀態)
   *
   * 使用 /json/allowance_status endpoint
   */
  async getStatus(
    allowanceNumbers: string[]
  ): Promise<AllowanceStatusResult[]> {
    // 光貿 API 一次只能查一張折讓，需要多次呼叫
    const results: AllowanceStatusResult[] = [];

    for (const allowanceNumber of allowanceNumbers) {
      try {
        const payload: AmegoAllowanceStatusPayload = {
          AllowanceNumber: allowanceNumber,
        };

        const response = await this.client.post<AmegoAllowanceStatusResponse>(
          AMEGO_ENDPOINTS.ALLOWANCE_STATUS,
          payload
        );

        if (response.data && response.data.length > 0) {
          for (const item of response.data) {
            results.push({
              allowanceNumber: item.allowance_number,
              status: AmegoMapper.toAllowanceStatus(item.status),
              totalAmount: item.total_amount,
            });
          }
        }
      } catch {
        // Skip failed queries, continue with next
      }
    }

    return results;
  }

  /**
   * List allowances (折讓列表)
   *
   * 使用 /json/allowance_list endpoint
   */
  async list(options: ListAllowancesOptions): Promise<{
    allowances: AllowanceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }> {
    // 轉換日期格式：YYYYMMDD string -> number
    const dateStart = parseInt(options.startDate, 10);
    const dateEnd = parseInt(options.endDate, 10);

    const payload: AmegoAllowanceListPayload = {
      date_select: options.dateType,
      date_start: dateStart,
      date_end: dateEnd,
      limit: options.limit ?? 20,
      page: options.page ?? 1,
    };

    const response = await this.client.post<AmegoAllowanceListResponse>(
      AMEGO_ENDPOINTS.ALLOWANCE_LIST,
      payload
    );

    const allowances = (response.data ?? []).map((item) =>
      this.mapListItemResponse(item)
    );

    return {
      allowances,
      totalPages: response.page_total ?? 1,
      currentPage: response.page_now ?? 1,
      totalCount: response.data_total ?? 0,
    };
  }

  /**
   * Map API query response to domain query result
   */
  private mapQueryResponse(
    data: NonNullable<AmegoAllowanceQueryResponse['data']>
  ): AllowanceQueryResult {
    const items = (data.product_item ?? []).map((item) =>
      AllowanceItem.create({
        originalDescription: item.description,
        quantity: item.quantity,
        unitPrice: Money.create(item.unit_price),
        amount: Money.create(item.amount),
        unit: item.unit || undefined,
        taxType: AmegoMapper.fromApiTaxType(item.tax_type),
      })
    );

    // 從 product_item 取得原發票資訊 (假設所有 item 來自同一張發票)
    const firstItem = data.product_item?.[0];
    const originalInvoiceNumber = firstItem?.original_invoice_number ?? '';
    const originalInvoiceDate = firstItem?.original_invoice_date
      ? AmegoMapper.parseDate(firstItem.original_invoice_date)
      : new Date();

    const allowance = Allowance.create({
      originalInvoiceNumber: InvoiceNumber.create(originalInvoiceNumber),
      originalInvoiceDate,
      buyerTaxId: TaxId.tryCreate(data.buyer_identifier) ?? TaxId.none(),
      sellerTaxId: TaxId.none(), // API 回應沒有賣方資訊，使用空值
      buyerName: data.buyer_name || '',
      items,
    });

    // 設定折讓編號和日期
    const allowanceDate = AmegoMapper.parseDate(data.allowance_date);
    allowance.setAllowanceNumber(data.allowance_number, allowanceDate);
    allowance.updateStatus(AmegoMapper.toAllowanceStatus(data.invoice_status));

    return {
      allowance,
      status: AmegoMapper.toAllowanceStatus(data.invoice_status),
    };
  }

  /**
   * Map API list item response to domain query result
   */
  private mapListItemResponse(
    item: NonNullable<AmegoAllowanceListResponse['data']>[0]
  ): AllowanceQueryResult {
    // 從 product_item 取得原發票資訊
    const firstProductItem = item.product_item?.[0];
    const originalInvoiceNumber = firstProductItem?.original_invoice_number ?? '';
    const originalInvoiceDate = firstProductItem?.original_invoice_date
      ? AmegoMapper.parseDate(firstProductItem.original_invoice_date)
      : new Date();

    // 建立折讓明細
    const items = (item.product_item ?? []).map((productItem) =>
      AllowanceItem.create({
        originalDescription: productItem.description,
        quantity: productItem.quantity,
        unitPrice: Money.create(productItem.unit_price),
        amount: Money.create(productItem.amount),
        unit: productItem.unit || undefined,
        taxType: AmegoMapper.fromApiTaxType(productItem.tax_type),
      })
    );

    // 如果沒有 product_item，建立 placeholder
    const allowanceItems = items.length > 0 ? items : [
      AllowanceItem.create({
        originalDescription: '（詳細請查詢單張折讓）',
        quantity: 1,
        unitPrice: Money.create(item.total_amount),
        amount: Money.create(item.total_amount),
        taxType: AmegoMapper.fromApiTaxType(1), // Default to taxable
      }),
    ];

    const allowance = Allowance.create({
      originalInvoiceNumber: InvoiceNumber.create(originalInvoiceNumber),
      originalInvoiceDate,
      buyerTaxId: TaxId.tryCreate(item.buyer_identifier) ?? TaxId.none(),
      sellerTaxId: TaxId.none(),
      buyerName: item.buyer_name || '',
      items: allowanceItems,
    });

    // 設定折讓編號和日期
    const allowanceDate = AmegoMapper.parseDate(item.allowance_date);
    allowance.setAllowanceNumber(item.allowance_number, allowanceDate);
    allowance.updateStatus(AmegoMapper.toAllowanceStatus(item.invoice_status));

    return {
      allowance,
      status: AmegoMapper.toAllowanceStatus(item.invoice_status),
    };
  }
}
