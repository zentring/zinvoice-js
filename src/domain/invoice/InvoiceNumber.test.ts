import { describe, it, expect } from 'vitest';
import { InvoiceNumber } from './InvoiceNumber.js';
import { InvalidInvoiceNumberError } from '../../errors/index.js';

describe('InvoiceNumber', () => {
  describe('create', () => {
    it('should create a valid InvoiceNumber', () => {
      const number = InvoiceNumber.create('AB12345678');
      expect(number.toString()).toBe('AB12345678');
    });

    it('should normalize to uppercase', () => {
      const number = InvoiceNumber.create('ab12345678');
      expect(number.toString()).toBe('AB12345678');
    });

    it('should trim whitespace', () => {
      const number = InvoiceNumber.create(' AB12345678 ');
      expect(number.toString()).toBe('AB12345678');
    });

    it('should throw for invalid format - wrong length', () => {
      expect(() => InvoiceNumber.create('AB1234567')).toThrow(
        InvalidInvoiceNumberError
      );
      expect(() => InvoiceNumber.create('AB123456789')).toThrow(
        InvalidInvoiceNumberError
      );
    });

    it('should throw for invalid format - wrong prefix', () => {
      expect(() => InvoiceNumber.create('A112345678')).toThrow(
        InvalidInvoiceNumberError
      );
      expect(() => InvoiceNumber.create('1B12345678')).toThrow(
        InvalidInvoiceNumberError
      );
    });

    it('should throw for invalid format - non-digits suffix', () => {
      expect(() => InvoiceNumber.create('AB1234567A')).toThrow(
        InvalidInvoiceNumberError
      );
    });
  });

  describe('tryCreate', () => {
    it('should return InvoiceNumber for valid input', () => {
      const number = InvoiceNumber.tryCreate('AB12345678');
      expect(number).not.toBeNull();
      expect(number?.toString()).toBe('AB12345678');
    });

    it('should return null for invalid input', () => {
      const number = InvoiceNumber.tryCreate('invalid');
      expect(number).toBeNull();
    });
  });

  describe('getTrack', () => {
    it('should return the track (first 2 letters)', () => {
      const number = InvoiceNumber.create('AB12345678');
      expect(number.getTrack()).toBe('AB');
    });
  });

  describe('getNumber', () => {
    it('should return the number part (last 8 digits)', () => {
      const number = InvoiceNumber.create('AB12345678');
      expect(number.getNumber()).toBe('12345678');
    });
  });

  describe('equals', () => {
    it('should return true for equal numbers', () => {
      const a = InvoiceNumber.create('AB12345678');
      const b = InvoiceNumber.create('AB12345678');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different numbers', () => {
      const a = InvoiceNumber.create('AB12345678');
      const b = InvoiceNumber.create('CD87654321');
      expect(a.equals(b)).toBe(false);
    });
  });
});
