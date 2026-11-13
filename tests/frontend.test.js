'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/admin.js'),'utf8');
const pageHTML=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const appSource=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
test('admin console renders a semantic accessible shell with connected actions',()=>{
  const doc={addEventListener(){}};const win={};
  vm.runInNewContext(source,{document:doc,window:win,Intl,Date,Number,JSON,String,Array,Math,Set,Promise,URL,console});
  assert.ok(win.PixelProofAdmin&&typeof win.PixelProofAdmin.render==='function');
  const html=win.PixelProofAdmin.render();
  for(const expected of ['id="main"','Commerce','role="tablist"','role="tab"','data-admin="reset"','data-route="store"','id="admin-content"','id="admin-modal-root"'])assert.ok(html.includes(expected),`missing ${expected}`);
});
test('website loads admin before router and exposes the commerce route',()=>{
  assert.ok(pageHTML.indexOf('/admin.js')<pageHTML.indexOf('/app.js'));
  assert.match(appSource,/\['home','store','studio','lab','quality','admin'\]/);
  assert.match(appSource,/PixelProofAdmin\.render\(\)/);
  assert.match(appSource,/PixelProofAdmin\.mount\(\)/);
});
test('admin styles include mobile breakpoints, table overflow and focus states',()=>{
  assert.match(style,/\.admin-table-scroll\{[^}]*overflow-x:auto/);
  assert.match(style,/@media\(max-width:700px\)/);
  assert.match(style,/\.admin-page button:focus-visible/);
});
