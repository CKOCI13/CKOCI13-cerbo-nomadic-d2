// Rebuilds the pictures in docs/images and the PDFs in docs/ from the sources in this folder.
//
// figures.html            -> one PNG per element with a data-figure attribute (all but web-page.png)
// installation-guide.html -> ../installation-guide.pdf
// safe-test-plan.html     -> ../safe-test-plan.pdf
// web-page.png is a screenshot of the real page: run  dbus-nomadic-dcdc.py --simulate --no-dbus  and capture
// http://<host>:8089 at 1000 px wide, 2x scale.
//
//   npm install playwright        (once; any recent version)
//   node docs/src/build.cjs       (from the project folder)
//

const { chromium } = require('playwright');
const path = require('path');

const SRC = __dirname;
const DOCS = path.dirname(SRC);

(async () => {
  const browser = await chromium.launch();
  try {
    const fig = await browser.newPage({ deviceScaleFactor: 2 });
    await fig.goto('file://' + path.join(SRC, 'figures.html'), { waitUntil: 'networkidle' });
    await fig.evaluate(() => document.fonts.ready);
    for (const el of await fig.$$('[data-figure]')) {
      const name = await el.getAttribute('data-figure');
      await el.screenshot({ path: path.join(DOCS, 'images', name + '.png'), omitBackground: true });
      console.log('images/' + name + '.png');
    }
    await fig.close();
    for (const name of ['installation-guide', 'safe-test-plan']) {
      const page = await browser.newPage();
      await page.goto('file://' + path.join(SRC, name + '.html'), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({
        path: path.join(DOCS, name + '.pdf'),
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.6in', bottom: '0.7in', left: '0.6in', right: '0.6in' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#888;font-family:sans-serif">' +
          'Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      });
      await page.close();
      console.log(name + '.pdf');
    }
  } finally {
    await browser.close();
  }
})();
