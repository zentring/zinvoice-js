import { AmegoClient } from './AmegoClient.js';
import { AmegoConfig, AMEGO_ENDPOINTS } from './AmegoConfig.js';
import {
  AmegoMapper,
  AmegoInvoiceIssueResponse,
  AmegoInvoiceQueryPayload,
  AmegoInvoiceListPayload,
  AmegoInvoiceStatusPayload,
  AmegoInvoiceVoidPayload,
} from './AmegoMapper.js';
import {
  InvoiceRepository,
  IssueInvoiceResult,
  InvoiceQueryResult,
  InvoiceStatusResult,
  ListInvoicesOptions,
} from '../../domain/invoice/InvoiceRepository.js';
import { Invoice, InvoiceStatus } from '../../domain/invoice/Invoice.js';
import { InvoiceNumber } from '../../domain/invoice/InvoiceNumber.js';
import { InvoiceItem } from '../../domain/invoice/InvoiceItem.js';
import { TaxId } from '../../domain/shared/TaxId.js';
import { Money } from '../../domain/shared/Money.js';
import { OrderId } from '../../domain/shared/OrderId.js';
import { Buyer } from '../../domain/shared/Buyer.js';
import { Carrier, CarrierType } from '../../domain/shared/Carrier.js';
import { Donation } from '../../domain/shared/Donation.js';

/**
 * API response for invoice query (/json/invoice_query)
 * 包含完整的 API 回應，data 裡面才是發票資料
 */
interface AmegoQueryApiResponse {
  code: number;
  msg: string;
  data?: {
    invoice_number: string;
    invoice_type: string;
    invoice_status: number;
    invoice_date: string;
    invoice_time: string;
    buyer_identifier: string;
    buyer_name: string;
    buyer_zip: number;
    buyer_address: string;
    buyer_telephone_number: string;
    buyer_email_address: string;
    sales_amount: number;
    free_tax_sales_amount: number;
    zero_tax_sales_amount: number;
    tax_type: number;
    tax_rate: string;
    tax_amount: number;
    total_amount: number;
    print_mark: string;
    random_number: string;
    main_remark: string;
    customs_clearance_mark: number;
    carrier_type: string;
    carrier_id1: string;
    carrier_id2: string;
    npoban: string;
    cancel_date: number;
    invoice_lottery: number;
    order_id: string;
    detail_vat: number;
    detail_amount_round: number;
    create_date: number;
    product_item: Array<{
      tax_type: number;
      description: string;
      unit_price: number;
      quantity: number;
      unit: string;
      amount: number;
      remark: string;
    }>;
  };
}

/** 發票查詢回應的 data 部分 */
type AmegoQueryResponseData = NonNullable<AmegoQueryApiResponse['data']>;

/**
 * API response for invoice list (/json/invoice_list)
 */
interface AmegoListResponseData {
  page_total: number;
  page_now: number;
  data_total: number;
  data: Array<{
    invoice_number: string;
    invoice_type: string;
    invoice_status: number;
    invoice_date: number;
    invoice_time: string;
    buyer_identifier: string;
    buyer_name: string;
    buyer_zip: number;
    buyer_address: string;
    buyer_telephone_number: string;
    buyer_email_address: string;
    sales_amount: number;
    free_tax_sales_amount: number;
    zero_tax_sales_amount: number;
    tax_type: number;
    tax_rate: string;
    tax_amount: number;
    total_amount: number;
    print_mark: string;
    random_number: string;
    main_remark: string;
    customs_clearance_mark: number;
    zero_tax_rate_reason: number;
    carrier_type: string;
    carrier_id1: string;
    carrier_id2: string;
    npoban: string;
    cancel_date: number;
    invoice_lottery: number;
    order_id: string;
    create_date: number;
  }>;
}

/**
 * API response for invoice status (/json/invoice_status)
 */
interface AmegoStatusResponseData {
  data: Array<{
    invoice_number: string;
    type: string;
    status: number;
    total_amount: number;
  }>;
}

/**
 * Amego Invoice Repository
 *
 * Implements InvoiceRepository using Amego (光貿) API.
 * 所有 API 都使用 POST 方法，並使用 form-urlencoded 格式。
 */
export class AmegoInvoiceRepository implements InvoiceRepository {
  private readonly client: AmegoClient;

  constructor(config: AmegoConfig) {
    this.client = new AmegoClient(config);
  }

  /**
   * Issue a new invoice (開立發票)
   *
   * 使用 /json/f0401 endpoint
   */
  async issue(invoice: Invoice): Promise<IssueInvoiceResult> {
    const payload = AmegoMapper.toInvoicePayload(invoice);

    const response = await this.client.post<AmegoInvoiceIssueResponse>(
      AMEGO_ENDPOINTS.INVOICE_ISSUE,
      payload
    );

    // Response 使用 snake_case 欄位名稱
    const invoiceNumber = InvoiceNumber.create(response.invoice_number!);
    const invoiceTime = AmegoMapper.parseUnixTimestamp(response.invoice_time!);

    // Update the invoice with issued data
    invoice.setInvoiceNumber(
      invoiceNumber,
      invoiceTime,
      response.random_number!
    );
    invoice.updateStatus(InvoiceStatus.UPLOADED);

    return {
      invoiceNumber,
      invoiceTime,
      randomNumber: response.random_number!,
      barcode: response.barcode ?? '',
      qrcodeLeft: response.qrcode_left ?? '',
      qrcodeRight: response.qrcode_right ?? '',
      printData: response.base64_data,
    };
  }

  /**
   * Void an invoice (作廢發票)
   *
   * 使用 /json/f0501 endpoint
   */
  async void(invoiceNumber: InvoiceNumber): Promise<void> {
    const payload: AmegoInvoiceVoidPayload = {
      CancelInvoiceNumber: invoiceNumber.toString(),
    };

    await this.client.post(AMEGO_ENDPOINTS.INVOICE_VOID, payload);
  }

  /**
   * Query invoice by invoice number (查詢發票 - 依發票號碼)
   *
   * 使用 /json/invoice_query endpoint
   */
  async findByInvoiceNumber(
    invoiceNumber: InvoiceNumber
  ): Promise<InvoiceQueryResult | null> {
    try {
      const payload: AmegoInvoiceQueryPayload = {
        type: 'invoice',
        invoice_number: invoiceNumber.toString(),
      };

      const response = await this.client.post<AmegoQueryApiResponse>(
        AMEGO_ENDPOINTS.INVOICE_QUERY,
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
   * Query invoice by order ID (查詢發票 - 依訂單編號)
   *
   * 使用 /json/invoice_query endpoint
   */
  async findByOrderId(orderId: string): Promise<InvoiceQueryResult | null> {
    try {
      const payload: AmegoInvoiceQueryPayload = {
        type: 'order',
        order_id: orderId,
      };

      const response = await this.client.post<AmegoQueryApiResponse>(
        AMEGO_ENDPOINTS.INVOICE_QUERY,
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
   * Check invoice status (查詢發票狀態)
   *
   * 使用 /json/invoice_status endpoint
   */
  async getStatus(
    invoiceNumbers: InvoiceNumber[]
  ): Promise<InvoiceStatusResult[]> {
    // 光貿 API 一次只能查一張發票，需要多次呼叫
    const results: InvoiceStatusResult[] = [];

    for (const invoiceNumber of invoiceNumbers) {
      try {
        const payload: AmegoInvoiceStatusPayload = {
          InvoiceNumber: invoiceNumber.toString(),
        };

        const response = await this.client.post<AmegoStatusResponseData>(
          AMEGO_ENDPOINTS.INVOICE_STATUS,
          payload
        );

        if (response.data && response.data.length > 0) {
          for (const item of response.data) {
            results.push({
              invoiceNumber: item.invoice_number,
              type: item.type,
              status: AmegoMapper.toInvoiceStatus(item.status),
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
   * List invoices (發票列表)
   *
   * 使用 /json/invoice_list endpoint
   */
  async list(options: ListInvoicesOptions): Promise<{
    invoices: InvoiceQueryResult[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }> {
    // 轉換日期格式：YYYYMMDD string -> number
    const dateStart = parseInt(options.startDate, 10);
    const dateEnd = parseInt(options.endDate, 10);

    const payload: AmegoInvoiceListPayload = {
      date_select: options.dateType,
      date_start: dateStart,
      date_end: dateEnd,
      limit: options.limit ?? 20,
      page: options.page ?? 1,
    };

    const response = await this.client.post<AmegoListResponseData>(
      AMEGO_ENDPOINTS.INVOICE_LIST,
      payload
    );

    const invoices = (response.data ?? []).map((item) =>
      this.mapListItemResponse(item)
    );

    return {
      invoices,
      totalPages: response.page_total ?? 1,
      currentPage: response.page_now ?? 1,
      totalCount: response.data_total ?? 0,
    };
  }

  /**
   * Map API query response to domain query result
   */
  private mapQueryResponse(
    response: AmegoQueryResponseData
  ): InvoiceQueryResult {
    const items = (response.product_item ?? []).map((item) =>
      InvoiceItem.create({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Money.create(item.unit_price),
        amount: Money.create(item.amount),
        unit: item.unit || undefined,
        remark: item.remark || undefined,
        taxType: AmegoMapper.fromApiTaxType(item.tax_type),
      })
    );

    // Build Buyer from API response
    const buyerTaxId = TaxId.tryCreate(response.buyer_identifier) ?? TaxId.none();
    const buyer = buyerTaxId.isNone()
      ? Buyer.anonymous(response.buyer_name || '消費者')
      : Buyer.company({
          taxId: buyerTaxId,
          name: response.buyer_name || '',
          address: response.buyer_address || undefined,
          phone: response.buyer_telephone_number || undefined,
          email: response.buyer_email_address || undefined,
        });

    // Build Carrier from API response
    const carrier = this.buildCarrier(
      response.carrier_type,
      response.carrier_id1
    );

    // Build Donation from API response
    const donation = response.npoban
      ? Donation.tryCreate(response.npoban)
      : Donation.none();

    // Use reconstruct to skip validation (e.g., carrier+donation exclusivity)
    // since we're reading existing data from the API
    const invoice = Invoice.reconstruct({
      orderId: OrderId.create(response.order_id || response.invoice_number),
      buyer,
      items,
      carrier,
      donation,
      remark: response.main_remark || undefined,
    });

    const invoiceNumber = InvoiceNumber.create(response.invoice_number);
    const invoiceTime = AmegoMapper.parseDateAndTime(
      response.invoice_date,
      response.invoice_time
    );

    invoice.setInvoiceNumber(invoiceNumber, invoiceTime, response.random_number);
    invoice.updateStatus(AmegoMapper.toInvoiceStatus(response.invoice_status));

    return {
      invoice,
      status: AmegoMapper.toInvoiceStatus(response.invoice_status),
    };
  }

  /**
   * Map API list item response to domain query result
   */
  private mapListItemResponse(item: AmegoListResponseData['data'][0]): InvoiceQueryResult {
    // 列表 API 沒有商品明細，建立一個空的 placeholder item
    const placeholderItem = InvoiceItem.create({
      description: '（詳細請查詢單張發票）',
      quantity: 1,
      unitPrice: Money.create(item.total_amount),
      amount: Money.create(item.total_amount),
      taxType: AmegoMapper.fromApiTaxType(item.tax_type),
    });

    // Build Buyer from API response
    const buyerTaxId = TaxId.tryCreate(item.buyer_identifier) ?? TaxId.none();
    const buyer = buyerTaxId.isNone()
      ? Buyer.anonymous(item.buyer_name || '消費者')
      : Buyer.company({
          taxId: buyerTaxId,
          name: item.buyer_name || '',
          address: item.buyer_address || undefined,
          phone: item.buyer_telephone_number || undefined,
          email: item.buyer_email_address || undefined,
        });

    // Build Carrier from API response
    const carrier = this.buildCarrier(item.carrier_type, item.carrier_id1);

    // Build Donation from API response
    const donation = item.npoban
      ? Donation.tryCreate(item.npoban)
      : Donation.none();

    // Use reconstruct to skip validation (e.g., carrier+donation exclusivity)
    // since we're reading existing data from the API
    const invoice = Invoice.reconstruct({
      orderId: OrderId.create(item.order_id || item.invoice_number),
      buyer,
      items: [placeholderItem],
      carrier,
      donation,
      remark: item.main_remark || undefined,
    });

    const invoiceNumber = InvoiceNumber.create(item.invoice_number);
    const invoiceTime = AmegoMapper.parseDateAndTime(
      item.invoice_date,
      item.invoice_time
    );

    invoice.setInvoiceNumber(invoiceNumber, invoiceTime, item.random_number);
    invoice.updateStatus(AmegoMapper.toInvoiceStatus(item.invoice_status));

    return {
      invoice,
      status: AmegoMapper.toInvoiceStatus(item.invoice_status),
    };
  }

  /**
   * Build Carrier from API response fields
   */
  private buildCarrier(carrierType: string, carrierId: string): Carrier {
    if (!carrierType || carrierType === '') {
      return Carrier.none();
    }

    switch (carrierType) {
      case CarrierType.MOBILE:
        return Carrier.mobile(carrierId);
      case CarrierType.CERTIFICATE:
        return Carrier.certificate(carrierId);
      default:
        return Carrier.custom(carrierType as CarrierType, carrierId);
    }
  }
}
