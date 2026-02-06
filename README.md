# zinvoice

台灣電子發票 Node.js SDK - 支援多家加值中心

[![npm version](https://img.shields.io/npm/v/@zentring/zinvoice.svg)](https://www.npmjs.com/package/@zentring/zinvoice)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 特色

- 統一 API 介面，支援加值中心 (光貿)
- 完整支援台灣電子發票 MIG 4.0 規格
- 強型別設計，編譯期即可驗證參數
- 能力檢查機制，處理各平台功能差異
- TypeScript 原生支援
- DDD 架構設計

## 安裝

```bash
npm install @zentring/zinvoice
```

## 快速開始

### 建立 Client

```typescript
import { Zinvoice, Provider } from '@zentring/zinvoice';

const client = Zinvoice.create({
  provider: Provider.AMEGO,  // 光貿
  sellerTaxId: '12345678',
  apiKey: 'your-api-key',
});
```

### 開立 B2C 發票

```typescript
import { Invoice, InvoiceItem, TaxId, Money, Buyer } from '@zentring/zinvoice';

const invoice = Invoice.create({
  orderId: OrderId.create('ORDER-2024-001'),
  buyer: Buyer.anonymous('客人'),  // B2C 不需統編
  items: [
    InvoiceItem.create({
      description: '商品 A',
      quantity: 2,
      unitPrice: Money.of(500),
    }),
  ],
});

const result = await client.invoices.issue(invoice);

console.log(`發票號碼: ${result.invoiceNumber}`);
console.log(`隨機碼: ${result.randomNumber}`);
```

### 開立 B2B 發票

```typescript
const b2bInvoice = Invoice.create({
  orderId: OrderId.create('B2B-001'),
  buyer: Buyer.company({
    taxId: TaxId.create('87654321'),
    name: '某某股份有限公司',
    address: '台北市信義區某某路 100 號',
    email: 'accounting@example.com',
  }),
  items: [
    InvoiceItem.create({
      description: '顧問服務費',
      quantity: 1,
      unitPrice: Money.of(50000),
    }),
  ],
});

await client.invoices.issue(b2bInvoice);
```

### 使用載具

```typescript
import { Carrier } from '@zentring/zinvoice';

const invoice = Invoice.create({
  orderId: OrderId.create('ORDER-003'),
  buyer: Buyer.anonymous('客人'),
  carrier: Carrier.mobile('/ABC+123'),  // 手機條碼
  items: [...],
});

// 或自然人憑證
const invoice2 = Invoice.create({
  // ...
  carrier: Carrier.certificate('AB12345678901234'),
  // ...
});
```

### 捐贈發票

```typescript
import { Donation } from '@zentring/zinvoice';

const invoice = Invoice.create({
  orderId: OrderId.create('ORDER-005'),
  buyer: Buyer.anonymous('客人'),
  donation: Donation.code('025'),  // 愛心碼
  items: [...],
});
```

### 查詢發票列表

```typescript
import { InvoiceQuery, DateRange, LocalDate } from '@zentring/zinvoice';

const query = InvoiceQuery.create({
  dateRange: DateRange.between(
    LocalDate.of(2024, 1, 1),
    LocalDate.of(2024, 12, 31)
  ),
  dateType: DateType.INVOICE_DATE,
  pagination: Pagination.create({ page: 1, limit: 20 }),
});

const result = await client.invoices.list(query);

console.log(`共 ${result.totalCount} 張發票`);
for (const invoice of result.items) {
  console.log(`${invoice.invoiceNumber} - ${invoice.buyer.name}`);
}
```

### 查詢單張發票

```typescript
import { InvoiceNumber } from '@zentring/zinvoice';

const invoice = await client.invoices.findByNumber(
  InvoiceNumber.create('AB12345678')
);

if (invoice) {
  console.log(`買方: ${invoice.buyer.name}`);
  console.log(`金額: ${invoice.totalAmount}`);
}
```

### 作廢發票

```typescript
await client.invoices.void(InvoiceNumber.create('AB12345678'));
```

## 折讓單

### 開立折讓

```typescript
import { Allowance, AllowanceItem } from '@zentring/zinvoice';

const allowance = Allowance.create({
  originalInvoice: InvoiceNumber.create('AB12345678'),
  originalDate: LocalDate.of(2024, 1, 15),
  buyer: Buyer.anonymous('客人'),
  items: [
    AllowanceItem.create({
      description: '退貨商品',
      quantity: 1,
      unitPrice: Money.of(1000),
    }),
  ],
});

const result = await client.allowances.issue(allowance);
console.log(`折讓單號: ${result.allowanceNumber}`);
```

## 能力檢查

不同加值中心支援的功能不同，可透過能力檢查確認：

```typescript
import { Capability } from '@zentring/zinvoice';

// 檢查是否支援特定功能
if (client.supports(Capability.CARRIER)) {
  // 支援載具
}

if (client.supports(Capability.EXCHANGE)) {
  // 支援換開發票
  await client.invoices.exchange(...);
}

// 取得所有支援的能力
const capabilities = client.getCapabilities();
console.log(capabilities);
// [Capability.B2C, Capability.B2B, Capability.CARRIER, ...]
```

### 能力列表

| 能力 | 說明 | 光貿 |
|------|------|:----:|
| `B2C` | B2C 發票 | ✓ |
| `B2B` | B2B 發票 | ✓ |
| `CARRIER` | 載具 | ✓ |
| `DONATION` | 捐贈 | ✓ |
| `ALLOWANCE` | 折讓 | ✓ |
| `VOID` | 作廢 | ✓ |
| `EXCHANGE` | 換開 | ✓ |
| `PRINT` | 列印格式 | ✓ |

## 錯誤處理

```typescript
import {
  ZinvoiceError,
  ProviderError,
  ValidationError,
  NetworkError,
  UnsupportedCapabilityError,
} from '@zentring/zinvoice';

try {
  await client.invoices.issue(invoice);
} catch (error) {
  if (error instanceof ValidationError) {
    // 參數驗證錯誤（編譯期就能避免大部分）
    console.error(`驗證錯誤: ${error.field} - ${error.message}`);
  } else if (error instanceof ProviderError) {
    // 加值中心 API 錯誤
    console.error(`API 錯誤 [${error.code}]: ${error.message}`);
  } else if (error instanceof UnsupportedCapabilityError) {
    // 該平台不支援此功能
    console.error(`不支援: ${error.capability}`);
  } else if (error instanceof NetworkError) {
    // 網路錯誤
    console.error(`網路錯誤: ${error.message}`);
  }
}
```

## 支援的加值中心

| Provider | 狀態 | 說明 |
|----------|:----:|------|
| `Provider.AMEGO` | ✓ | 光貿資訊 |

## 測試帳號

光貿提供測試帳號供開發使用：

```typescript
const client = Zinvoice.create({
  provider: Provider.AMEGO,
  sellerTaxId: '12345678',
  apiKey: 'sHeq7t8G1wiQvhAuIM27',
});
```

## 授權

Apache License 2.0

## 作者

天日科技有限公司 (Zentring LTD.)
