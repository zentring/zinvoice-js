import { createHash } from 'crypto';

/**
 * Amego API Signer
 *
 * Generates MD5 signatures for Amego API requests.
 * Format: MD5(data + time + apiKey)
 *
 * 根據光貿 API 文件規格：sign = md5(data JSON string + time + APP Key)
 */
export class AmegoSigner {
  constructor(private readonly apiKey: string) {}

  /**
   * Generate signature for API request
   *
   * @param data - Request data as JSON string
   * @param timestamp - Unix timestamp in seconds
   * @returns MD5 signature in lowercase hex
   */
  sign(data: string, timestamp: number): string {
    // 格式: md5(data + time + apiKey)
    const payload = `${data}${timestamp}${this.apiKey}`;
    return createHash('md5').update(payload, 'utf8').digest('hex').toLowerCase();
  }

  /**
   * Generate current timestamp (Unix seconds)
   */
  static getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
