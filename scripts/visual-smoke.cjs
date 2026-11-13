/* One-off and repeatable QA for the actual Angular build; no mock screenshots. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execSync } = require('node:child_process');
const puppeteer = require('puppeteer-core');

const root = path.resolve('dist/fitmarket/browser');
if (!fs.existsSync(path.join(root,'index.html'))) throw new Error('Production build missing');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  let location=path.resolve(root,'.'+pathname);
  if(!location.startsWith(root)) {res.writeHead(403);res.end();return;}
  if(!fs.existsSync(location) || !fs.statSync(location).isFile()) location=path.join(root,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(location)]||'application/octet-stream'});
  fs.createReadStream(location).pipe(res);
});

const sale={id:21,date:'2026-11-13T10:00:00.000Z',customerId:1,items:[{productId:1,quantity:1,unitPrice:2500,productName:'Adjustable Dumbbell'}],subtotal:2500,discountAmount:0,total:2500};
const fees={
  invoices:[{id:'demo-invoice',userId:1,subscriptionId:'demo-subscription',description:'Monthly Academy Membership',amountEGP:850,status:'paid',issuedAt:'2026-11-12T13:00:00.000Z',paidAt:'2026-11-13T10:00:00.000Z'}],
  payments:[{id:'demo-payment',invoiceId:'demo-invoice',userId:1,amountEGP:850,paidAt:'2026-11-13T10:00:00.000Z',method:'demo'}]
};
const rootUrl='http://127.0.0.1:8877';
fs.mkdirSync('visual-evidence',{recursive:true});

async function check(page,label) {
  const dimensions = await page.evaluate(() => ({
    width:window.innerWidth,
    pageWidth:document.documentElement.scrollWidth,
    title:document.title,
    mainText:document.querySelector('main')?.innerText?.slice(0,140)
  }));
  console.log('VISUAL_CHECK '+label+' '+JSON.stringify(dimensions));
  if (dimensions.pageWidth > dimensions.width+3) throw new Error('Horizontal overflow on '+label);
}
async function open(browser, pathname, filename, viewport, userId){
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument((id,s,f)=>{
    try {
      localStorage.setItem('fitmarket.shop.sales.v1',JSON.stringify([s]));
      localStorage.setItem('fitmarket_student_fees_v1',JSON.stringify(f));
      if(id)sessionStorage.setItem('fitmarket_session_user_id_v1',String(id));
    }catch{}
  },userId,sale,fees);
  await page.goto(rootUrl+pathname,{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,850));
  await check(page,filename);
  if(filename)await page.screenshot({path:path.join('visual-evidence',filename),fullPage:true});
  return page;
}
(async()=>{
 await new Promise((resolve,reject)=>server.once('error',reject).listen(8877,'127.0.0.1',resolve));
 const exe=execSync('which google-chrome || which chromium || which chromium-browser',{encoding:'utf8'}).trim();
 const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const desktop={width:1440,height:960,deviceScaleFactor:1};
  const mobile={width:390,height:844,deviceScaleFactor:1};
  await open(browser,'/','home-desktop.png',desktop,null);
  await open(browser,'/shop','shop-desktop.png',desktop,null);
  const budgets=await open(browser,'/budgets','budgets-admin-desktop.png',desktop,3);
  const text=await budgets.evaluate(()=>document.querySelector('main')?.innerText||'');
  if(!text.includes('2,500') && !text.includes('2500'))throw Error('Shop example sale missing from budget');
  await budgets.close();
  const feesPage=await open(browser,'/student-fees','fees-trainee-desktop.png',desktop,1);
  await feesPage.close();
  const owner=await open(browser,'/shop/orders','orders-trainee-desktop.png',desktop,1);
  if(!(await owner.evaluate(()=>document.body.innerText)).includes('ORDER #21'))throw Error('Owner cannot see seeded order');
  await owner.close();
  const stranger=await open(browser,'/shop/orders',null,desktop,2);
  if((await stranger.evaluate(()=>document.body.innerText)).includes('ORDER #21'))throw Error('Another user sees private order');
  await stranger.close();
  await open(browser,'/','home-mobile.png',mobile,null).then(p=>p.close());
  await open(browser,'/shop','shop-mobile.png',mobile,null).then(p=>p.close());
  await open(browser,'/budgets','budgets-mobile.png',mobile,3).then(p=>p.close());
  console.log('VISUAL_SMOKE_PASSED');
 }finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>server.close());
