const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Read the HTML file
    const htmlPath = path.join(__dirname, 'remittance-flowchart.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Set content and wait for mermaid to render
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });
    
    // Wait for mermaid diagram to render
    await page.waitForFunction(() => {
      return document.querySelector('.mermaid svg') !== null;
    }, { timeout: 10000 });
    
    // Additional wait to ensure everything is rendered
    await page.waitForTimeout(2000);
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'InveStar-BD-Remittance-Flow.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">InveStar BD - Remittance Flow</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 File saved as: ${pdfPath}`);
    console.log(`📁 Location: ${__dirname}`);
    
    // Check if file exists and get size
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      const fileSizeInKB = Math.round(stats.size / 1024);
      console.log(`📊 File size: ${fileSizeInKB} KB`);
    }
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    process.exit(1);
  }
}

// Run the PDF generation
generatePDF(); 