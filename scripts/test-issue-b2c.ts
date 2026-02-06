/**
 * 測試開立 B2C 發票
 *
 * 光貿測試帳號：
 * - 統編: 12345678
 * - API Key: sHeq7t8G1wiQvhAuIM27
 */
import {
  Zinvoice,
  Provider,
  Invoice,
  InvoiceItem,
  Money,
  OrderId,
  Buyer,
  Carrier,
} from '../src/index.js';

const client = Zinvoice.create({
  provider: Provider.AMEGO,
  sellerTaxId: '12345678',
  apiKey: 'sHeq7t8G1wiQvhAuIM27',
});

async function main() {
  console.log('═'.repeat(60));
  console.log('       測試開立 B2C 發票');
  console.log('═'.repeat(60));

  // 產生唯一訂單編號
  const orderId = `TEST-${Date.now()}`;

  console.log(`\n訂單編號: ${orderId}`);

  // 建立發票
  const invoice = Invoice.create({
    orderId: OrderId.create(orderId),
    buyer: Buyer.anonymous('測試客人'),
    items: [
      InvoiceItem.create({
        description: '測試商品 A',
        quantity: 2,
        unitPrice: Money.create(100),
        amount: Money.create(200),
      }),
      InvoiceItem.create({
        description: '測試商品 B',
        quantity: 1,
        unitPrice: Money.create(50),
        amount: Money.create(50),
      }),
    ],
    carrier: Carrier.mobile('/ABC+123'), // 測試用手機條碼
  });

  console.log(`\n發票內容:`);
  console.log(`  買方: ${invoice.buyer.name}`);
  console.log(`  載具: ${invoice.carrier.id}`);
  console.log(`  商品數: ${invoice.items.length}`);
  console.log(`  總金額: $${invoice.calculateTotalAmount().toNumber()}`);

  console.log('\n開立發票中...\n');

  try {
    const result = await client.invoices.issue(invoice);

    console.log('✅ 發票開立成功！');
    console.log(`\n  發票號碼: ${result.invoiceNumber.toString()}`);
    console.log(`  隨機碼: ${result.randomNumber}`);
    console.log(`  開立時間: ${result.invoiceTime.toISOString()}`);
    console.log(`  條碼: ${result.barcode}`);
    console.log(`  QR Code 左: ${result.qrcodeLeft.substring(0, 50)}...`);
    console.log(`  QR Code 右: ${result.qrcodeRight.substring(0, 50)}...`);

    if (result.printData) {
      console.log(`  列印資料: (${result.printData.length} bytes base64)`);
    }
  } catch (error) {
    console.error('❌ 發票開立失敗:', error);
  }

  console.log('\n' + '═'.repeat(60));
}

main().catch(console.error);
