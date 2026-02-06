import { describe, it, expect } from 'vitest';
import { Money } from './Money.js';
import { InvalidMoneyError } from '../../errors/index.js';

describe('Money', () => {
  describe('create', () => {
    it('should create Money from number', () => {
      const money = Money.create(100);
      expect(money.toNumber()).toBe(100);
    });

    it('should handle decimal numbers', () => {
      const money = Money.create(100.5);
      expect(money.toNumber()).toBe(100.5);
    });

    it('should throw for NaN', () => {
      expect(() => Money.create(NaN)).toThrow(InvalidMoneyError);
    });

    it('should throw for Infinity', () => {
      expect(() => Money.create(Infinity)).toThrow(InvalidMoneyError);
    });
  });

  describe('zero', () => {
    it('should create zero Money', () => {
      const money = Money.zero();
      expect(money.toNumber()).toBe(0);
      expect(money.isZero()).toBe(true);
    });
  });

  describe('arithmetic operations', () => {
    it('should add two Money values', () => {
      const a = Money.create(100);
      const b = Money.create(50);
      expect(a.add(b).toNumber()).toBe(150);
    });

    it('should subtract two Money values', () => {
      const a = Money.create(100);
      const b = Money.create(30);
      expect(a.subtract(b).toNumber()).toBe(70);
    });

    it('should multiply Money by factor', () => {
      const money = Money.create(100);
      expect(money.multiply(1.5).toNumber()).toBe(150);
    });

    it('should divide Money by divisor', () => {
      const money = Money.create(100);
      expect(money.divide(4).toNumber()).toBe(25);
    });

    it('should throw when dividing by zero', () => {
      const money = Money.create(100);
      expect(() => money.divide(0)).toThrow(InvalidMoneyError);
    });
  });

  describe('round', () => {
    it('should round to nearest integer by default', () => {
      const money = Money.create(100.6);
      expect(money.round().toNumber()).toBe(101);
    });

    it('should round to specified decimal places', () => {
      const money = Money.create(100.567);
      expect(money.round(2).toNumber()).toBe(100.57);
    });
  });

  describe('comparison', () => {
    it('should check equality', () => {
      const a = Money.create(100);
      const b = Money.create(100);
      expect(a.equals(b)).toBe(true);
    });

    it('should check if positive', () => {
      expect(Money.create(100).isPositive()).toBe(true);
      expect(Money.create(-100).isPositive()).toBe(false);
      expect(Money.zero().isPositive()).toBe(false);
    });

    it('should check if negative', () => {
      expect(Money.create(-100).isNegative()).toBe(true);
      expect(Money.create(100).isNegative()).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format as string', () => {
      const money = Money.create(1234.56);
      expect(money.toString()).toBe('1234.56');
    });
  });
});
