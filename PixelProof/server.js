'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { products } = require('./data');
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.resolve(__dirname, 'public');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };
const sendJSON = (res, code, body) => {res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
async function readBody(req) {let chunks=[];let size=0;for await (const part of req){size += part.length;if(size>10000){const e=new Error('Payload too large');e.status=413;throw e;}chunks.push(part);}try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{const e=new Error('Invalid JSON');e.status=400;throw e;}}
const clamp=(n, min, max)=>Math.min(max,Math.max(min,n));
async function handler(req,res){
  const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
  const pathname=url.pathname;
  const started=performance.now();
  try {
    if (pathname==='/api/health' && req.method==='GET') return sendJSON(res,200,{ok:true,service:'PixelProof API',version:'1.0.0',timestamp:new Date().toISOString(),runtime:'Node.js',features:['products','search','checkout-simulation']});
    if (pathname==='/api/products' && req.method==='GET'){
      const q=(url.searchParams.get('q')||'').toLowerCase().trim().slice(0,80);
      const category=url.searchParams.get('category')||'All';
      const sort=url.searchParams.get('sort')||'featured';
      let records=products.filter(p=>(category==='All'||p.category===category) && (!q||(`${p.name} ${p.category} ${p.color}`).toLowerCase().includes(q)));
      if(sort==='price-asc')records.sort((a,b)=>a.price-b.price);else if(sort==='price-desc')records.sort((a,b)=>b.price-a.price);else if(sort==='name')records.sort((a,b)=>a.name.localeCompare(b.name));
      return sendJSON(res,200,{products:records,total:records.length,query:q,elapsedMs:Math.round(performance.now()-started)});
    }
    if (pathname==='/api/suggest' && req.method==='GET'){
      const q=(url.searchParams.get('q')||'').toLowerCase().trim().slice(0,80);
      if(url.searchParams.get('simulate')==='error')return sendJSON(res,503,{error:'Simulated API outage — expected for error-state testing.'});
      const hints=products.filter(p=>q && `${p.name} ${p.category}`.toLowerCase().includes(q)).slice(0,5).map(p=>({id:p.id,label:p.name,category:p.category}));
      return sendJSON(res,200,{suggestions:hints,elapsedMs:Math.round(performance.now()-started)});
    }
    if(pathname==='/api/orders' && req.method==='POST'){
      const payload=await readBody(req);
      if(!payload||typeof payload!=='object'||Array.isArray(payload)) return sendJSON(res,422,{error:'Invalid order payload.'});
      const email=String(payload.email||'');
      const lines=Array.isArray(payload.items)?payload.items:[];
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!lines.length||lines.length>30) return sendJSON(res,422,{error:'Provide a valid email and at least one item.'});
      let subtotal=0;
      for(const item of lines){const p=products.find(p=>p.id===item.id);if(!p||!Number.isInteger(item.qty)||item.qty<1||item.qty>Math.min(p.inventory,10))return sendJSON(res,422,{error:'Invalid product or quantity.'});subtotal+=p.price*item.qty;}
      return sendJSON(res,200,{ok:true,simulation:true,orderId:'PP-'+Math.random().toString(36).slice(2,8).toUpperCase(),subtotal,shipping:subtotal>=150?0:12,total:subtotal+(subtotal>=150?0:12),message:'No payment collected. This is a checkout simulation.'});
    }
    if(pathname.startsWith('/api/'))return sendJSON(res,404,{error:'Unknown API endpoint.'});
    if(req.method!=='GET'&&req.method!=='HEAD')return sendJSON(res,405,{error:'Method not allowed.'});
    const safePath=pathname==='/'?'/index.html':pathname;
    let filePath=path.resolve(PUBLIC,'.'+decodeURIComponent(safePath));
    if(filePath!==PUBLIC&&!filePath.startsWith(PUBLIC+path.sep))return sendJSON(res,403,{error:'Forbidden'});
    let stat;try{stat=await fs.stat(filePath);}catch{return sendJSON(res,404,{error:'File not found.'});}
    if(!stat.isFile())return sendJSON(res,404,{error:'Not a file.'});
    const mime=MIME[path.extname(filePath).toLowerCase()]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':filePath.endsWith('.html')?'no-cache':'public, max-age=3600','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
    if(req.method==='HEAD')return res.end();
    res.end(await fs.readFile(filePath));
  }catch(e){sendJSON(res,e.status||500,{error:e.status?e.message:'Internal server error.'});}
}
if(require.main===module){http.createServer(handler).listen(PORT,'0.0.0.0',()=>console.log(`PixelProof listening on http://0.0.0.0:${PORT}`));}
module.exports={handler};
