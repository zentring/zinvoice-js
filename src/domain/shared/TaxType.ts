/**
 * Tax Type (課稅別)
 *
 * Represents the tax classification for invoice items and invoices.
 */
export enum TaxType {
  /** 應稅 (Taxable) - 5% VAT */
  TAXABLE = 1,
  /** 零稅率 (Zero-rated) */
  ZERO_RATED = 2,
  /** 免稅 (Tax-exempt) */
  TAX_EXEMPT = 3,
  /** 應稅（特種稅率）(Special tax rate) */
  SPECIAL_TAX = 4,
  /** 混合應稅與免稅或零稅率 (Mixed) - Only for C0401 */
  MIXED = 9,
}

/**
 * Zero Tax Rate Reason (零稅率原因)
 *
 * Required when tax type is ZERO_RATED.
 */
export enum ZeroTaxRateReason {
  /** 第一款 外銷貨物 */
  EXPORT_GOODS = 71,
  /** 第二款 與外銷有關之勞務，或在國內提供而在國外使用之勞務 */
  EXPORT_SERVICES = 72,
  /** 第三款 依法設立之免稅商店銷售與過境或出境旅客之貨物 */
  DUTY_FREE_SHOP = 73,
  /** 第四款 銷售與保稅區營業人供營運之貨物或勞務 */
  BONDED_AREA = 74,
  /** 第五款 國際間之運輸 */
  INTERNATIONAL_TRANSPORT = 75,
  /** 第六款 國際運輸用之船舶、航空器及遠洋漁船 */
  INTERNATIONAL_VESSELS = 76,
  /** 第七款 銷售與國際運輸用之船舶、航空器及遠洋漁船所使用之貨物或修繕勞務 */
  VESSEL_SUPPLIES = 77,
  /** 第八款 保稅區營業人銷售與課稅區營業人未輸往課稅區而直接出口之貨物 */
  BONDED_DIRECT_EXPORT = 78,
  /** 第九款 保稅區營業人銷售與課稅區營業人存入自由港區事業或海關管理之保稅倉庫、物流中心以供外銷之貨物 */
  BONDED_WAREHOUSE = 79,
}

/**
 * Customs Clearance Mark (通關方式註記)
 *
 * Required when tax type is ZERO_RATED.
 */
export enum CustomsClearanceMark {
  /** 非經海關出口 */
  NON_CUSTOMS = 1,
  /** 經海關出口 */
  CUSTOMS = 2,
}

/**
 * Tax rate constant
 */
export const TAX_RATE = 0.05;

/**
 * Helper functions for tax type
 */
export const TaxTypeHelper = {
  /**
   * Check if the tax type is taxable (includes tax amount)
   */
  isTaxable(type: TaxType): boolean {
    return type === TaxType.TAXABLE || type === TaxType.SPECIAL_TAX;
  },

  /**
   * Check if the tax type requires customs clearance mark
   */
  requiresCustomsClearance(type: TaxType): boolean {
    return type === TaxType.ZERO_RATED;
  },

  /**
   * Check if the tax type requires zero tax rate reason
   */
  requiresZeroTaxReason(type: TaxType): boolean {
    return type === TaxType.ZERO_RATED;
  },

  /**
   * Get display name for tax type
   */
  getDisplayName(type: TaxType): string {
    switch (type) {
      case TaxType.TAXABLE:
        return '應稅';
      case TaxType.ZERO_RATED:
        return '零稅率';
      case TaxType.TAX_EXEMPT:
        return '免稅';
      case TaxType.SPECIAL_TAX:
        return '應稅（特種稅率）';
      case TaxType.MIXED:
        return '混合稅';
      default:
        return '未知';
    }
  },
};
