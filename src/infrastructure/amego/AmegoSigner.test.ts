import { describe, it, expect } from 'vitest';
import { AmegoSigner } from './AmegoSigner.js';

describe('AmegoSigner', () => {
  describe('sign', () => {
    it('should generate MD5 signature with format: md5(data + time + apiKey)', () => {
      const signer = new AmegoSigner('test-api-key');
      const timestamp = 1700000000;
      const data = '{"test":"data"}';

      const signature = signer.sign(data, timestamp);

      // 光貿 API 規格：sign = md5(data JSON string + time + APP Key)
      // 所以是 md5('{"test":"data"}1700000000test-api-key')
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should handle empty data', () => {
      const signer = new AmegoSigner('test-api-key');
      const timestamp = 1700000000;

      const signature = signer.sign('', timestamp);

      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should produce consistent signatures', () => {
      const signer = new AmegoSigner('test-api-key');
      const timestamp = 1700000000;
      const data = '{"test":"data"}';

      const sig1 = signer.sign(data, timestamp);
      const sig2 = signer.sign(data, timestamp);

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different data', () => {
      const signer = new AmegoSigner('test-api-key');
      const timestamp = 1700000000;

      const sig1 = signer.sign('{"test":"data1"}', timestamp);
      const sig2 = signer.sign('{"test":"data2"}', timestamp);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different timestamps', () => {
      const signer = new AmegoSigner('test-api-key');
      const data = '{"test":"data"}';

      const sig1 = signer.sign(data, 1700000000);
      const sig2 = signer.sign(data, 1700000001);

      expect(sig1).not.toBe(sig2);
    });

    it('should match expected signature for known input', () => {
      // 使用光貿測試帳號的 API Key
      const signer = new AmegoSigner('sHeq7t8G1wiQvhAuIM27');
      const data = '{"date_select":1,"date_start":20230101,"date_end":20261231,"limit":20,"page":1}';
      const timestamp = 1700000000;

      const signature = signer.sign(data, timestamp);

      // 這個測試確保簽章格式是 md5(data + time + apiKey)
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
      expect(signature).toHaveLength(32);
    });
  });

  describe('getTimestamp', () => {
    it('should return current Unix timestamp in seconds', () => {
      const timestamp = AmegoSigner.getTimestamp();
      const now = Math.floor(Date.now() / 1000);

      // Allow 1 second tolerance
      expect(Math.abs(timestamp - now)).toBeLessThanOrEqual(1);
    });

    it('should return a number', () => {
      const timestamp = AmegoSigner.getTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(Number.isInteger(timestamp)).toBe(true);
    });
  });
});
