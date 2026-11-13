'use strict';
/* Shared fictional catalog and order queue across browsers by default.
 * PIXELPROOF_ISOLATED=true switches to browser-specific workspaces for tests.
 * File-backed JSON is ephemeral on Render Free; no real cards or customer data.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {products:seed} = require('./data');
const DATA_DIR = path.resolve(process.env.PIXELPROOF_DATA_DIR || path.join(__dirname,'.local-data'));
const sessions = new Map();
const pendingSessions = new Map();
const ISOLATED = process.env.PIXELPROOF_ISOLATED === 'true';
const imageAssets = ['/assets/lamp.svg','/assets/speaker.svg','/assets/chair.svg','/assets/keyboard.svg','/assets/clock.svg','/assets/headphones.svg'];
const categories = ['Lighting','Audio','Furniture','Accessories','Lifestyle'];
const statuses = ['Pending','Processing','Ready','Label created','Dispatched','Delivered','On Hold','Cancelled'];
const clone = x=>JSON.parse(JSON.stringify(x));
const fail=(code,message)=>{const e=new Error(message);e.status=code;throw e;};
const dayOffset=n=>new Date(Date.now()-n*86400000).toISOString();
function seedWorkspace(){const products=clone(seed).map(p=>({...p,sku:p.id.toUpperCase().replace(/-/g,'-'),active:true,createdAt:dayOffset(28)}));
  const orders=[
    {id:'PP-SAMPLE-301',createdAt:dayOffset(1),status:'Ready',items:[{id:'arc-lamp',name:'Arc desk lamp',sku:'ARC-LAMP',price:129,qty:1}],subtotal:129,shipping:12,total:141,customer:'Demo shopper'},
    {id:'PP-SAMPLE-300',createdAt:dayOffset(3),status:'Processing',items:[{id:'form-keyboard',name:'Form keyboard',sku:'FORM-KEYBOARD',price:149,qty:1},{id:'tempo-clock',name:'Tempo clock',sku:'TEMPO-CLOCK',price:79,qty:1}],subtotal:228,shipping:0,total:228,customer:'Demo shopper'},
    {id:'PP-SAMPLE-299',createdAt:dayOffset(6),status:'Delivered',items:[{id:'halo-headphones',name:'Halo headphones',sku:'HALO-HEADPHONES',price:229,qty:1}],subtotal:229,shipping:0,total:229,customer:'Demo shopper'},
    {id:'PP-SAMPLE-298',createdAt:dayOffset(8),status:'On Hold',items:[{id:'studio-chair',name:'Studio chair',sku:'STUDIO-CHAIR',price:349,qty:10}],subtotal:3490,shipping:0,total:3490,customer:'Demo shopper'}
  ];
  for(const order of orders){for(const item of order.items){const product=products.find(p=>p.id===item.id);if(product&&order.status!=='On Hold')product.inventory-=item.qty;}}
  for(const o of orders){o.email='demo@example.com';o.shipTo={address1:'123 Example Lane',city:'Sample City',region:'CA',postalCode:'90001',country:'US'};o.payment={method:'Test Visa',status:o.status==='On Hold'?'Awaiting inventory — simulation':'Approved (simulation)',last4:'4242',reference:'PAY-DEMO-SEED'};o.labelRef=null;o.labelCreatedAt=null;o.dispatchedAt=null;}
  return {products,orders,activity:[],createdAt:new Date().toISOString()};}
async function workspace(req,res){
  const cookie=String(req.headers.cookie||'').match(/(?:^|;\s*)pp_workspace=([a-f0-9]{48})(?:;|$)/);
  const id=ISOLATED?(cookie?cookie[1]:crypto.randomBytes(24).toString('hex')):'shared-store';
  if(ISOLATED&&!cookie){const secure=String(req.headers['x-forwarded-proto']||'').split(',')[0]==='https';res.setHeader('Set-Cookie',`pp_workspace=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure?'; Secure':''}`);}
  if(sessions.has(id))return sessions.get(id);
  if(pendingSessions.has(id))return pendingSessions.get(id);
  const promise=(async()=>{let data;try{data=JSON.parse(await fs.readFile(path.join(DATA_DIR,`${id}.json`),'utf8'));}catch{data=seedWorkspace();}
    const session={id,data,pending:Promise.resolve()};sessions.set(id,session);return session;})();
  pendingSessions.set(id,promise);try{return await promise;}finally{pendingSessions.delete(id);}
}
async function save(s){const serialized=JSON.stringify(s.data);if(serialized.length>3_000_000)fail(413,'Workspace data limit exceeded.');
  s.pending=s.pending.catch(()=>{}).then(async()=>{await fs.mkdir(DATA_DIR,{recursive:true});const filename=path.join(DATA_DIR,`${s.id}.json`);const tmp=filename+'.'+crypto.randomBytes(3).toString('hex')+'.tmp';await fs.writeFile(tmp,serialized,{mode:0o600});await fs.rename(tmp,filename);});await s.pending;}
function validateProduct(obj,otherProducts,id){if(!obj||typeof obj!=='object'||Array.isArray(obj))fail(422,'Invalid product.');
  const text=(key,max)=>{const x=String(obj[key]??'').trim();if(!x||x.length>max)fail(422,`${key} is required and must be under ${max} characters.`);return x;};
  const name=text('name',100),sku=text('sku',35).toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]*$/.test(sku))fail(422,'SKU must use letters, numbers, hyphens or underscores.');
  if(otherProducts.some(p=>p.sku.toUpperCase()===sku&&p.id!==id))fail(409,'SKU already exists. Choose a unique SKU.');
  const price=Number(obj.price),inventory=Number(obj.inventory);if(!Number.isFinite(price)||price<0.01||price>100000||Math.abs(Math.round(price*100)-price*100)>1e-6)fail(422,'Price must be between $0.01 and $100,000 with no more than two decimals.');
  if(!Number.isInteger(inventory)||inventory<0||inventory>100000)fail(422,'Inventory must be a whole number from 0 to 100,000.');
  if(!categories.includes(obj.category))fail(422,'Choose a valid category.');
  const description=text('description',500),color=text('color',90);
  const image=String(obj.image||imageAssets[0]);if(!imageAssets.includes(image)&&!/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]{1,550000}$/.test(image))fail(422,'Use a supplied illustration or upload a small PNG, JPEG or WebP image.');
  const active=obj.active!==false;return {name,sku,price,inventory,category:obj.category,description,color,image,active,tag:obj.tag?String(obj.tag).slice(0,30):'NEW ARRIVAL',oldPrice:null};}
function listProducts(s,params){const q=(params.get('q')||'').trim().toLowerCase().slice(0,80),category=params.get('category')||'All',sort=params.get('sort')||'featured';
  const filtered=s.data.products.filter(p=>p.active&&p.inventory>=0&&(category==='All'||p.category===category)&&(!q||`${p.name} ${p.category} ${p.color} ${p.sku}`.toLowerCase().includes(q)));
  if(sort==='price-asc')filtered.sort((a,b)=>a.price-b.price);else if(sort==='price-desc')filtered.sort((a,b)=>b.price-a.price);else if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name));return filtered;}
function overview(s){const d=s.data;const active=d.products.filter(p=>p.active);const committed=d.orders.filter(o=>!['Cancelled','On Hold'].includes(o.status));
  return {products:active.length,lowStock:active.filter(p=>p.inventory<=5).length,orders:d.orders.length,openOrders:d.orders.filter(o=>['Pending','Processing','Ready','Label created','On Hold'].includes(o.status)).length,revenue:committed.reduce((n,o)=>n+o.total,0),unitsAvailable:active.reduce((n,p)=>n+p.inventory,0),recent:d.orders.slice(0,5)};}

const DEMO_EMAIL = /^[^\s@]{1,64}@(example\.(?:com|org|net)|[a-z0-9-]+\.(?:test|invalid))$/i;
function requiredDemoText(value,field,max=90){
  const v=String(value??'').trim();
  if(v.length<2||v.length>max||/[<>\x00-\x1f]/.test(v))fail(422,`Enter a fictional ${field} (${max} characters max).`);
  return v;
}
function audit(s,action,description){
  s.data.activity ||= [];
  s.data.activity.unshift({at:new Date().toISOString(),action,description});
  s.data.activity=s.data.activity.slice(0,100);
}
function createOrder(s,payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))fail(422,'Invalid order payload.');
  const email=String(payload.email||''),lines=payload.items;
  if(!Array.isArray(lines)||!lines.length||lines.length>30)fail(422,'Add at least one item to your cart.');
  // In the isolated test mode, existing API tests can exercise catalog validation without a checkout form.
  const legacy=ISOLATED&&!payload.shipping&&!payload.paymentToken;
  if(!legacy&&!DEMO_EMAIL.test(email))fail(422,'For this public demo use a fictional email ending in @example.com or .test.');
  if(legacy&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(422,'Provide a valid email.');
  const customer=legacy?'Demo shopper':requiredDemoText(payload.customer,'customer name',80);
  const raw=payload.shipping||{};
  const shipping=legacy?null:{
    address1:requiredDemoText(raw.address1,'street address',120),
    city:requiredDemoText(raw.city,'city',60),
    region:requiredDemoText(raw.region,'state',40),
    postalCode:requiredDemoText(raw.postalCode,'ZIP/postal code',18),
    country:'US'
  };
  // No primary account number, security code or expiration is submitted to or stored by this API.
  const paymentToken=legacy?'demo-visa-4242':String(payload.paymentToken||'');
  if(paymentToken==='demo-visa-declined')fail(402,'Demo payment declined. Use the approved test card ending 4242.');
  if(paymentToken!=='demo-visa-4242')fail(422,'A valid demonstration payment token is required. No real cards are accepted.');
  const seen=new Set();let subtotalCents=0;const items=[];
  for(const line of lines){
    const p=s.data.products.find(p=>p.id===line?.id&&p.active);const qty=line?.qty;
    if(!p||!Number.isInteger(qty)||qty<1||qty>10||qty>p.inventory||seen.has(line.id))fail(409,'A product changed or is out of stock. Review your cart and try again.');
    seen.add(line.id);items.push({id:p.id,name:p.name,sku:p.sku,price:p.price,qty});subtotalCents+=Math.round(p.price*100)*qty;
  }
  const subtotal=subtotalCents/100,shippingFee=subtotalCents>=15000?0:12;
  const order={id:'PP-'+crypto.randomBytes(4).toString('hex').toUpperCase(),createdAt:new Date().toISOString(),
    status:legacy?'Pending':'Ready',items,subtotal,shipping:shippingFee,total:Math.round((subtotal+shippingFee)*100)/100,
    customer,email:legacy?undefined:email,shipTo:shipping,
    payment:{method:'Test Visa',status:'Approved (simulation)',last4:'4242',reference:'PAY-DEMO-'+crypto.randomBytes(4).toString('hex').toUpperCase()},
    labelRef:null,labelCreatedAt:null,dispatchedAt:null,activity:[]};
  for(const item of items)s.data.products.find(p=>p.id===item.id).inventory-=item.qty;
  s.data.orders.unshift(order);if(s.data.orders.length>120)s.data.orders.length=120;
  audit(s,'ORDER_RECEIVED',`${order.id} placed, demo payment approved, stock reserved`);
  return {ok:true,simulation:true,orderId:order.id,subtotal,shipping:shippingFee,total:order.total,
    paymentStatus:'Approved (simulation)',paymentReference:order.payment.reference,status:order.status,
    message:'Fictional checkout completed. No payment was charged and no shipment is created.'};
}
function findOrder(s,id){const o=s.data.orders.find(o=>o.id===id);if(!o)fail(404,'Order not found.');return o;}
function updateStatus(s,id,status){
  const order=findOrder(s,id);
  const next={Pending:['Processing','Ready','Cancelled'],Processing:['Ready','Cancelled'],Ready:['Cancelled'],
    'Label created':['Cancelled'],Dispatched:['Delivered'],Delivered:[],Cancelled:[],'On Hold':['Cancelled']};
  if(!next[order.status]?.includes(status))fail(409,`Cannot change ${order.status} order to ${status}.`);
  if(status==='Cancelled'&&order.status!=='On Hold'){
    for(const item of order.items){const p=s.data.products.find(p=>p.id===item.id);if(p)p.inventory+=item.qty;}
  }
  order.status=status;order.updatedAt=new Date().toISOString();
  audit(s,status==='Cancelled'?'ORDER_CANCELLED':'ORDER_STATUS',`${id} → ${status}`);
  return order;
}
function createShippingLabel(s,id){
  const o=findOrder(s,id);
  if(o.status!=='Ready')fail(409,'Shipping labels can only be created for ready orders with reserved inventory.');
  if(!o.shipTo)fail(409,'This legacy sample order has no demo shipping address. Place a new checkout order to create a label.');
  o.labelRef='DEMO-LBL-'+crypto.randomBytes(5).toString('hex').toUpperCase();
  o.labelCreatedAt=new Date().toISOString();o.status='Label created';o.updatedAt=o.labelCreatedAt;
  audit(s,'LABEL_CREATED',`${id} printable demo label ${o.labelRef} generated`);
  return {order:o,labelRef:o.labelRef};
}
function dispatchOrder(s,id,reference){
  const o=findOrder(s,id);
  if(o.status!=='Label created')fail(409,'Create a shipping label before dispatch.');
  if(!o.labelRef||String(reference||'').trim().toUpperCase()!==o.labelRef)fail(422,'The label reference must exactly match the generated label.');
  o.status='Dispatched';o.dispatchedAt=new Date().toISOString();o.updatedAt=o.dispatchedAt;
  audit(s,'DISPATCHED',`${id} marked dispatched using ${o.labelRef} (no real carrier handoff)`);
  return o;
}
function recheckHeldOrder(s,id){
  const o=findOrder(s,id);if(o.status!=='On Hold')fail(409,'Only on-hold orders can be rechecked.');
  for(const item of o.items){const p=s.data.products.find(p=>p.id===item.id);if(!p||!p.active||p.inventory<item.qty)fail(409,`Insufficient stock for ${item.sku}. Update inventory first.`);}
  for(const item of o.items)s.data.products.find(p=>p.id===item.id).inventory-=item.qty;
  o.status='Ready';o.updatedAt=new Date().toISOString();audit(s,'HOLD_RELEASED',`${id} stock reserved, ready for label`);return o;
}
function printableLabel(order){
  if(!order.labelRef||order.status==='Cancelled')fail(409,'This order has no active shipping label.');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const a=order.shipTo;if(!a)fail(409,'No fictional shipping address on file.');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demo label ${esc(order.labelRef)}</title><style>body{font-family:Arial,sans-serif;padding:35px;color:#161e1b;background:#f3f5f2}.label{max-width:650px;margin:auto;background:#fff;border:4px solid #1c3026;padding:32px}.note{background:#ffe4c9;padding:12px;text-align:center;font-weight:900;font-size:17px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}.code{font:900 24px monospace;overflow-wrap:anywhere}.bars{background:repeating-linear-gradient(90deg,#1c3026 0 3px,#fff 3px 6px,#1c3026 6px 7px,#fff 7px 12px);height:72px;margin-top:24px}.small{font-size:12px;color:#4c6053}.actions{display:flex;justify-content:center;margin:30px}button{padding:12px 20px;cursor:pointer}@media print{body{padding:0;background:#fff}.actions{display:none}.label{border:3px solid #000}}</style></head><body><div class="label"><div class="note">DEMONSTRATION ONLY — NOT VALID FOR SHIPMENT</div><h1>PIXELPROOF / DEMO GROUND</h1><div class="grid"><div><b>SHIP FROM</b><p>Mono / Goods<br>100 Sample Warehouse Way<br>Fictional City, CA 90001</p></div><div><b>SHIP TO (FICTIONAL)</b><p>${esc(order.customer)}<br>${esc(a.address1)}<br>${esc(a.city)}, ${esc(a.region)} ${esc(a.postalCode)}<br>${esc(a.country)}</p></div></div><hr><p>Order <b>${esc(order.id)}</b></p><p>Items: ${esc(order.items.map(i=>`${i.qty}× ${i.sku}`).join(' · '))}</p><p>Carrier: DEMO GROUND · Shipping cost: $${Number(order.shipping||0).toFixed(2)}</p><div class="bars" aria-hidden="true"></div><p class="code">${esc(order.labelRef)}</p><p class="small">Fictional reference. No postage, carrier barcode, shipping API or real tracking is provided.</p></div><div class="actions"><button type="button" onclick="window.print()">Print demonstration label</button></div></body></html>`;
}
module.exports={workspace,save,seedWorkspace,validateProduct,listProducts,overview,createOrder,updateStatus,createShippingLabel,dispatchOrder,recheckHeldOrder,printableLabel,findOrder,imageAssets,categories,statuses,fail};
