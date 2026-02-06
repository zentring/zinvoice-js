/**
 * 測試腳本：驗證發票 API 整合
 *
 * 使用光貿測試帳號驗證：
 * - 發票列表查詢
 * - 單張發票查詢
 * - 發票狀態查詢
 *
 * 統編: 12345678
 * API Key: sHeq7t8G1wiQvhAuIM27
 */
import { AmegoInvoiceRepository } from '../src/infrastructure/amego/AmegoInvoiceRepository.js';
import { AmegoConfig, AMEGO_DEFAULTS } from '../src/infrastructure/amego/AmegoConfig.js';
import { InvoiceNumber } from '../src/domain/invoice/InvoiceNumber.js';

const config: AmegoConfig = {
  baseUrl: AMEGO_DEFAULTS.BASE_URL,
  sellerTaxId: '12345678',
  apiKey: 'sHeq7t8G1wiQvhAuIM27',
  timeout: 30000,
};

async function testInvoiceList() {
  console.log('\n=== 測試發票列表 API ===\n');

  const repo = new AmegoInvoiceRepository(config);

  try {
    const result = await repo.list({
      dateType: 1, // 發票日期
      startDate: '20230101',
      endDate: '20261231',
      limit: 20,
      page: 1,
    });

    console.log(`總筆數: ${result.totalCount}`);
    console.log(`總頁數: ${result.totalPages}`);
    console.log(`目前頁: ${result.currentPage}`);
    console.log(`本頁筆數: ${result.invoices.length}\n`);

    if (result.invoices.length > 0) {
      console.log('前 5 張發票:');
      for (const inv of result.invoices.slice(0, 5)) {
        console.log(`  - ${inv.invoice.invoiceNumber?.toString() ?? 'N/A'}`);
        console.log(`    買方: ${inv.invoice.buyerName}`);
        console.log(`    金額: ${inv.invoice.calculateTotalAmount().toNumber()}`);
        console.log(`    狀態: ${inv.status}`);
      }
    }

    console.log('\n✅ 發票列表 API 測試成功！');
    return result.invoices.length > 0 ? result.invoices[0].invoice.invoiceNumber : null;
  } catch (error) {
    console.error('❌ 發票列表 API 測試失敗:', error);
    return null;
  }
}

async function testInvoiceQuery(invoiceNumber: InvoiceNumber | null) {
  if (!invoiceNumber) {
    console.log('\n⚠️ 跳過單張發票查詢測試 (無可用發票號碼)');
    return;
  }

  console.log(`\n=== 測試單張發票查詢 API (${invoiceNumber.toString()}) ===\n`);

  const repo = new AmegoInvoiceRepository(config);

  try {
    const result = await repo.findByInvoiceNumber(invoiceNumber);

    if (result) {
      console.log(`發票號碼: ${result.invoice.invoiceNumber?.toString()}`);
      console.log(`訂單編號: ${result.invoice.orderId}`);
      console.log(`買方名稱: ${result.invoice.buyerName}`);
      console.log(`買方統編: ${result.invoice.buyerTaxId.toString()}`);
      console.log(`總金額: ${result.invoice.calculateTotalAmount().toNumber()}`);
      console.log(`狀態: ${result.status}`);
      console.log(`商品數: ${result.invoice.items.length}`);

      console.log('\n✅ 單張發票查詢 API 測試成功！');
    } else {
      // 測試帳號的發票可能超過查詢期限，這是正常的
      console.log('查無發票資料 (可能超過查詢期限，這是正常的)');
      console.log('\n⚠️ 單張發票查詢 API 已呼叫，但無可用資料');
    }
  } catch (error) {
    console.error('❌ 單張發票查詢 API 測試失敗:', error);
  }
}

async function testInvoiceStatus(invoiceNumber: InvoiceNumber | null) {
  if (!invoiceNumber) {
    console.log('\n⚠️ 跳過發票狀態查詢測試 (無可用發票號碼)');
    return;
  }

  console.log(`\n=== 測試發票狀態查詢 API (${invoiceNumber.toString()}) ===\n`);

  const repo = new AmegoInvoiceRepository(config);

  try {
    const results = await repo.getStatus([invoiceNumber]);

    if (results.length > 0) {
      for (const status of results) {
        console.log(`發票號碼: ${status.invoiceNumber}`);
        console.log(`類型: ${status.type}`);
        console.log(`狀態: ${status.status}`);
        console.log(`總金額: ${status.totalAmount}`);
      }

      console.log('\n✅ 發票狀態查詢 API 測試成功！');
    } else {
      // 測試帳號的發票可能超過查詢期限
      console.log('查無狀態資料 (可能超過查詢期限)');
      console.log('\n⚠️ 發票狀態查詢 API 已呼叫，但無可用資料');
    }
  } catch (error) {
    console.error('❌ 發票狀態查詢 API 測試失敗:', error);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('       光貿 (Amego) 發票 API 整合測試');
  console.log('='.repeat(60));
  console.log(`測試帳號: ${config.sellerTaxId}`);
  console.log(`API URL: ${config.baseUrl}`);

  // 測試發票列表
  const invoiceNumber = await testInvoiceList();

  // 測試單張發票查詢
  await testInvoiceQuery(invoiceNumber ?? null);

  // 測試發票狀態查詢
  await testInvoiceStatus(invoiceNumber ?? null);

  console.log('\n' + '='.repeat(60));
  console.log('                   測試完成');
  console.log('='.repeat(60));
}

main().catch(console.error);
