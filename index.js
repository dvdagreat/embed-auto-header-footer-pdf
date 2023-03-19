const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");

async function getMainPdf() {
  const content = handlebars.compile("<p>Hello</p>")();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: "c:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--disable-extensions"],
  });

  const page = await browser.newPage();
  await page.setContent(content, { waitUntil: "load" });
  pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: "1.8cm", right: "1cm", bottom: "1cm", left: "1cm" },
  });

  await browser.close();
  return pdf;
}

async function getEmbeddedPdf(pdf) {
  const document = await PDFDocument.load(pdf);

  // set header
  const headerImage = await nodeHtmlToImage({
    html: '<p class="ss-header" style="color: white;font-size:10px;height:300px;width:300px;background: black;">header</p>',
    selector: ".ss-header",
  });
  const headerpngImage = await document.embedPng(headerImage);
  const firstPage = document.getPage(0);
  firstPage.drawImage(headerpngImage, {
    x: firstPage.getWidth() - headerpngImage.width,
    y: firstPage.getHeight() - headerpngImage.height,
    width: headerpngImage.width,
    height: headerpngImage.height,
  });

  // set footer
  const footerImage = await nodeHtmlToImage({
    html: '<p class="ss-footer" style="color: white;height:50px;background: black;">footer</p>',
    selector: ".ss-footer",
  });
  const footerpngImage = await document.embedPng(footerImage);
  const lastPage = document.getPage(document.getPageCount() - 1);
  lastPage.drawImage(footerpngImage, {
    x: 0,
    y: lastPage.getHeight() - lastPage.getHeight(),
    width: footerpngImage.width,
    height: footerpngImage.height,
  });

  return await document.save();
}

async function run() {
  const pdf = await getMainPdf();
  const embeddedPdf = await getEmbeddedPdf(pdf);

  const stream = fs.createWriteStream("dvs2.pdf");
  stream.write(embeddedPdf);
}

run();
