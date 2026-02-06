import { Money } from '../shared/Money.js';
import { TaxType, TAX_RATE } from '../shared/TaxType.js';
import { InvoiceItem } from '../invoice/InvoiceItem.js';
import { AllowanceItem } from '../allowance/AllowanceItem.js';

/**
 * Tax calculation result
 */
export interface TaxCalculationResult {
  /** 應稅銷售額 (含稅時為含稅金額) */
  taxableSales: Money;
  /** 免稅銷售額 */
  taxExemptSales: Money;
  /** 零稅率銷售額 */
  zeroRatedSales: Money;
  /** 營業稅額 */
  taxAmount: Money;
  /** 總計金額 */
  totalAmount: Money;
}

/**
 * Tax Calculator Domain Service
 *
 * Handles tax calculations following Taiwan's e-invoice specifications.
 * Supports both tax-included and tax-excluded pricing.
 */
export class TaxCalculator {
  /**
   * Calculate tax for invoice items
   */
  static calculateForInvoice(
    items: readonly InvoiceItem[],
    pricesIncludeTax: boolean,
    hasB2BTaxId: boolean
  ): TaxCalculationResult {
    const taxableSales = TaxCalculator.sumByTaxType(items, TaxType.TAXABLE);
    const taxExemptSales = TaxCalculator.sumByTaxType(items, TaxType.TAX_EXEMPT);
    const zeroRatedSales = TaxCalculator.sumByTaxType(items, TaxType.ZERO_RATED);

    // B2C invoices (no tax ID) have zero tax amount
    const taxAmount = hasB2BTaxId
      ? TaxCalculator.calculateTaxAmount(taxableSales, pricesIncludeTax)
      : Money.zero();

    const totalAmount = TaxCalculator.calculateTotal(
      taxableSales,
      taxExemptSales,
      zeroRatedSales,
      taxAmount,
      pricesIncludeTax
    );

    return {
      taxableSales,
      taxExemptSales,
      zeroRatedSales,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Calculate tax for allowance items
   */
  static calculateForAllowance(
    items: readonly AllowanceItem[],
    pricesIncludeTax: boolean
  ): TaxCalculationResult {
    const taxableSales = TaxCalculator.sumAllowanceByTaxType(
      items,
      TaxType.TAXABLE
    );
    const taxExemptSales = TaxCalculator.sumAllowanceByTaxType(
      items,
      TaxType.TAX_EXEMPT
    );
    const zeroRatedSales = TaxCalculator.sumAllowanceByTaxType(
      items,
      TaxType.ZERO_RATED
    );

    const taxAmount = TaxCalculator.calculateTaxAmount(
      taxableSales,
      pricesIncludeTax
    );

    const totalAmount = TaxCalculator.calculateTotal(
      taxableSales,
      taxExemptSales,
      zeroRatedSales,
      taxAmount,
      pricesIncludeTax
    );

    return {
      taxableSales,
      taxExemptSales,
      zeroRatedSales,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Calculate tax amount from taxable sales
   */
  static calculateTaxAmount(
    taxableSales: Money,
    pricesIncludeTax: boolean
  ): Money {
    if (pricesIncludeTax) {
      // Tax included: Extract tax from total
      // tax = total - round(total / 1.05)
      const beforeTax = taxableSales.divide(1 + TAX_RATE).round();
      return taxableSales.subtract(beforeTax);
    } else {
      // Tax excluded: Add tax to sales
      // tax = round(sales * 0.05)
      return taxableSales.multiply(TAX_RATE).round();
    }
  }

  /**
   * Calculate net amount (before tax) from tax-included amount
   */
  static extractNetAmount(taxIncludedAmount: Money): Money {
    return taxIncludedAmount.divide(1 + TAX_RATE).round();
  }

  /**
   * Calculate gross amount (after tax) from tax-excluded amount
   */
  static addTax(taxExcludedAmount: Money): Money {
    const tax = taxExcludedAmount.multiply(TAX_RATE).round();
    return taxExcludedAmount.add(tax);
  }

  /**
   * Sum invoice items by tax type
   */
  private static sumByTaxType(
    items: readonly InvoiceItem[],
    taxType: TaxType
  ): Money {
    return items
      .filter((item) => item.taxType === taxType)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Sum allowance items by tax type
   */
  private static sumAllowanceByTaxType(
    items: readonly AllowanceItem[],
    taxType: TaxType
  ): Money {
    return items
      .filter((item) => item.taxType === taxType)
      .reduce((sum, item) => sum.add(item.amount), Money.zero())
      .round();
  }

  /**
   * Calculate total amount
   */
  private static calculateTotal(
    taxableSales: Money,
    taxExemptSales: Money,
    zeroRatedSales: Money,
    taxAmount: Money,
    pricesIncludeTax: boolean
  ): Money {
    if (pricesIncludeTax) {
      // Prices already include tax
      return taxableSales.add(taxExemptSales).add(zeroRatedSales);
    } else {
      // Add tax to total
      return taxableSales
        .add(taxExemptSales)
        .add(zeroRatedSales)
        .add(taxAmount);
    }
  }
}
