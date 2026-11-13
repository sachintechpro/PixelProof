'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const commerce = require('./commerce');
const adminAuth = require('./admin-auth');
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.resolve(__dirname, 'public');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };
const sendJSON = (res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
async function readBody(req){const type=String(req.headers['content-type']||'');if(!type.startsWith('application/json'))commerce.fail(415,'Use application/json.');let chunks=[],size=0;for await(const part of req){size+=part.length;if(size>800000)commerce.fail(413,'Payload too large.');chunks.push(part);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{commerce.fail(400,'Invalid JSON.');}}
function checkOrigin(req){const origin=req.headers.origin;if(!origin)return;try{const u=new URL(origin);const host=String(req.headers['x-forwarded-host']||req.headers.host||'');if(u.host!==host)commerce.fail(403,'Cross-site requests are not permitted.');}catch(e){if(e.status)throw e;commerce.fail(403,'Origin not allowed.');}}
async function handler(req,res){
  let url;try{url=new URL(req.url,`http://${req.headers.host||'localhost'}`);}catch{return sendJSON(res,400,{error:'Invalid URL.'});}
  const pathname=url.pathname;const started=performance.now();
  try{
    if(pathname.startsWith('/api/')){
      if(!['GET','POST','PATCH','DELETE'].includes(req.method))return sendJSON(res,405,{error:'Method not allowed.'});
      if(req.method!=='GET')checkOrigin(req);
      const s=await commerce.workspace(req,res);const d=s.data;
      if(pathname==='/api/admin/session'&&req.method==='GET')return sendJSON(res,200,{authenticated:adminAuth.isAuthenticated(req,s),userId:adminAuth.isAuthenticated(req,s)?adminAuth.DEMO_USERNAME:null});
      if(pathname==='/api/admin/login'&&req.method==='POST'){
        const valid=adminAuth.login(req,res,s,await readBody(req));
        return sendJSON(res,valid?200:401,valid?{authenticated:true,userId:adminAuth.DEMO_USERNAME}:{error:'Incorrect demo user ID or password.'});}
      if(pathname==='/api/admin/logout'&&req.method==='POST'){
        adminAuth.logout(req,res);return sendJSON(res,200,{authenticated:false});}
      if(pathname.startsWith('/api/admin/')&&!adminAuth.isAuthenticated(req,s))return sendJSON(res,401,{error:'Admin sign-in required.'});
      if(pathname==='/api/health'&&req.method==='GET')return sendJSON(res,200,{ok:true,service:'PixelProof API',version:'3.1.0',timestamp:new Date().toISOString(),runtime:'Node.js',features:['catalog-management','inventory','sample-order-workflow','session-isolated-admin','demo-admin-login','test-payment-checkout','printable-demo-labels','dispatch-verification','shared-fictional-orders']});
      if(pathname==='/api/products'&&req.method==='GET'){
        const records=commerce.listProducts(s,url.searchParams);return sendJSON(res,200,{products:records,total:records.length,query:url.searchParams.get('q')||'',elapsedMs:Math.round(performance.now()-started)});}
      if(pathname==='/api/suggest'&&req.method==='GET'){
        const q=(url.searchParams.get('q')||'').toLowerCase().trim().slice(0,80);
        if(url.searchParams.get('simulate')==='error')return sendJSON(res,503,{error:'Simulated API outage — expected for error-state testing.'});
        const hints=commerce.listProducts(s,new URLSearchParams({q})).slice(0,5).map(p=>({id:p.id,label:p.name,category:p.category}));return sendJSON(res,200,{suggestions:hints,elapsedMs:Math.round(performance.now()-started)});}
      if(pathname==='/api/orders'&&req.method==='POST'){
        const result=commerce.createOrder(s,await readBody(req));await commerce.save(s);return sendJSON(res,201,result);}
      if(pathname==='/api/admin/overview'&&req.method==='GET')return sendJSON(res,200,commerce.overview(s));
      if(pathname==='/api/admin/products'&&req.method==='GET')return sendJSON(res,200,{products:d.products,categories:commerce.categories,images:commerce.imageAssets});
      if(pathname==='/api/admin/products'&&req.method==='POST'){
        if(d.products.length>=40)commerce.fail(409,'Demo limit reached: maximum 40 products.');const input=commerce.validateProduct(await readBody(req),d.products);const p={id:'item-'+crypto.randomBytes(5).toString('hex'),...input,createdAt:new Date().toISOString()};d.products.unshift(p);await commerce.save(s);return sendJSON(res,201,{product:p});}
      const productMatch=pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
      if(productMatch&&req.method==='PATCH'){
        const p=d.products.find(p=>p.id===productMatch[1]);if(!p)commerce.fail(404,'Product not found.');Object.assign(p,commerce.validateProduct(await readBody(req),d.products,p.id));await commerce.save(s);return sendJSON(res,200,{product:p});}
      if(productMatch&&req.method==='DELETE'){
        const i=d.products.findIndex(p=>p.id===productMatch[1]);if(i===-1)commerce.fail(404,'Product not found.');if(d.orders.some(o=>['Pending','Processing','Ready','Label created','On Hold'].includes(o.status)&&o.items.some(item=>item.id===productMatch[1])))commerce.fail(409,'Cannot delete a product with open orders. Hide it instead, or finish the orders first.');const [removed]=d.products.splice(i,1);await commerce.save(s);return sendJSON(res,200,{removed:removed.id});}
      if(pathname==='/api/admin/orders'&&req.method==='GET')return sendJSON(res,200,{orders:d.orders,statuses:commerce.statuses});
      if(pathname==='/api/admin/activity'&&req.method==='GET')return sendJSON(res,200,{events:d.activity||[]});
      const orderMatch=pathname.match(/^\/api\/admin\/orders\/(PP-[A-Z0-9-]+)$/);
      if(orderMatch&&req.method==='PATCH'){
        const payload=await readBody(req);const order=commerce.updateStatus(s,orderMatch[1],payload?.status);await commerce.save(s);return sendJSON(res,200,{order});}
      const workflowMatch=pathname.match(/^\/api\/admin\/orders\/(PP-[A-Z0-9-]+)\/(label|dispatch|recheck)$/);
      if(workflowMatch){
        const [,id,action]=workflowMatch;
        if(action==='label'&&req.method==='GET'){
          const html=commerce.printableLabel(commerce.findOrder(s,id));
          res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",'X-Content-Type-Options':'nosniff'});return res.end(html);}
        if(req.method==='POST'){
          let result;
          if(action==='label')result=commerce.createShippingLabel(s,id);
          else if(action==='dispatch')result={order:commerce.dispatchOrder(s,id,(await readBody(req)).labelRef)};
          else result={order:commerce.recheckHeldOrder(s,id)};
          await commerce.save(s);return sendJSON(res,200,result);
        }
      }
      if(pathname==='/api/admin/reset'&&req.method==='POST'){s.data=commerce.seedWorkspace();await commerce.save(s);return sendJSON(res,200,{ok:true});}
      return sendJSON(res,404,{error:'Unknown API endpoint.'});
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return sendJSON(res,405,{error:'Method not allowed.'});
    const safePath=pathname==='/'?'/index.html':pathname;
    let filePath;try{filePath=path.resolve(PUBLIC,'.'+decodeURIComponent(safePath));}catch{return sendJSON(res,400,{error:'Invalid path.'});}
    if(filePath!==PUBLIC&&!filePath.startsWith(PUBLIC+path.sep))return sendJSON(res,403,{error:'Forbidden.'});
    let stat;try{stat=await fs.stat(filePath);}catch{return sendJSON(res,404,{error:'File not found.'});}
    if(!stat.isFile())return sendJSON(res,404,{error:'Not a file.'});
    const mime=MIME[path.extname(filePath).toLowerCase()]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':filePath.endsWith('.html')?'no-cache':'public, max-age=3600','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
    if(req.method==='HEAD')return res.end();res.end(await fs.readFile(filePath));
  }catch(e){sendJSON(res,e.status||500,{error:e.status?e.message:'Internal server error.'});}
}
if(require.main===module){http.createServer(handler).listen(PORT,'0.0.0.0',()=>console.log(`PixelProof listening on http://0.0.0.0:${PORT}`));}
module.exports={handler};
