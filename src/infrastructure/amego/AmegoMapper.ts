import { Invoice, InvoiceStatus } from '../../domain/invoice/Invoice.js';
import { InvoiceItem } from '../../domain/invoice/InvoiceItem.js';
import { Allowance, AllowanceStatus } from '../../domain/allowance/Allowance.js';
import { AllowanceItem } from '../../domain/allowance/AllowanceItem.js';
import { TaxType } from '../../domain/shared/TaxType.js';

/**
 * Amego API Invoice Item format (ProductItem)
 *
 * 根據光貿 API 文件規格
 */
export interface AmegoInvoiceItemPayload {
  /** 品名，不可超過256字 */
  Description: string;
  /** 數量，小數精準度到7位數 */
  Quantity: number;
  /** 單價，預設含稅，小數精準度到7位數 */
  UnitPrice: number;
  /** 小計，小數精準度到7位數 */
  Amount: number;
  /** 單位，不可超過6字 */
  Unit?: string;
  /** 備註，不可超過40字 */
  Remark?: string;
  /** 課稅別 1：應稅 2：零稅率 3：免稅 */
  TaxType: number;
}

/**
 * Amego API Invoice Issue payload (/json/f0401)
 *
 * 根據光貿 API 文件規格 (MIG 4.0)
 */
export interface AmegoInvoiceIssuePayload {
  /** 訂單編號，不可重複，不可超過40字 */
  OrderId: string;
  /** 指定字軌開立 (API指定代碼) */
  TrackApiCode?: string;
  /** 買方統一編號，沒有則填入 0000000000 */
  BuyerIdentifier: string;
  /** 買方名稱 */
  BuyerName: string;
  /** 買方地址 */
  BuyerAddress?: string;
  /** 買方電話 */
  BuyerTelephoneNumber?: string;
  /** 買方電子信箱 */
  BuyerEmailAddress?: string;
  /** 總備註，不可超過200字 */
  MainRemark?: string;
  /** 載具類別 (3J0002: 手機條碼, CQ0001: 自然人憑證, amego: 光貿會員載具) */
  CarrierType?: string;
  /** 載具顯碼 */
  CarrierId1?: string;
  /** 載具隱碼 */
  CarrierId2?: string;
  /** 捐贈碼 */
  NPOBAN?: string;
  /** 商品陣列，最多 9999 筆 */
  ProductItem: AmegoInvoiceItemPayload[];
  /** 應稅銷售額合計 */
  SalesAmount: number;
  /** 免稅銷售額合計 */
  FreeTaxSalesAmount: number;
  /** 零稅率銷售額合計 */
  ZeroTaxSalesAmount: number;
  /** 課稅別 1：應稅 2：零稅率 3：免稅 4：應稅(特種稅率) 9：混合 */
  TaxType: number;
  /** 稅率，為5%時本欄位值為 "0.05" */
  TaxRate: string;
  /** 營業稅額。有打統編才需計算5%稅額，沒打統編一律帶0 */
  TaxAmount: number;
  /** 總計 */
  TotalAmount: number;
  /** 通關方式註記 1:非經海關出口 2:經海關出口 (零稅率必填) */
  CustomsClearanceMark?: number;
  /** 零稅率原因 71-79 (零稅率必填) */
  ZeroTaxRateReason?: number;
  /** 品牌名稱 */
  BrandName?: string;
  /** 明細的單價及小計 0:未稅價 1:含稅價 (預設含稅價) */
  DetailVat?: number;
  /** 明細的小計處理方式 0:小數精準度7位 1:四捨五入到整數 */
  DetailAmountRound?: number;
  /** 熱感應機型號代碼 */
  PrinterType?: number;
  /** 熱感應機編碼 1:BIG5 2:GBK 3:UTF-8 */
  PrinterLang?: number;
  /** 是否列印明細 1:列印 0:不列印 */
  PrintDetail?: number;
}

/**
 * Amego API Invoice Issue response
 */
export interface AmegoInvoiceIssueResponse {
  /** 回應代碼 (0 = 成功) */
  code: number;
  /** 錯誤訊息 */
  msg: string;
  /** 發票號碼 */
  invoice_number?: string;
  /** 發票開立時間 (Unix timestamp) */
  invoice_time?: number;
  /** 隨機碼 */
  random_number?: string;
  /** 電子發票的條碼內容 */
  barcode?: string;
  /** 電子發票的左側 QRCODE 內容 */
  qrcode_left?: string;
  /** 電子發票的右側 QRCODE 內容 */
  qrcode_right?: string;
  /** base64編碼的列印格式字串 */
  base64_data?: string;
}

/**
 * Amego API Invoice Void payload (/json/f0501)
 */
export interface AmegoInvoiceVoidPayload {
  /** 發票號碼 */
  CancelInvoiceNumber: string;
}

/**
 * Amego API Invoice Query payload (/json/invoice_query)
 */
export interface AmegoInvoiceQueryPayload {
  /** 查詢類型 order：訂單編號 invoice：發票號碼 */
  type: 'order' | 'invoice';
  /** 訂單編號 (當 type=order 時使用) */
  order_id?: string;
  /** 發票號碼 (當 type=invoice 時使用) */
  invoice_number?: string;
}

/**
 * Amego API Invoice Query response
 */
export interface AmegoInvoiceQueryResponse {
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
    wait?: Array<{
      invoice_type: string;
      create_date: number;
    }>;
    allowance?: Array<{
      invoice_type: number;
      invoice_status: number;
      allowance_type: string;
      allowance_number: string;
      allowance_date: string;
      tax_amount: number;
      total_amount: number;
    }>;
  };
}

/**
 * Amego API Invoice List payload (/json/invoice_list)
 */
export interface AmegoInvoiceListPayload {
  /** 日期條件 1:發票日期 2:建立日期 */
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
 * Amego API Invoice List response
 */
export interface AmegoInvoiceListResponse {
  code: number;
  msg: string;
  page_total?: number;
  page_now?: number;
  data_total?: number;
  data?: Array<{
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
 * Amego API Invoice Status payload (/json/invoice_status)
 */
export interface AmegoInvoiceStatusPayload {
  /** 發票號碼 */
  InvoiceNumber: string;
}

/**
 * Amego API Invoice Status response
 */
export interface AmegoInvoiceStatusResponse {
  code: number;
  msg: string;
  data?: Array<{
    invoice_number: string;
    type: string;
    status: number;
    total_amount: number;
  }>;
}

/**
 * Amego API Allowance Item format (ProductItem)
 */
export interface AmegoAllowanceItemPayload {
  /** 原發票號碼 */
  OriginalInvoiceNumber: string;
  /** 原發票日期 YYYYMMDD (Number) */
  OriginalInvoiceDate: number;
  /** 原品名，不可超過256字 */
  OriginalDescription: string;
  /** 數量 */
  Quantity: number;
  /** 單價 (不含稅) */
  UnitPrice: number;
  /** 小計 (不含稅) */
  Amount: number;
  /** 稅金 */
  Tax: number;
  /** 課稅別 1：應稅 2：零稅率 3：免稅 */
  TaxType: number;
  /** 單位 */
  Unit?: string;
}

/**
 * Amego API Allowance Issue payload (/json/g0401)
 */
export interface AmegoAllowanceIssuePayload {
  /** 折讓單編號，不可重複，不可超過16字 */
  AllowanceNumber: string;
  /** 折讓單日期 YYYYMMDD */
  AllowanceDate: string;
  /** 折讓單種類 1:買方開立折讓證明單 2:賣方折讓證明通知單 */
  AllowanceType: number;
  /** 買方統一編號，沒有則填入 0000000000 */
  BuyerIdentifier: string;
  /** 買方名稱 */
  BuyerName: string;
  /** 買方地址 */
  BuyerAddress?: string;
  /** 買方電話 */
  BuyerTelephoneNumber?: string;
  /** 買方電子信箱 */
  BuyerEmailAddress?: string;
  /** 商品陣列，最多 9999 筆 */
  ProductItem: AmegoAllowanceItemPayload[];
  /** 營業稅額 */
  TaxAmount: number;
  /** 金額合計 (不含稅) */
  TotalAmount: number;
}

/**
 * Amego API Allowance Issue response
 */
export interface AmegoAllowanceIssueResponse {
  code: number;
  msg: string;
}

/**
 * Amego API Allowance Void payload (/json/g0501)
 */
export interface AmegoAllowanceVoidPayload {
  /** 折讓單編號 */
  CancelAllowanceNumber: string;
}

/**
 * Amego API Allowance Query response
 */
export interface AmegoAllowanceQueryResponse {
  code: number;
  msg: string;
  data?: {
    allowance_number: string;
    invoice_type: string;
    invoice_status: number;
    allowance_date: number;
    allowance_type: number;
    buyer_identifier: string;
    buyer_name: string;
    buyer_zip: number;
    buyer_address: string;
    buyer_telephone_number: string;
    buyer_email_address: string;
    tax_amount: number;
    total_amount: number;
    cancel_date: number;
    detail_vat: number;
    create_date: number;
    product_item: Array<{
      original_invoice_number: string;
      original_invoice_date: number;
      tax_type: number;
      description: string;
      unit_price: number;
      quantity: number;
      unit: string;
      amount: number;
      tax: number;
    }>;
    wait?: Array<{
      invoice_type: string;
      create_date: number;
    }>;
  };
}

/**
 * Amego API Allowance List response
 */
export interface AmegoAllowanceListResponse {
  code: number;
  msg: string;
  page_total?: number;
  page_now?: number;
  data_total?: number;
  data?: Array<{
    allowance_number: string;
    invoice_type: string;
    invoice_status: number;
    allowance_date: number;
    allowance_type: number;
    buyer_identifier: string;
    buyer_name: string;
    buyer_zip: number;
    buyer_address: string;
    buyer_telephone_number: string;
    buyer_email_address: string;
    tax_amount: number;
    total_amount: number;
    cancel_date: number;
    create_date: number;
    product_item: Array<{
      original_invoice_date: number;
      original_invoice_number: string;
      tax_type: number;
      description: string;
      unit_price: number;
      quantity: number;
      unit: string;
      amount: number;
      tax: number;
    }>;
  }>;
}

/**
 * Amego API Allowance Status response
 */
export interface AmegoAllowanceStatusResponse {
  code: number;
  msg: string;
  data?: Array<{
    allowance_number: string;
    type: string;
    status: number;
    tax_amount: number;
    total_amount: number;
  }>;
}

/**
 * Amego Mapper
 *
 * Converts between domain objects and Amego API payloads.
 * 使用光貿 API 文件規格的欄位名稱 (PascalCase)
 */
export class AmegoMapper {
  /**
   * Convert Invoice domain object to API payload
   */
  static toInvoicePayload(invoice: Invoice): AmegoInvoiceIssuePayload {
    // Calculate amounts
    const salesAmount = invoice.calculateSalesAmount().toNumber();
    const freeTaxSalesAmount = invoice.calculateFreeTaxSalesAmount().toNumber();
    const zeroTaxSalesAmount = invoice.calculateZeroTaxSalesAmount().toNumber();
    const taxAmount = invoice.calculateTaxAmount().toNumber();
    const totalAmount = invoice.calculateTotalAmount().toNumber();

    const payload: AmegoInvoiceIssuePayload = {
      OrderId: invoice.orderId.toString(),
      BuyerIdentifier: invoice.buyer.taxId.isNone()
        ? '0000000000'
        : invoice.buyer.taxId.toString(),
      BuyerName: invoice.buyer.name,
      ProductItem: invoice.items.map(AmegoMapper.toInvoiceItemPayload),
      SalesAmount: salesAmount,
      FreeTaxSalesAmount: freeTaxSalesAmount,
      ZeroTaxSalesAmount: zeroTaxSalesAmount,
      TaxType: AmegoMapper.toApiTaxType(invoice.taxType),
      TaxRate: '0.05',
      TaxAmount: taxAmount,
      TotalAmount: totalAmount,
      DetailVat: invoice.pricesIncludeTax ? 1 : 0,
    };

    // Optional fields
    if (invoice.trackApiCode) {
      payload.TrackApiCode = invoice.trackApiCode;
    }
    if (invoice.buyer.address) {
      payload.BuyerAddress = invoice.buyer.address;
    }
    if (invoice.buyer.phone) {
      payload.BuyerTelephoneNumber = invoice.buyer.phone;
    }
    if (invoice.buyer.email) {
      payload.BuyerEmailAddress = invoice.buyer.email;
    }
    if (invoice.remark) {
      payload.MainRemark = invoice.remark;
    }
    if (invoice.hasCarrier) {
      payload.CarrierType = invoice.carrier.typeCode;
      payload.CarrierId1 = invoice.carrier.id;
      payload.CarrierId2 = invoice.carrier.id;
    }
    if (invoice.isDonated) {
      payload.NPOBAN = invoice.donation.code;
    }
    if (invoice.customsClearanceMark !== undefined) {
      payload.CustomsClearanceMark = invoice.customsClearanceMark;
    }
    if (invoice.zeroTaxRateReason !== undefined) {
      payload.ZeroTaxRateReason = invoice.zeroTaxRateReason;
    }
    if (invoice.brandName) {
      payload.BrandName = invoice.brandName;
    }

    return payload;
  }

  /**
   * Convert InvoiceItem to API payload (ProductItem)
   */
  static toInvoiceItemPayload(item: InvoiceItem): AmegoInvoiceItemPayload {
    const payload: AmegoInvoiceItemPayload = {
      Description: item.description,
      Quantity: item.quantity,
      UnitPrice: item.unitPrice.toNumber(),
      Amount: item.amount.toNumber(),
      TaxType: AmegoMapper.toApiTaxType(item.taxType),
    };

    if (item.unit) {
      payload.Unit = item.unit;
    }
    if (item.remark) {
      payload.Remark = item.remark;
    }

    return payload;
  }

  /**
   * Convert Allowance domain object to API payload
   */
  static toAllowancePayload(
    allowance: Allowance,
    allowanceNumber: string
  ): AmegoAllowanceIssuePayload {
    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;

    const items = allowance.items.map((item): AmegoAllowanceItemPayload => {
      const amount = item.amount.toNumber();
      const tax = Math.round(amount * 0.05);
      totalAmount += amount;
      taxAmount += tax;

      return {
        OriginalInvoiceNumber: allowance.originalInvoiceNumber.toString(),
        OriginalInvoiceDate: AmegoMapper.formatDateNumber(
          allowance.originalInvoiceDate
        ),
        OriginalDescription: item.originalDescription,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice.toNumber(),
        Amount: amount,
        Tax: tax,
        TaxType: AmegoMapper.toApiTaxType(item.taxType),
        Unit: item.unit,
      };
    });

    const payload: AmegoAllowanceIssuePayload = {
      AllowanceNumber: allowanceNumber,
      AllowanceDate: AmegoMapper.formatDate(new Date()),
      AllowanceType: 2, // 賣方折讓證明通知單
      BuyerIdentifier: allowance.buyerTaxId.isNone()
        ? '0000000000'
        : allowance.buyerTaxId.toString(),
      BuyerName: allowance.buyerName ?? '',
      ProductItem: items,
      TaxAmount: taxAmount,
      TotalAmount: totalAmount,
    };

    return payload;
  }

  /**
   * Convert AllowanceItem to API payload
   */
  static toAllowanceItemPayload(
    item: AllowanceItem,
    originalInvoiceNumber: string,
    originalInvoiceDate: Date
  ): AmegoAllowanceItemPayload {
    const amount = item.amount.toNumber();
    const tax = Math.round(amount * 0.05);

    return {
      OriginalInvoiceNumber: originalInvoiceNumber,
      OriginalInvoiceDate: AmegoMapper.formatDateNumber(originalInvoiceDate),
      OriginalDescription: item.originalDescription,
      Quantity: item.quantity,
      UnitPrice: item.unitPrice.toNumber(),
      Amount: amount,
      Tax: tax,
      TaxType: AmegoMapper.toApiTaxType(item.taxType),
      Unit: item.unit,
    };
  }

  /**
   * Convert domain TaxType to API tax type number
   */
  static toApiTaxType(taxType: TaxType): number {
    switch (taxType) {
      case TaxType.TAXABLE:
        return 1;
      case TaxType.ZERO_RATED:
        return 2;
      case TaxType.TAX_EXEMPT:
        return 3;
      case TaxType.MIXED:
        return 9;
      default:
        return 1;
    }
  }

  /**
   * Convert API tax type number to domain TaxType
   */
  static fromApiTaxType(apiTaxType: number): TaxType {
    switch (apiTaxType) {
      case 1:
        return TaxType.TAXABLE;
      case 2:
        return TaxType.ZERO_RATED;
      case 3:
        return TaxType.TAX_EXEMPT;
      case 4:
        return TaxType.TAXABLE; // 特種稅率 -> 應稅
      case 9:
        return TaxType.MIXED;
      default:
        return TaxType.TAXABLE;
    }
  }

  /**
   * Convert API status code to InvoiceStatus
   */
  static toInvoiceStatus(status: number): InvoiceStatus {
    switch (status) {
      case 1:
        return InvoiceStatus.PENDING;
      case 2:
        return InvoiceStatus.UPLOADING;
      case 3:
        return InvoiceStatus.UPLOADED;
      case 31:
        return InvoiceStatus.PROCESSING;
      case 32:
        return InvoiceStatus.AWAITING_CONFIRMATION;
      case 91:
        return InvoiceStatus.ERROR;
      case 99:
        return InvoiceStatus.COMPLETED;
      default:
        return InvoiceStatus.PENDING;
    }
  }

  /**
   * Convert API status code to AllowanceStatus
   */
  static toAllowanceStatus(status: number): AllowanceStatus {
    switch (status) {
      case 1:
        return AllowanceStatus.PENDING;
      case 2:
        return AllowanceStatus.UPLOADING;
      case 3:
        return AllowanceStatus.UPLOADED;
      case 31:
        return AllowanceStatus.PROCESSING;
      case 32:
        return AllowanceStatus.AWAITING_CONFIRMATION;
      case 91:
        return AllowanceStatus.ERROR;
      case 99:
        return AllowanceStatus.COMPLETED;
      default:
        return AllowanceStatus.PENDING;
    }
  }

  /**
   * Format date to YYYYMMDD string
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format date to YYYYMMDD number
   */
  static formatDateNumber(date: Date): number {
    return parseInt(AmegoMapper.formatDate(date), 10);
  }

  /**
   * Parse YYYYMMDD (string or number) to Date
   */
  static parseDate(dateValue: string | number): Date {
    const dateStr = String(dateValue);
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  /**
   * Parse Unix timestamp to Date
   */
  static parseUnixTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Parse ISO date string to Date
   */
  static parseIsoDate(isoStr: string): Date {
    return new Date(isoStr);
  }

  /**
   * Parse separate date (YYYYMMDD) and time (HH:mm:ss) to Date
   *
   * API 回傳的 invoice_date 和 invoice_time 是分開的，需要組合後解析
   */
  static parseDateAndTime(dateValue: string | number, timeStr: string): Date {
    const dateStr = String(dateValue);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const isoStr = `${year}-${month}-${day}T${timeStr}`;
    return new Date(isoStr);
  }
}
