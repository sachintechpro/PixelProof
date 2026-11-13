#!/usr/bin/env python3
"""Surgical PixelProof order-processing update. Run from repository root."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
changes = {
 'commerce.js': [
  ("const statuses = ['Pending','Processing','Shipped','Delivered','Cancelled'];", "const statuses = ['Pending','Processing','Label Created','Dispatched','Shipped','Delivered','Cancelled'];"),
  ("const next={Pending:['Processing','Cancelled'],Processing:['Shipped','Cancelled'],Shipped:['Delivered'],Delivered:[],Cancelled:[]};", "const next={Pending:['Processing','Cancelled'],Processing:['Label Created','Cancelled'],'Label Created':['Dispatched'],Dispatched:['Delivered'],Shipped:['Delivered'],Delivered:[],Cancelled:[]};"),
  ("  if(status==='Cancelled'){for(const item of order.items){const p=s.data.products.find(p=>p.id===item.id);if(p)p.inventory+=item.qty;}}\n  order.status=status;order.updatedAt=new Date().toISOString();return order;}", "  if(status==='Label Created'){if(!order.items?.length||order.items.some(item=>!Number.isInteger(item.qty)||item.qty<1||!s.data.products.some(p=>p.id===item.id)))fail(409,'Cannot create label: order items or reserved inventory are invalid.');order.shippingLabel={id:'LBL-'+crypto.randomBytes(5).toString('hex').toUpperCase(),createdAt:new Date().toISOString(),printed:false};}\n  if(status==='Dispatched'&&!order.shippingLabel?.printed)fail(409,'Print the shipping label before marking this order complete.');\n  if(status==='Dispatched')order.dispatchedAt=new Date().toISOString();\n  if(status==='Cancelled'){for(const item of order.items){const p=s.data.products.find(p=>p.id===item.id);if(p)p.inventory+=item.qty;}}\n  order.status=status;order.updatedAt=new Date().toISOString();return order;}\nfunction recordLabelPrint(s,id){const order=s.data.orders.find(o=>o.id===id);if(!order)fail(404,'Order not found.');if(order.status!=='Label Created'||!order.shippingLabel)fail(409,'Create a shipping label before printing.');order.shippingLabel.printed=true;order.shippingLabel.printRequestedAt=new Date().toISOString();order.updatedAt=new Date().toISOString();return order;}"),
  ('updateStatus,imageAssets', 'updateStatus,recordLabelPrint,imageAssets')
 ],
 'server.js': [
  ("const payload=await readBody(req);const order=commerce.updateStatus(s,orderMatch[1],payload?.status);await commerce.save(s);return sendJSON(res,200,{order});", "const payload=await readBody(req);const order=payload?.action==='print-label'?commerce.recordLabelPrint(s,orderMatch[1]):commerce.updateStatus(s,orderMatch[1],payload?.status);await commerce.save(s);return sendJSON(res,200,{order});")
 ],
 'public/admin.js': [
  ("const validNext={Pending:['Processing','Cancelled'],Processing:['Shipped','Cancelled'],Shipped:['Delivered'],Delivered:[],Cancelled:[]};", "const validNext={Pending:['Processing','Cancelled'],Processing:['Label Created','Cancelled'],'Label Created':['Dispatched'],Dispatched:['Delivered'],Shipped:['Delivered'],Delivered:[],Cancelled:[]};"),
  ("${validNext[o.status].length?validNext[o.status].map(s=>`<button type=\"button\" data-admin=\"status\" data-id=\"${escape(o.id)}\" data-status=\"${s}\" class=\"${s==='Cancelled'?'admin-danger':'button'}\">${s==='Cancelled'?'Cancel order':`Mark ${s.toLowerCase()}`}</button>`).join(' '):'<span class=\"pill green\">Workflow completed</span>'}", "${o.status==='Label Created'?`<button type=\"button\" class=\"button\" data-admin=\"print-label\" data-id=\"${escape(o.id)}\">Print Shipping Label</button> <button type=\"button\" class=\"button\" data-admin=\"status\" data-id=\"${escape(o.id)}\" data-status=\"Dispatched\" ${o.shippingLabel?.printed?'':'disabled'}>Mark as Complete</button>${o.shippingLabel?.printed?' <small>Label print requested.</small>':''}`:validNext[o.status].length?validNext[o.status].map(s=>`<button type=\"button\" data-admin=\"status\" data-id=\"${escape(o.id)}\" data-status=\"${s}\" class=\"${s==='Cancelled'?'admin-danger':'button'}\">${s==='Cancelled'?'Cancel order':s==='Label Created'?'Create Shipping Label':`Mark ${s.toLowerCase()}`}</button>`).join(' '):'<span class=\"pill green\">Workflow completed</span>'}"),
  ('<span>03 · Shipped</span><b>→</b><span>04 · Delivered</span>', '<span>03 · Label Created</span><b>→</b><span>04 · Dispatched</span><b>→</b><span>05 · Delivered</span>'),
  ("    if(action==='status'){const id=el.dataset.id,status=el.dataset.status;", """    if(action==='print-label'){const id=el.dataset.id,o=data.orders.find(x=>x.id===id);if(!o||o.status!=='Label Created'||!o.shippingLabel)return;const popup=window.open('','_blank','width=760,height=720');if(!popup){window.alert('Please allow pop-ups to print the shipping label.');return;}const lines=o.items.map(i=>`<tr><td>${escape(i.sku)}</td><td>${escape(i.name)}</td><td>${i.qty}</td></tr>`).join('');popup.document.open();popup.document.write(`<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Sample Shipping Label ${escape(o.id)}</title><style>body{font:16px Arial,sans-serif;margin:40px;color:#111}main{max-width:580px;border:2px solid #111;padding:26px}h1{font-size:23px}p{line-height:1.5}table{border-collapse:collapse;width:100%;margin-top:22px}td,th{border:1px solid #999;padding:9px;text-align:left}.notice{border:2px dashed #b22;padding:12px;font-weight:bold;margin-top:22px}@media print{body{margin:0}button{display:none}}</style></head><body><main><h1>PIXELPROOF · SAMPLE SHIPPING LABEL</h1><p><b>Order:</b> ${escape(o.id)}<br><b>Label reference:</b> ${escape(o.shippingLabel.id)}<br><b>Recipient:</b> Demo shopper</p><p><b>Ship to:</b> No shipping address collected at sample checkout.</p><table><thead><tr><th>SKU</th><th>Item</th><th>Qty</th></tr></thead><tbody>${lines}</tbody></table><p class=\"notice\">DEMO ONLY — NOT VALID FOR POSTAGE OR CARRIER SHIPPING</p></main></body></html>`);popup.document.close();popup.focus();popup.print();data.expanded=id;mutate(()=>api('/api/admin/orders/'+encodeURIComponent(id),jsonOptions('PATCH',{action:'print-label'})),'Shipping label print requested.');return;}\n    if(action==='status'){const id=el.dataset.id,status=el.dataset.status;""")
 ]
}

# Validate all changes before writing any file; no partially applied modifications.
outputs = {}
for rel, edits in changes.items():
    path = ROOT / rel
    if not path.is_file():
        sys.exit(f'Missing {rel}. Put this script in your PixelProof repository root.')
    original = path.read_text(encoding='utf-8')
    updated = original
    for old, new in edits:
        if updated.count(old) != 1:
            sys.exit(f'Stopped without modifying any files: pattern missing or ambiguous in {rel}: {old[:70]}')
        updated = updated.replace(old, new, 1)
    outputs[path] = updated

for path, updated in outputs.items():
    path.write_text(updated, encoding='utf-8')
    print(f'Updated {path.relative_to(ROOT)}')
print('Only the three listed order-processing files were modified. Run npm run check before deployment.')
