import { describe, it, expect } from 'vitest';
import { Zinvoice } from './Zinvoice.js';
import { Capability } from './Provider.js';
import { Invoice } from './domain/invoice/Invoice.js';
import { InvoiceNumber } from './domain/invoice/InvoiceNumber.js';
import { InvoiceItem } from './domain/invoice/InvoiceItem.js';
import { Money } from './domain/shared/Money.js';
import { OrderId } from './domain/shared/OrderId.js';
import { Buyer } from './domain/shared/Buyer.js';
import { ValidationError } from './errors/index.js';

describe('CustomProvider', () => {
  const createTestInvoice = () =>
    Invoice.create({
      orderId: OrderId.create('TEST-001'),
      buyer: Buyer.anonymous('測試'),
      items: [
        InvoiceItem.create({
          description: '測試商品',
          quantity: 1,
          unitPrice: Money.create(100),
          amount: Money.create(100),
        }),
      ],
    });

  describe('Zinvoice.custom', () => {
    it('should create custom provider with required handlers', () => {
      const client = Zinvoice.custom({
        name: '測試系統商',
        capabilities: [Capability.B2C, Capability.QUERY, Capability.LIST],
        invoices: {
          issue: async () => ({
            invoiceNumber: InvoiceNumber.create('AA12345678'),
            invoiceTime: new Date(),
            randomNumber: '1234',
            barcode: '',
            qrcodeLeft: '',
            qrcodeRight: '',
          }),
          findByNumber: async () => null,
          findByOrderId: async () => null,
          getStatus: async () => [],
          list: async () => ({
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize: 20,
            hasNextPage: false,
            hasPreviousPage: false,
          }),
        },
      });

      expect(client.provider).toBe('custom');
      expect(client.providerName).toBe('測試系統商');
      expect(client.isCustom).toBe(true);
      expect(client.supports(Capability.B2C)).toBe(true);
      expect(client.supports(Capability.VOID)).toBe(false);
    });

    it('should throw ValidationError when missing required handlers', () => {
      expect(() =>
        Zinvoice.custom({
          name: '測試系統商',
          capabilities: [Capability.B2C], // requires issue
          invoices: {
            // missing issue handler
          },
        })
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError when QUERY capability lacks handlers', () => {
      expect(() =>
        Zinvoice.custom({
          name: '測試系統商',
          capabilities: [Capability.QUERY],
          invoices: {
            findByNumber: async () => null,
            // missing findByOrderId and getStatus
          },
        })
      ).toThrow(ValidationError);
    });

    it('should call custom issue handler', async () => {
      let calledWith: Invoice | null = null;

      const client = Zinvoice.custom({
        name: '測試系統商',
        capabilities: [Capability.B2C],
        invoices: {
          issue: async (invoice) => {
            calledWith = invoice;
            return {
              invoiceNumber: InvoiceNumber.create('BB87654321'),
              invoiceTime: new Date(),
              randomNumber: '5678',
              barcode: 'test-barcode',
              qrcodeLeft: 'left',
              qrcodeRight: 'right',
            };
          },
        },
      });

      const invoice = createTestInvoice();
      const result = await client.invoices.issue(invoice);

      expect(calledWith).toBe(invoice);
      expect(result.invoiceNumber.toString()).toBe('BB87654321');
      expect(result.randomNumber).toBe('5678');
    });

    it('should throw when calling unimplemented method', async () => {
      const client = Zinvoice.custom({
        name: '測試系統商',
        capabilities: [Capability.B2C],
        invoices: {
          issue: async () => ({
            invoiceNumber: InvoiceNumber.create('AA12345678'),
            invoiceTime: new Date(),
            randomNumber: '1234',
            barcode: '',
            qrcodeLeft: '',
            qrcodeRight: '',
          }),
        },
      });

      // void is not in capabilities, should throw UnsupportedCapabilityError
      await expect(
        client.invoices.void(InvoiceNumber.create('AA12345678'))
      ).rejects.toThrow();
    });
  });
});
