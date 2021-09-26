const chromium = require('chrome-aws-lambda');
const axios = require('axios');

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

    const getAllLinks = async browser => {
      const page = await browser.newPage()
      await page.goto('https://www.leboncoin.fr/recherche?category=10&locations=Paris__48.85790600716752_2.358844068809977_10000&real_estate_type=2');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const result = await page.evaluate(() => {
        const offers = Array.from(document.querySelectorAll('.styles_adCard__2YFTi'));

        return offers.map(offer => {
          const linkSelector = offer.querySelector('a')
  
          return {
            url: linkSelector.href
          }
        })
      })
      return result
    }


    const getDataFromUrl = async (browser, url) => {
      const page = await browser.newPage()
      await page.setDefaultNavigationTimeout(0);
      await page.goto(url)
      await page.waitForSelector('body')
      
      const offer = await page.evaluate(() => ({
        title: document.querySelector('h1').innerText,
        date: (document.querySelector('.Snj6Y') as HTMLElement).innerText,
        price: parseFloat((document.querySelector('.Roh2X') as HTMLElement).innerText.replace(/ /g,'').replace('€', '')),
        including_charges: (document.querySelector('.FUcqi') as HTMLElement).innerText === 'Charges comprises',
        description: '',
        type: "apartment",
        surface: 42,
        rooms: 2,
      }))
      return offer
    }
    
    const links = await getAllLinks(browser);
    const offers = await Promise.all(links.slice(0, 5).map(async link => {
      const offer = await getDataFromUrl(browser, link.url);
      return offer
    }))

    res.status(200).json(offers);
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