import { describe, it, expect } from 'vitest';
import { Invoice, InvoiceStatus, InvoiceType } from './Invoice.js';
import { InvoiceItem } from './InvoiceItem.js';
import { TaxId } from '../shared/TaxId.js';
import { Money } from '../shared/Money.js';
import { OrderId } from '../shared/OrderId.js';
import { Buyer } from '../shared/Buyer.js';
import { ValidationError } from '../../errors/index.js';

describe('Invoice', () => {
  const createTestItem = (amount: number = 100) =>
    InvoiceItem.create({
      description: '測試商品',
      quantity: 1,
      unitPrice: Money.create(amount),
      amount: Money.create(amount),
    });

  describe('create', () => {
    it('should create a B2C invoice without tax ID', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.anonymous('測試買家'),
        items: [createTestItem()],
      });

      expect(invoice.orderId.toString()).toBe('ORDER-001');
      expect(invoice.buyer.name).toBe('測試買家');
      expect(invoice.isB2B).toBe(false);
      expect(invoice.type).toBe(InvoiceType.B2C_ISSUE);
      expect(invoice.status).toBe(InvoiceStatus.PENDING);
    });

    it('should create a B2B invoice with tax ID', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-002'),
        buyer: Buyer.company({
          taxId: TaxId.create('04595257'),
          name: '測試公司',
        }),
        items: [createTestItem()],
      });

      expect(invoice.isB2B).toBe(true);
      expect(invoice.type).toBe(InvoiceType.B2B_ISSUE);
    });

    it('should throw for empty orderId', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create(''),
          buyer: Buyer.anonymous('測試'),
          items: [createTestItem()],
        })
      ).toThrow(ValidationError);
    });

    it('should throw for orderId exceeding 40 chars', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create('A'.repeat(41)),
          buyer: Buyer.anonymous('測試'),
          items: [createTestItem()],
        })
      ).toThrow(ValidationError);
    });

    it('should throw for empty buyerName', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create('ORDER-001'),
          buyer: Buyer.anonymous(''),
          items: [createTestItem()],
        })
      ).toThrow(ValidationError);
    });

    it('should throw for invalid buyerName (0, 00, 000, 0000)', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create('ORDER-001'),
          buyer: Buyer.anonymous('0'),
          items: [createTestItem()],
        })
      ).toThrow(ValidationError);
    });

    it('should throw for empty items', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create('ORDER-001'),
          buyer: Buyer.anonymous('測試'),
          items: [],
        })
      ).toThrow(ValidationError);
    });

    it('should throw for remark exceeding 200 chars', () => {
      expect(() =>
        Invoice.create({
          orderId: OrderId.create('ORDER-001'),
          buyer: Buyer.anonymous('測試'),
          items: [createTestItem()],
          remark: 'A'.repeat(201),
        })
      ).toThrow(ValidationError);
    });
  });

  describe('calculateTaxAmount', () => {
    it('should return 0 for B2C invoice', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.anonymous('測試買家'),
        items: [createTestItem(1000)],
      });

      expect(invoice.calculateTaxAmount().toNumber()).toBe(0);
    });

    it('should calculate 5% tax for B2B invoice (tax included)', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.company({
          taxId: TaxId.create('04595257'),
          name: '測試公司',
        }),
        items: [createTestItem(1050)],
        pricesIncludeTax: true,
      });

      // tax = 1050 - round(1050/1.05) = 1050 - 1000 = 50
      expect(invoice.calculateTaxAmount().toNumber()).toBe(50);
    });

    it('should calculate 5% tax for B2B invoice (tax excluded)', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.company({
          taxId: TaxId.create('04595257'),
          name: '測試公司',
        }),
        items: [createTestItem(1000)],
        pricesIncludeTax: false,
      });

      // tax = round(1000 * 0.05) = 50
      expect(invoice.calculateTaxAmount().toNumber()).toBe(50);
    });
  });

  describe('calculateTotalAmount', () => {
    it('should sum all items for tax included', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.anonymous('測試買家'),
        items: [createTestItem(100), createTestItem(200)],
        pricesIncludeTax: true,
      });

      expect(invoice.calculateTotalAmount().toNumber()).toBe(300);
    });

    it('should add tax to total for tax excluded (B2B)', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.company({
          taxId: TaxId.create('04595257'),
          name: '測試公司',
        }),
        items: [createTestItem(1000)],
        pricesIncludeTax: false,
      });

      // total = 1000 + 50 = 1050
      expect(invoice.calculateTotalAmount().toNumber()).toBe(1050);
    });
  });

  describe('state mutations', () => {
    it('should mark as voided', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.anonymous('測試買家'),
        items: [createTestItem()],
      });

      invoice.markAsVoided();
      expect(invoice.type).toBe(InvoiceType.B2C_VOID);
    });

    it('should update status', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.anonymous('測試買家'),
        items: [createTestItem()],
      });

      invoice.updateStatus(InvoiceStatus.COMPLETED);
      expect(invoice.status).toBe(InvoiceStatus.COMPLETED);
    });
  });

  describe('backward compatibility getters', () => {
    it('should provide deprecated getters for buyer fields', () => {
      const invoice = Invoice.create({
        orderId: OrderId.create('ORDER-001'),
        buyer: Buyer.company({
          taxId: TaxId.create('04595257'),
          name: '測試公司',
          address: '台北市',
          phone: '02-1234567',
          email: 'test@example.com',
        }),
        items: [createTestItem()],
      });

      expect(invoice.buyerTaxId.toString()).toBe('04595257');
      expect(invoice.buyerName).toBe('測試公司');
      expect(invoice.buyerAddress).toBe('台北市');
      expect(invoice.buyerPhone).toBe('02-1234567');
      expect(invoice.buyerEmail).toBe('test@example.com');
    });
  });
});
