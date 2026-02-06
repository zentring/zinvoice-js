/**
 * Base error class for zinvoice
 */
export class ZinvoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZinvoiceError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Invalid Tax ID (統一編號) error
 */
export class InvalidTaxIdError extends ZinvoiceError {
  constructor(public readonly value: string) {
    super(`Invalid tax ID (統一編號): ${value}`);
    this.name = 'InvalidTaxIdError';
  }
}

/**
 * Invalid carrier code (載具條碼) error
 */
export class InvalidCarrierCodeError extends ZinvoiceError {
  constructor(
    public readonly value: string,
    public readonly carrierType: string
  ) {
    super(`Invalid carrier code for type ${carrierType}: ${value}`);
    this.name = 'InvalidCarrierCodeError';
  }
}

/**
 * Invalid invoice number error
 */
export class InvalidInvoiceNumberError extends ZinvoiceError {
  constructor(public readonly value: string) {
    super(`Invalid invoice number (發票號碼): ${value}`);
    this.name = 'InvalidInvoiceNumberError';
  }
}

/**
 * Invalid money amount error
 */
export class InvalidMoneyError extends ZinvoiceError {
  constructor(
    public readonly value: number,
    reason: string
  ) {
    super(`Invalid money amount: ${value} - ${reason}`);
    this.name = 'InvalidMoneyError';
  }
}

/**
 * API error from provider
 */
export class ProviderApiError extends ZinvoiceError {
  constructor(
    public readonly provider: string,
    public readonly code: string,
    message: string
  ) {
    super(`[${provider}] API Error (${code}): ${message}`);
    this.name = 'ProviderApiError';
  }
}

/**
 * Network error
 */
export class NetworkError extends ZinvoiceError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error for domain objects
 */
export class ValidationError extends ZinvoiceError {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(`Validation error on ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * Unsupported capability error
 *
 * Thrown when attempting to use a feature that the provider doesn't support.
 */
export class UnsupportedCapabilityError extends ZinvoiceError {
  constructor(
    public readonly capability: string,
    public readonly provider: string
  ) {
    super(`Provider "${provider}" does not support capability: ${capability}`);
    this.name = 'UnsupportedCapabilityError';
  }
}

/**
 * Provider not implemented error
 */
export class ProviderNotImplementedError extends ZinvoiceError {
  constructor(public readonly provider: string) {
    super(`Provider "${provider}" is not yet implemented`);
    this.name = 'ProviderNotImplementedError';
  }
}
