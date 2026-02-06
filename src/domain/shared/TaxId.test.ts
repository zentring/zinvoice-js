import { describe, it, expect } from 'vitest';
import { TaxId } from './TaxId.js';
import { InvalidTaxIdError } from '../../errors/index.js';

describe('TaxId', () => {
  describe('create', () => {
    it('should create a valid TaxId', () => {
      const taxId = TaxId.create('04595257');
      expect(taxId.toString()).toBe('04595257');
    });

    it('should handle TaxId with 7 in 4th position (雙驗證)', () => {
      // 統一編號第 4 碼為 7 時有兩種驗證方式
      const taxId = TaxId.create('12345676');
      expect(taxId.toString()).toBe('12345676');
    });

    it('should throw for invalid format', () => {
      expect(() => TaxId.create('1234567')).toThrow(InvalidTaxIdError);
      expect(() => TaxId.create('123456789')).toThrow(InvalidTaxIdError);
      expect(() => TaxId.create('ABCDEFGH')).toThrow(InvalidTaxIdError);
    });

    it('should throw for invalid checksum', () => {
      expect(() => TaxId.create('12345679')).toThrow(InvalidTaxIdError);
    });
  });

  describe('none', () => {
    it('should create a none TaxId for B2C', () => {
      const taxId = TaxId.none();
      expect(taxId.toString()).toBe('0000000000');
      expect(taxId.isNone()).toBe(true);
    });
  });

  describe('tryCreate', () => {
    it('should return TaxId for valid input', () => {
      const taxId = TaxId.tryCreate('04595257');
      expect(taxId).not.toBeNull();
      expect(taxId?.toString()).toBe('04595257');
    });

    it('should return null for invalid input', () => {
      const taxId = TaxId.tryCreate('invalid');
      expect(taxId).toBeNull();
    });
  });

  describe('isValid static', () => {
    it('should validate correctly', () => {
      expect(TaxId.isValid('04595257')).toBe(true);
      expect(TaxId.isValid('12345678')).toBe(false);
      expect(TaxId.isValid('invalid')).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal TaxIds', () => {
      const taxId1 = TaxId.create('04595257');
      const taxId2 = TaxId.create('04595257');
      expect(taxId1.equals(taxId2)).toBe(true);
    });

    it('should return false for different TaxIds', () => {
      const taxId1 = TaxId.create('04595257');
      const taxId2 = TaxId.none();
      expect(taxId1.equals(taxId2)).toBe(false);
    });
  });
});
