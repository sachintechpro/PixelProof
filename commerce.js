'use strict';
/* Isolated demo workspaces: every browser gets its own catalog, inventory and orders.
 * Local JSON storage is durable across process restarts on persistent filesystems.
 * Render Free has an ephemeral filesystem, so resets can occur after redeploys.
 * This is intentionally NOT a production authentication or checkout system.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {products:seed} = require('./data');
const DATA_DIR = path.resolve(process.env.PIXELPROOF_DATA_DIR || path.join(__dirname,'.local-data'));
const sessions = new Map();
const imageAssets = ['/assets/lamp.svg','/assets/speaker.svg','/assets/chair.svg','/assets/keyboard.svg','/assets/clock.svg','/assets/headphones.svg'];
const categories = ['Lighting','Audio','Furniture','Accessories','Lifestyle'];
const statuses = ['Pending','Processing','Shipped','Delivered','Cancelled'];
const clone = x=>JSON.parse(JSON.stringify(x));
const fail=(code,message)=>{const e=new Error(message);e.status=code;throw e;};
const dayOffset=n=>new Date(Date.now()-n*86400000).toISOString();
function seedWorkspace(){const products=clone(seed).map(p=>({...p,sku:p.id.toUpperCase().replace(/-/g,'-'),active:true,createdAt:dayOffset(28)}));
  const orders=[
    {id:'PP-SAMPLE-301',createdAt:dayOffset(1),status:'Pending',items:[{id:'arc-lamp',name:'Arc desk lamp',sku:'ARC-LAMP',price:129,qty:1}],subtotal:129,shipping:12,total:141,customer:'Demo shopper'},
    {id:'PP-SAMPLE-300',createdAt:dayOffset(3),status:'Processing',items:[{id:'form-keyboard',name:'Form keyboard',sku:'FORM-KEYBOARD',price:149,qty:1},{id:'tempo-clock',name:'Tempo clock',sku:'TEMPO-CLOCK',price:79,qty:1}],subtotal:228,shipping:0,total:228,customer:'Demo shopper'},
    {id:'PP-SAMPLE-299',createdAt:dayOffset(6),status:'Delivered',items:[{id:'halo-headphones',name:'Halo headphones',sku:'HALO-HEADPHONES',price:229,qty:1}],subtotal:229,shipping:0,total:229,customer:'Demo shopper'}
  ];
  for(const order of orders){for(const item of order.items){const product=products.find(p=>p.id===item.id);if(product)product.inventory-=item.qty;}}
  return {products,orders,createdAt:new Date().toISOString()};}
async function workspace(req,res){
  const cookie=String(req.headers.cookie||'').match(/(?:^|;\s*)pp_workspace=([a-f0-9]{48})(?:;|$)/);
  const id=cookie?cookie[1]:crypto.randomBytes(24).toString('hex');
  if(!cookie){const secure=String(req.headers['x-forwarded-proto']||'').split(',')[0]==='https';res.setHeader('Set-Cookie',`pp_workspace=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure?'; Secure':''}`);}
  if(sessions.has(id))return sessions.get(id);
  let data;try{data=JSON.parse(await fs.readFile(path.join(DATA_DIR,`${id}.json`),'utf8'));}catch{data=seedWorkspace();}
  const session={id,data,pending:Promise.resolve()};sessions.set(id,session);return session;
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
function overview(s){const d=s.data;const active=d.products.filter(p=>p.active);const committed=d.orders.filter(o=>o.status!=='Cancelled');
  return {products:active.length,lowStock:active.filter(p=>p.inventory<=5).length,orders:d.orders.length,openOrders:d.orders.filter(o=>['Pending','Processing'].includes(o.status)).length,revenue:committed.reduce((n,o)=>n+o.total,0),unitsAvailable:active.reduce((n,p)=>n+p.inventory,0),recent:d.orders.slice(0,5)};}
function createOrder(s,payload){if(!payload||typeof payload!=='object'||Array.isArray(payload))fail(422,'Invalid order payload.');
  const email=String(payload.email||''),lines=payload.items;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!Array.isArray(lines)||!lines.length||lines.length>30)fail(422,'Provide a valid email and at least one item.');
  const seen=new Set();let subtotal=0;const items=[];
  for(const line of lines){const p=s.data.products.find(p=>p.id===line?.id&&p.active);const qty=line?.qty;if(!p||!Number.isInteger(qty)||qty<1||qty>10||qty>p.inventory||seen.has(line.id))fail(422,'Invalid product or quantity, or insufficient inventory.');
    seen.add(line.id);items.push({id:p.id,name:p.name,sku:p.sku,price:p.price,qty});subtotal=Math.round((subtotal+p.price*qty)*100)/100;}
  const shipping=subtotal>=150?0:12,order={id:'PP-'+crypto.randomBytes(4).toString('hex').toUpperCase(),createdAt:new Date().toISOString(),status:'Pending',items,subtotal,shipping,total:Math.round((subtotal+shipping)*100)/100,customer:'Demo shopper'};
  for(const item of items)s.data.products.find(p=>p.id===item.id).inventory-=item.qty;
  s.data.orders.unshift(order);if(s.data.orders.length>100)s.data.orders.length=100;
  return {ok:true,simulation:true,orderId:order.id,subtotal,shipping,total:order.total,message:'Saved as a demonstration order. No payment collected.'};}
function updateStatus(s,id,status){const order=s.data.orders.find(o=>o.id===id);if(!order)fail(404,'Order not found.');
  const next={Pending:['Processing','Cancelled'],Processing:['Shipped','Cancelled'],Shipped:['Delivered'],Delivered:[],Cancelled:[]};
  if(!next[order.status].includes(status))fail(409,`Cannot change ${order.status} order to ${status}.`);
  if(status==='Cancelled'){for(const item of order.items){const p=s.data.products.find(p=>p.id===item.id);if(p)p.inventory+=item.qty;}}
  order.status=status;order.updatedAt=new Date().toISOString();return order;}
module.exports={workspace,save,seedWorkspace,validateProduct,listProducts,overview,createOrder,updateStatus,imageAssets,categories,statuses,fail};
