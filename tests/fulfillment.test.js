'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
// Test the public default: all fictional buyers and the business owner share one catalog.
delete process.env.PIXELPROOF_ISOLATED;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pixelproof-v3-'));
process.env.PIXELPROOF_DATA_DIR=tmp;
const {handler}=require('../server');
let server,base,authCookie,orderId,labelRef,initialStock;
const api=(url,options={})=>fetch(base+url,{...options});
const json=(method,data,cookie)=>({method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});
const newOrder=()=>({customer:'Alex Example',email:'alex@example.com',shipping:{address1:'123 Example Lane',city:'Sample City',region:'CA',postalCode:'90001',country:'US'},paymentToken:'demo-visa-4242',items:[{id:'arc-lamp',qty:1}]});
test.before(async()=>{server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;});
test.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(tmp,{recursive:true,force:true});});
test('visitor catalog is shared across independent browser requests',async()=>{const one=await api('/api/products'),two=await api('/api/products');assert.equal((await one.json()).total,6);assert.equal((await two.json()).total,6);});
test('fictional payment rejection never creates an order or reserves stock',async()=>{
  initialStock=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;
  const declined=await api('/api/orders',json('POST',{...newOrder(),paymentToken:'demo-visa-declined'}));assert.equal(declined.status,402);
  const bad=await api('/api/orders',json('POST',{...newOrder(),paymentToken:'real-card-data'}));assert.equal(bad.status,422);
  const personal=await api('/api/orders',json('POST',{...newOrder(),email:'real-person@gmail.com'}));assert.equal(personal.status,422);
  const after=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;assert.equal(after,initialStock);
});
test('storefront checkout creates demo paid order, reserves stock and sends only token',async()=>{
  const order=await api('/api/orders',json('POST',newOrder()));assert.equal(order.status,201);const body=await order.json();orderId=body.orderId;
  assert.match(body.orderId,/^PP-[A-Z0-9]+$/);assert.equal(body.paymentStatus,'Approved (simulation)');assert.equal(body.total,141);assert.equal(body.status,'Ready');
  const after=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;assert.equal(after,initialStock-1);
});
test('admin must log in before orders are visible, but then sees a different browser checkout',async()=>{
  const unauth=await api('/api/admin/orders');assert.equal(unauth.status,401);
  const login=await api('/api/admin/login',json('POST',{username:'demo.admin',password:'PixelProof@2026'}));assert.equal(login.status,200);
  authCookie=login.headers.get('set-cookie').split(';')[0];
  const r=await api('/api/admin/orders',{headers:{Cookie:authCookie}});assert.equal(r.status,200);
  const orders=(await r.json()).orders;const placed=orders.find(x=>x.id===orderId);
  assert.ok(placed);assert.equal(placed.customer,'Alex Example');assert.equal(placed.email,'alex@example.com');
  assert.equal(placed.shipTo.address1,'123 Example Lane');assert.equal(placed.payment.last4,'4242');
  assert.equal(JSON.stringify(placed).includes('4242424242424242'),false);assert.equal(JSON.stringify(placed).includes('123"'),false);
});
test('cannot dispatch before a label has been created',async()=>{
  const r=await api('/api/admin/orders/'+orderId+'/dispatch',json('POST',{labelRef:'DEMO-LBL-BAD'},authCookie));assert.equal(r.status,409);
  const p=await api('/api/admin/orders/'+orderId,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Dispatched'})});assert.equal(p.status,409);
});
test('generate printable sample label with fake carrier and buyer details',async()=>{
  const created=await api('/api/admin/orders/'+orderId+'/label',json('POST',{},authCookie));assert.equal(created.status,200);
  const body=await created.json();labelRef=body.labelRef;assert.match(labelRef,/^DEMO-LBL-/);assert.equal(body.order.status,'Label created');
  const noAuth=await api('/api/admin/orders/'+orderId+'/label');assert.equal(noAuth.status,401);
  const printable=await api('/api/admin/orders/'+orderId+'/label',{headers:{Cookie:authCookie}});assert.equal(printable.status,200);
  const label=await printable.text();for(const fragment of ['DEMONSTRATION ONLY','NOT VALID FOR SHIPMENT',labelRef,'Alex Example','123 Example Lane'])assert.ok(label.includes(fragment));
  const again=await api('/api/admin/orders/'+orderId+'/label',json('POST',{},authCookie));assert.equal(again.status,409);
});
test('incorrect shipping label reference blocks dispatch; matching reference succeeds',async()=>{
  const wrong=await api('/api/admin/orders/'+orderId+'/dispatch',json('POST',{labelRef:'DEMO-LBL-INCORRECT'},authCookie));assert.equal(wrong.status,422);
  const ok=await api('/api/admin/orders/'+orderId+'/dispatch',json('POST',{labelRef},authCookie));assert.equal(ok.status,200);assert.equal((await ok.json()).order.status,'Dispatched');
  const duplicate=await api('/api/admin/orders/'+orderId+'/dispatch',json('POST',{labelRef},authCookie));assert.equal(duplicate.status,409);
});
test('dispatched order can be marked delivered but cannot be cancelled or relabeled',async()=>{
  const cancel=await api('/api/admin/orders/'+orderId,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Cancelled'})});assert.equal(cancel.status,409);
  const delivered=await api('/api/admin/orders/'+orderId,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Delivered'})});assert.equal(delivered.status,200);
  assert.equal((await delivered.json()).order.status,'Delivered');
  const events=(await(await api('/api/admin/activity',{headers:{Cookie:authCookie}})).json()).events;
  assert.ok(events.some(e=>e.action==='ORDER_RECEIVED'));assert.ok(events.some(e=>e.action==='LABEL_CREATED'));assert.ok(events.some(e=>e.action==='DISPATCHED'));
});
test('a cancelled ready order releases inventory, while a shortage fails atomically',async()=>{
  const before=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;
  const create=await api('/api/orders',json('POST',newOrder()));const b=await create.json();assert.equal(create.status,201);
  const cancel=await api('/api/admin/orders/'+b.orderId,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Cancelled'})});assert.equal(cancel.status,200);
  const after=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;assert.equal(after,before);
  const shortage=await api('/api/orders',json('POST',{...newOrder(),items:[{id:'arc-lamp',qty:99}]}));assert.equal(shortage.status,409);
  const afterShortage=(await(await api('/api/products')).json()).products.find(x=>x.id==='arc-lamp').inventory;assert.equal(afterShortage,before);
});
test('held seeded order blocks labels until stock is replenished and reserved',async()=>{
  const heldId='PP-SAMPLE-298';
  const tooEarly=await api('/api/admin/orders/'+heldId+'/label',json('POST',{},authCookie));assert.equal(tooEarly.status,409);
  const short=await api('/api/admin/orders/'+heldId+'/recheck',json('POST',{},authCookie));assert.equal(short.status,409);
  const product=(await(await api('/api/admin/products',{headers:{Cookie:authCookie}})).json()).products.find(p=>p.id==='studio-chair');
  assert.ok(product);product.inventory=12;
  const updated=await api('/api/admin/products/'+product.id,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify(product)});assert.equal(updated.status,200);
  const recheck=await api('/api/admin/orders/'+heldId+'/recheck',json('POST',{},authCookie));assert.equal(recheck.status,200);
  assert.equal((await recheck.json()).order.status,'Ready');
  const after=(await(await api('/api/admin/products',{headers:{Cookie:authCookie}})).json()).products.find(p=>p.id==='studio-chair');assert.equal(after.inventory,2);
  const label=await api('/api/admin/orders/'+heldId+'/label',json('POST',{},authCookie));assert.equal(label.status,200);
  const cancelled=await api('/api/admin/orders/'+heldId,{method:'PATCH',headers:{Cookie:authCookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Cancelled'})});assert.equal(cancelled.status,200);
  const restored=(await(await api('/api/admin/products',{headers:{Cookie:authCookie}})).json()).products.find(p=>p.id==='studio-chair');assert.equal(restored.inventory,12);
});
