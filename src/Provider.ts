/**
 * Supported e-invoice providers (加值中心)
 */
export enum Provider {
  /** 光貿資訊 */
  AMEGO = 'amego',
}

/**
 * Provider capabilities - features that may or may not be supported
 */
export enum Capability {
  /** B2C 發票開立 */
  B2C = 'b2c',
  /** B2B 發票開立 */
  B2B = 'b2b',
  /** 載具 (手機條碼、自然人憑證) */
  CARRIER = 'carrier',
  /** 捐贈 */
  DONATION = 'donation',
  /** 折讓 */
  ALLOWANCE = 'allowance',
  /** 作廢 */
  VOID = 'void',
  /** 換開發票 */
  EXCHANGE = 'exchange',
  /** 列印格式輸出 */
  PRINT = 'print',
  /** 發票查詢 */
  QUERY = 'query',
  /** 發票列表 */
  LIST = 'list',
}

/**
 * Capability definitions for each provider
 */
export const PROVIDER_CAPABILITIES: Record<Provider, Set<Capability>> = {
  [Provider.AMEGO]: new Set([
    Capability.B2C,
    Capability.B2B,
    Capability.CARRIER,
    Capability.DONATION,
    Capability.ALLOWANCE,
    Capability.VOID,
    Capability.EXCHANGE,
    Capability.PRINT,
    Capability.QUERY,
    Capability.LIST,
  ]),
};

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<Provider, string> = {
  [Provider.AMEGO]: '光貿資訊',
};
