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
test('demo admin login displays public credentials and a sign-in form',()=>{
  const doc={addEventListener(){}};const win={};
  vm.runInNewContext(source,{document:doc,window:win,Intl,Date,Number,JSON,String,Array,Math,Set,Promise,URL,console});
  assert.ok(win.PixelProofAdmin&&typeof win.PixelProofAdmin.render==='function');
  const html=win.PixelProofAdmin.render();
  for(const expected of ['id="main"','DEMO ADMIN CREDENTIALS','demo.admin','PixelProof@2026','id="admin-login-form"','data-admin="fill-demo"','type="password"'])assert.ok(html.includes(expected),`missing ${expected}`);
  for(const expected of ['role="tablist"','data-admin="reset"','data-route="store"','id="admin-content"','id="admin-modal-root"'])assert.ok(source.includes(expected),`missing admin console ${expected}`);
});
test('website loads admin before router and exposes the commerce route',()=>{
  assert.ok(pageHTML.indexOf('/admin.js')<pageHTML.indexOf('/app.js'));
  assert.match(appSource,/\['home','store','studio','lab','quality','admin','checkout','confirmation'\]/);
  assert.match(appSource,/PixelProofAdmin\.render\(\)/);
  assert.match(appSource,/PixelProofAdmin\.mount\(\)/);
});
test('admin styles include mobile breakpoints, table overflow and focus states',()=>{
  assert.match(style,/\.admin-table-scroll\{[^}]*overflow-x:auto/);
  assert.match(style,/@media\(max-width:700px\)/);
  assert.match(style,/\.admin-page button:focus-visible/);
});
