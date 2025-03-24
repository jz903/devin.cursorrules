const { chromium } = require("playwright");

async function scrapeTable() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(
      "https://www.stats.gov.cn/sj/zxfb/202502/t20250219_1958761.html",
      { timeout: 60000 }
    );

    // 等待页面加载
    await page.waitForLoadState("domcontentloaded");

    // 获取页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);

    // 获取表格数据
    const tables = await page.$$("table");
    console.log(`找到 ${tables.length} 个表格`);

    for (let i = 0; i < tables.length; i++) {
      console.log(`\n表格 ${i + 1}:`);

      // 获取表格内容
      const tableContent = await tables[i].evaluate((table) => {
        const rows = Array.from(table.querySelectorAll("tr"));
        return rows
          .map((row) => {
            const cells = Array.from(row.querySelectorAll("td, th"));
            return cells.map((cell) => cell.textContent.trim()).join(",");
          })
          .join("\n");
      });

      console.log(tableContent);
    }
  } catch (error) {
    console.error("抓取过程中出错:", error);
  } finally {
    await browser.close();
  }
}

scrapeTable();
