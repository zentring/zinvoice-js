import { AmegoConfig, AMEGO_DEFAULTS } from './AmegoConfig.js';
import { AmegoSigner } from './AmegoSigner.js';
import { ProviderApiError, NetworkError } from '../../errors/index.js';

/**
 * Amego API Response wrapper
 *
 * 光貿 API 回應格式：
 * - code: 回應代碼 (0 = 成功)
 * - msg: 回應訊息
 * - 其他欄位視 API 而定 (data, page_total, page_now, data_total 等)
 */
export interface AmegoResponse {
  /** 回應代碼 (0 = success) */
  code: number;
  /** 回應訊息 */
  msg: string;
  /** 其他欄位 */
  [key: string]: unknown;
}

/**
 * Amego HTTP Client
 *
 * Low-level HTTP client for Amego API communication.
 *
 * 根據光貿 API 文件規格：
 * - Content-Type: application/x-www-form-urlencoded
 * - 參數: invoice (統編), data (JSON string), time (timestamp), sign (MD5 signature)
 */
export class AmegoClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly signer: AmegoSigner;
  private readonly sellerTaxId: string;

  constructor(config: AmegoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout ?? AMEGO_DEFAULTS.TIMEOUT;
    this.signer = new AmegoSigner(config.apiKey);
    this.sellerTaxId = config.sellerTaxId;
  }

  /**
   * Send POST request to Amego API
   *
   * 請求格式：application/x-www-form-urlencoded
   * 參數：
   * - invoice: 統一編號
   * - data: URL encoded JSON string
   * - time: Unix timestamp
   * - sign: MD5(data + time + apiKey)
   */
  async post<T>(endpoint: string, data: object): Promise<T> {
    const timestamp = AmegoSigner.getTimestamp();
    const jsonData = JSON.stringify(data);
    const signature = this.signer.sign(jsonData, timestamp);

    const url = `${this.baseUrl}${endpoint}`;

    // 建立 form-urlencoded body
    const formData = new URLSearchParams();
    formData.append('invoice', this.sellerTaxId);
    formData.append('data', jsonData);
    formData.append('time', timestamp.toString());
    formData.append('sign', signature);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ProviderApiError(
          'amego',
          `HTTP ${response.status}`,
          `HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as AmegoResponse;

      // 光貿 API 回應 code=0 表示成功
      if (result.code !== 0) {
        throw new ProviderApiError(
          'amego',
          String(result.code),
          result.msg || 'Unknown error'
        );
      }

      // 回傳完整的回應物件 (讓呼叫者取需要的欄位)
      // 對於一般 API，資料在 result.data
      // 對於列表 API，page_total, page_now, data_total, data 都在 root level
      return result as unknown as T;
    } catch (error) {
      if (error instanceof ProviderApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError(`Request timeout after ${this.timeout}ms`);
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError('Unknown network error');
    }
  }

  /**
   * Send POST request and return raw response (for debugging)
   */
  async postRaw(endpoint: string, data: object): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    parsed?: AmegoResponse;
  }> {
    const timestamp = AmegoSigner.getTimestamp();
    const jsonData = JSON.stringify(data);
    const signature = this.signer.sign(jsonData, timestamp);

    const url = `${this.baseUrl}${endpoint}`;

    const formData = new URLSearchParams();
    formData.append('invoice', this.sellerTaxId);
    formData.append('data', jsonData);
    formData.append('time', timestamp.toString());
    formData.append('sign', signature);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = await response.text();
    let parsed: AmegoResponse | undefined;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Not JSON
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      parsed,
    };
  }
}
