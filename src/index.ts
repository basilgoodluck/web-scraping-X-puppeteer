import express from 'express';
import puppeteer from 'puppeteer';
import os from 'os';

const app = express();
const PORT = 3000;

let scrapedQuotes: string[] = [];

const osDetails = {
    username: os.userInfo().username, 
    platform: os.platform(), 
    release: os.release(), 
    hostname: os.hostname(), 
    totalMemory: os.totalmem(), 
    freeMemory: os.freemem(), 
};

async function getQuotes () {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 250
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true)
    page.on('request', interceptedRequest => {
        if(interceptedRequest.isInterceptResolutionHandled()) return
        if(interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('jpg') || interceptedRequest.url().endsWith('jpeg')){
            interceptedRequest.abort()
        }
        else interceptedRequest.continue()
    })
    await page.goto('https://quotes.toscrape.com/', {
        waitUntil: 'networkidle2'
    })
    await page.screenshot({ 
        path: 'screenshot.png',    
    })
    const quotes = await page.evaluate(() => {
        const quotes = document.querySelectorAll('.quotes');
        const quotesArr: string[] = [];
         
        quotes.forEach((quote) => {
            try {
                const textElement = quote.querySelector('.text');
                if(textElement && textElement instanceof HTMLElement){
                    const quoteTXT = textElement.innerText;
                    quotesArr.push(quoteTXT)
                }
            } catch(error){
                console.log("Error fetching quotes: "+ error)
            }
        })

        return quotesArr;
    })

    await browser.close()
    return quotes;    
}

app.listen(PORT, () => {
    console.log('server is running');
    console.log('Operating System Details:', osDetails);
})

app.get('/scrape', async (req, res) => {
    try {
        const quotes = await getQuotes();
        scrapedQuotes = quotes; 
        res.json({ 
            success: true, 
            message: 'Scraping completed',
            count: quotes.length,
            quotes 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error during scraping',
            error: error
        });
    }
});

app.get('/quotes', (req, res) => {
    res.json({ 
        success: true,
        count: scrapedQuotes.length,
        quotes: scrapedQuotes 
    });
});

app.get('/quotes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (id >= 0 && id < scrapedQuotes.length) {
        res.json({ 
            success: true,
            quote: scrapedQuotes[id] 
        });
    } else {
        res.status(404).json({ 
            success: false,
            message: 'Quote not found' 
        });
    }
});
