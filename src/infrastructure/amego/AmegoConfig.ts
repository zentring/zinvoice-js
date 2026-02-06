/**
 * Amego API Configuration
 */
export interface AmegoConfig {
  /** API Base URL */
  baseUrl: string;
  /** 賣方統一編號 */
  sellerTaxId: string;
  /** API 金鑰 */
  apiKey: string;
  /** 字軌 API 代碼 (optional, for track allocation) */
  trackApiCode?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Amego API endpoints
 *
 * 根據光貿 API 文件規格 (MIG 4.0, 2025年1月起)
 * 所有路徑都以 /json/ 開頭
 */
export const AMEGO_ENDPOINTS = {
  // Invoice endpoints (發票)
  INVOICE_ISSUE: '/json/f0401',                 // 開立發票 (自動配號)
  INVOICE_ISSUE_CUSTOM: '/json/f0401_custom',   // 開立發票 (API 配號)
  INVOICE_VOID: '/json/f0501',                  // 作廢發票
  INVOICE_QUERY: '/json/invoice_query',         // 查詢單張發票
  INVOICE_LIST: '/json/invoice_list',           // 查詢發票列表
  INVOICE_STATUS: '/json/invoice_status',       // 查詢發票狀態
  INVOICE_FILE: '/json/invoice_file',           // 下載發票檔案 (PDF)
  INVOICE_PRINT: '/json/invoice_print',         // 產出列印格式字串

  // Allowance endpoints (折讓)
  ALLOWANCE_ISSUE: '/json/g0401',               // 開立折讓
  ALLOWANCE_VOID: '/json/g0501',                // 作廢折讓
  ALLOWANCE_QUERY: '/json/allowance_query',     // 查詢單張折讓
  ALLOWANCE_LIST: '/json/allowance_list',       // 查詢折讓列表
  ALLOWANCE_STATUS: '/json/allowance_status',   // 查詢折讓狀態
  ALLOWANCE_FILE: '/json/allowance_file',       // 下載折讓檔案 (PDF)
  ALLOWANCE_PRINT: '/json/allowance_print',     // 產出折讓列印格式字串

  // Utility endpoints (其他)
  BARCODE_CHECK: '/json/barcode',               // 手機條碼查詢
  BAN_QUERY: '/json/ban_query',                 // 公司名稱查詢
  TRACK_ALL: '/json/track_all',                 // 所有字軌資料
  TRACK_GET: '/json/track_get',                 // 字軌取號 (API 配號專用)
  TRACK_STATUS: '/json/track_status',           // 字軌狀態 (API 配號專用)
  LOTTERY_TYPE: '/json/lottery_type',           // 獎項定義
  LOTTERY_STATUS: '/json/lottery_status',       // 中獎發票
} as const;

/**
 * Default configuration values
 */
export const AMEGO_DEFAULTS = {
  TIMEOUT: 30000,
  BASE_URL: 'https://invoice-api.amego.tw',
} as const;
