/**
 * 測試腳本：取得發票列表
 *
 * 使用光貿 API 文件規格：
 * - Content-Type: application/x-www-form-urlencoded
 * - 參數: invoice, data, time, sign
 * - sign = md5(data + time + apiKey)
 */
import { createHash } from 'crypto';

async function main() {
  console.log('=== 測試取得發票列表 (光貿 API) ===\n');

  const baseUrl = 'https://invoice-api.amego.tw';
  const sellerTaxId = '12345678'; // 測試帳號統編
  const apiKey = 'sHeq7t8G1wiQvhAuIM27';

  // 根據 PDF 文件，日期格式是 YYYYMMDD（數字或字串）
  // 測試帳號的發票可能是很久以前開的，擴大範圍
  const requestData = {
    date_select: 1, // 1=開立日期
    date_start: 20230101, // YYYYMMDD 格式
    date_end: 20261231,
    limit: 20,
    page: 1,
  };

  const jsonData = JSON.stringify(requestData);
  const timestamp = Math.floor(Date.now() / 1000);

  // 簽章計算: md5(data + time + apiKey)
  const signPayload = `${jsonData}${timestamp}${apiKey}`;
  const signature = createHash('md5')
    .update(signPayload, 'utf8')
    .digest('hex')
    .toLowerCase();

  // 建立 form-urlencoded body
  const formData = new URLSearchParams();
  formData.append('invoice', sellerTaxId);
  formData.append('data', jsonData);
  formData.append('time', timestamp.toString());
  formData.append('sign', signature);

  console.log('Request Details:');
  console.log(`  URL: ${baseUrl}/json/invoice_list`);
  console.log(`  統編: ${sellerTaxId}`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Data: ${jsonData}`);
  console.log(`  Sign payload: ${signPayload}`);
  console.log(`  Signature: ${signature}`);
  console.log(`  Form body: ${formData.toString()}\n`);

  try {
    const response = await fetch(`${baseUrl}/json/invoice_list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('Response:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`    ${key}: ${value}`);
    });

    const text = await response.text();
    console.log(`\n  Body (raw):\n${text}\n`);

    // 嘗試解析 JSON
    try {
      const json = JSON.parse(text);
      console.log('  Body (parsed):', JSON.stringify(json, null, 2));

      if (json.code === 0) {
        console.log('\n✅ API 呼叫成功！');
      } else {
        console.log(`\n❌ API 回傳錯誤: code=${json.code}, msg=${json.msg}`);
      }
    } catch {
      console.log('  (Body is not JSON)');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

main();
