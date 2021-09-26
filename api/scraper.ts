const chromium = require('chrome-aws-lambda');

export default async function(req, res) {
  let browser = null
  const { query } = req

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    // Tell the tab to navigate to the JavaScript topic page.
    await page.goto('https://www.leboncoin.fr/recherche?category=10&locations=Paris__48.85790600716752_2.358844068809977_10000&real_estate_type=2');
    await page.waitForSelector('.styles_adCard__2YFTi');

    const result = await page.evaluate(() => {
      let title = document.querySelector('h1').innerText
      return { title }
    })

    console.log(result);

    res.status(200).json({
      getWaitlist: []
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: "Failed",
      error
    })
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
}