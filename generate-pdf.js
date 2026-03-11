#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to the landing page
    await page.goto('http://localhost:3000/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for animations to complete
    await page.waitForTimeout(2000);
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'cutsheet-landing.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    await browser.close();
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
})();
