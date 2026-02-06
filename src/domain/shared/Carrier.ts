import { ValidationError } from '../../errors/index.js';

/**
 * Carrier type codes as defined by Taiwan MOF
 */
export enum CarrierType {
  /** 無載具 */
  NONE = '',
  /** 手機條碼 */
  MOBILE = '3J0002',
  /** 自然人憑證 */
  CERTIFICATE = 'CQ0001',
  /** 光貿會員載具 */
  AMEGO_MEMBER = 'amego',
}

/**
 * Carrier Value Object
 *
 * 發票載具資訊。支援手機條碼、自然人憑證等。
 */
export class Carrier {
  private constructor(
    private readonly _type: CarrierType,
    private readonly _id: string
  ) {}

  /**
   * Create a "no carrier" instance
   */
  static none(): Carrier {
    return new Carrier(CarrierType.NONE, '');
  }

  /**
   * Create a mobile barcode carrier (手機條碼)
   *
   * @param barcode The mobile barcode (format: /XXXXXXX)
   */
  static mobile(barcode: string): Carrier {
    const trimmed = barcode?.trim();

    if (!trimmed) {
      throw new ValidationError('carrier', 'Mobile barcode is required');
    }

    // 手機條碼格式: / + 7碼英數字 (大寫)
    const pattern = /^\/[0-9A-Z.+-]{7}$/;
    if (!pattern.test(trimmed.toUpperCase())) {
      throw new ValidationError(
        'carrier',
        'Invalid mobile barcode format. Expected: /XXXXXXX'
      );
    }

    return new Carrier(CarrierType.MOBILE, trimmed.toUpperCase());
  }

  /**
   * Create a certificate carrier (自然人憑證)
   *
   * @param certId The certificate ID (16 characters)
   */
  static certificate(certId: string): Carrier {
    const trimmed = certId?.trim();

    if (!trimmed) {
      throw new ValidationError('carrier', 'Certificate ID is required');
    }

    // 自然人憑證格式: 16碼英數字
    if (!/^[A-Z0-9]{16}$/i.test(trimmed)) {
      throw new ValidationError(
        'carrier',
        'Invalid certificate ID format. Expected: 16 alphanumeric characters'
      );
    }

    return new Carrier(CarrierType.CERTIFICATE, trimmed.toUpperCase());
  }

  /**
   * Create a custom carrier
   */
  static custom(type: CarrierType, id: string): Carrier {
    if (type === CarrierType.NONE) {
      return Carrier.none();
    }
    return new Carrier(type, id?.trim() ?? '');
  }

  /**
   * Get the carrier type
   */
  get type(): CarrierType {
    return this._type;
  }

  /**
   * Get the carrier type code (for API)
   */
  get typeCode(): string {
    return this._type;
  }

  /**
   * Get the carrier ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Check if this is an empty carrier
   */
  get isEmpty(): boolean {
    return this._type === CarrierType.NONE;
  }

  /**
   * Check if this is a mobile barcode
   */
  get isMobile(): boolean {
    return this._type === CarrierType.MOBILE;
  }

  /**
   * Check if this is a certificate
   */
  get isCertificate(): boolean {
    return this._type === CarrierType.CERTIFICATE;
  }
}
