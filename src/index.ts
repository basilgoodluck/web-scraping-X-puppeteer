import express from 'express';
import puppeteer from 'puppeteer';
import os, { platform } from 'os';

const app = express();
const PORT = 3000;

const osDetails = {
    username: os.userInfo().username, 
    platform: os.platform(), 
    release: os.release(), 
    hostname: os.hostname(), 
    totalMemory: os.totalmem(), 
    freeMemory: os.freemem(), 
};

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 250
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true)
    page.on('request', interceptedRequest => {
        if(interceptedRequest.isInterceptResolutionHandled()) return
        if(interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('jpg')){
            interceptedRequest.abort()
        }
        else interceptedRequest.continue()
    })
    await page.goto('https://quotes.toscrape.com/', {
        waitUntil: 'networkidle2'
    })
    await page.screenshot({
        path: 'output.png',    
    })
    browser.close()
    
})()

app.listen(PORT, () => {
    console.log('server is running');
    console.log('Operating System Details:', osDetails);
})