/**
 * 測試腳本：驗證 Zinvoice Facade API
 *
 * 使用新的 Zinvoice facade 來驗證整個 lib 是否正常運作
 *
 * 光貿測試帳號：
 * - 統編: 12345678
 * - API Key: sHeq7t8G1wiQvhAuIM27
 */
import {
  Zinvoice,
  Provider,
  Capability,
  InvoiceQuery,
  LocalDate,
  DateRange,
  Pagination,
} from '../src/index.js';

// 測試設定
const TEST_CONFIG = {
  provider: Provider.AMEGO,
  sellerTaxId: '12345678',
  apiKey: 'sHeq7t8G1wiQvhAuIM27',
};

async function testZinvoiceCreation() {
  console.log('\n=== 測試 Zinvoice 建立 ===\n');

  try {
    const client = Zinvoice.create(TEST_CONFIG);

    console.log(`✅ Zinvoice client 建立成功`);
    console.log(`   Provider: ${client.provider}`);
    console.log(`   Provider Name: ${client.providerName}`);
    console.log(`   Capabilities: ${client.getCapabilities().join(', ')}`);

    return client;
  } catch (error) {
    console.error('❌ Zinvoice 建立失敗:', error);
    throw error;
  }
}

function testCapabilities(client: Zinvoice) {
  console.log('\n=== 測試 Capability 系統 ===\n');

  const capabilities = [
    Capability.B2C,
    Capability.B2B,
    Capability.CARRIER,
    Capability.DONATION,
    Capability.ALLOWANCE,
    Capability.VOID,
    Capability.QUERY,
    Capability.LIST,
  ];

  for (const cap of capabilities) {
    const supported = client.supports(cap);
    console.log(`   ${cap}: ${supported ? '✅' : '❌'}`);
  }

  console.log('\n✅ Capability 系統測試完成');
}

async function testInvoiceList(client: Zinvoice) {
  console.log('\n=== 測試發票列表 API (新 facade) ===\n');

  try {
    // 使用新的 InvoiceQuery value object
    const query = InvoiceQuery.create({
      dateRange: DateRange.between(
        LocalDate.of(2023, 1, 1),
        LocalDate.of(2026, 12, 31)
      ),
      pagination: Pagination.create({ limit: 20, page: 1 }),
    });

    console.log(`   查詢條件:`);
    console.log(`     日期範圍: ${query.dateRange.start.toNumber()} ~ ${query.dateRange.end.toNumber()}`);
    console.log(`     分頁: 第 ${query.pagination.page} 頁, 每頁 ${query.pagination.limit} 筆`);

    const result = await client.invoices.list(query);

    console.log(`\n   查詢結果:`);
    console.log(`     總筆數: ${result.totalCount}`);
    console.log(`     總頁數: ${result.totalPages}`);
    console.log(`     目前頁: ${result.currentPage}`);
    console.log(`     本頁筆數: ${result.items.length}`);
    console.log(`     有下一頁: ${result.hasNextPage}`);

    if (result.items.length > 0) {
      console.log(`\n   前 3 張發票:`);
      for (const invoice of result.items.slice(0, 3)) {
        console.log(`     - ${invoice.invoiceNumber?.toString() ?? 'N/A'}`);
        console.log(`       買方: ${invoice.buyerName}`);
        console.log(`       金額: $${invoice.calculateTotalAmount().toNumber()}`);
      }
    }

    console.log('\n✅ 發票列表 API 測試成功！');
    return result.items[0] ?? null;
  } catch (error) {
    console.error('❌ 發票列表 API 測試失敗:', error);
    return null;
  }
}

async function testInvoiceQuery(client: Zinvoice, invoiceNumber: string | null) {
  if (!invoiceNumber) {
    console.log('\n⚠️ 跳過單張發票查詢測試 (無可用發票號碼)');
    return;
  }

  console.log(`\n=== 測試單張發票查詢 API (${invoiceNumber}) ===\n`);

  try {
    const { InvoiceNumber } = await import('../src/domain/invoice/InvoiceNumber.js');
    const invNum = InvoiceNumber.create(invoiceNumber);

    const invoice = await client.invoices.findByNumber(invNum);

    if (invoice) {
      console.log(`   發票號碼: ${invoice.invoiceNumber?.toString()}`);
      console.log(`   訂單編號: ${invoice.orderId}`);
      console.log(`   買方名稱: ${invoice.buyerName}`);
      console.log(`   總金額: $${invoice.calculateTotalAmount().toNumber()}`);
      console.log(`   商品數: ${invoice.items.length}`);

      console.log('\n✅ 單張發票查詢 API 測試成功！');
    } else {
      console.log('   查無發票資料 (可能超過查詢期限)');
      console.log('\n⚠️ API 已呼叫，但無可用資料');
    }
  } catch (error) {
    console.error('❌ 單張發票查詢 API 測試失敗:', error);
  }
}

async function testInvoiceStatus(client: Zinvoice, invoiceNumber: string | null) {
  if (!invoiceNumber) {
    console.log('\n⚠️ 跳過發票狀態查詢測試 (無可用發票號碼)');
    return;
  }

  console.log(`\n=== 測試發票狀態查詢 API ===\n`);

  try {
    const { InvoiceNumber } = await import('../src/domain/invoice/InvoiceNumber.js');
    const invNum = InvoiceNumber.create(invoiceNumber);

    const statuses = await client.invoices.getStatus([invNum]);

    if (statuses.length > 0) {
      for (const status of statuses) {
        console.log(`   發票號碼: ${status.invoiceNumber}`);
        console.log(`   類型: ${status.type}`);
        console.log(`   狀態: ${status.status}`);
        console.log(`   總金額: $${status.totalAmount}`);
      }

      console.log('\n✅ 發票狀態查詢 API 測試成功！');
    } else {
      console.log('   查無狀態資料');
      console.log('\n⚠️ API 已呼叫，但無可用資料');
    }
  } catch (error) {
    console.error('❌ 發票狀態查詢 API 測試失敗:', error);
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('       Zinvoice Facade API 整合測試');
  console.log('═'.repeat(60));
  console.log(`測試 Provider: ${TEST_CONFIG.provider}`);
  console.log(`測試統編: ${TEST_CONFIG.sellerTaxId}`);

  // 1. 測試 Zinvoice 建立
  const client = await testZinvoiceCreation();

  // 2. 測試 Capability 系統
  testCapabilities(client);

  // 3. 測試發票列表
  const firstInvoice = await testInvoiceList(client);
  const invoiceNumber = firstInvoice?.invoiceNumber?.toString() ?? null;

  // 4. 測試單張發票查詢
  await testInvoiceQuery(client, invoiceNumber);

  // 5. 測試發票狀態查詢
  await testInvoiceStatus(client, invoiceNumber);

  console.log('\n' + '═'.repeat(60));
  console.log('                   測試完成');
  console.log('═'.repeat(60));
}

main().catch(console.error);
