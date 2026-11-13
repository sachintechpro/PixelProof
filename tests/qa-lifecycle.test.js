'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Existing quality runner is preserved while lifecycle tool loads separately',()=>{
  const index=read('public/index.html');
  const old=read('public/qa-center.js');
  const fresh=read('public/qa-lifecycle.js');
  for(const marker of ['qa-center.js','qa-lifecycle.js','qa-lifecycle.css']) assert.ok(index.includes(marker),marker);
  for(const marker of ['data-qa-all','data-qa-suite-run','data-qa-one','data-qa-reset','/api/qa/run']) assert.ok(old.includes(marker),marker);
  assert.ok(fresh.includes('qa-lifecycle'));
});

test('Lifecycle has all six real functional panels and traceability',()=>{
  const s=read('public/qa-lifecycle.js');
  for(const marker of ['Requirements','Test design','Manual execution','Automation','Defects & evidence','QA reporting','REQ-01','REQ-08','TC-03','TC-10']) assert.ok(s.includes(marker),marker);
  for(const marker of ['ql-manual-form','ql-case-form','ql-defect-create','filePut','fileGet','export-json','export-csv']) assert.ok(s.includes(marker),marker);
});

test('Recorded manual outcomes and evidence are distinguished from runner proof',()=>{
  const s=read('public/qa-lifecycle.js');
  assert.ok(s.includes('tester-entered'));
  assert.ok(s.includes('Browser-local manual QA'));
  assert.ok(s.includes('indexedDB'));
  assert.ok(s.includes('Not run'));
  assert.ok(!s.includes('Math.random()*100'));
});

test('Python source and isolated CI configuration are real and inspectable',()=>{
  const p=read('automation/python/test_pixelproof.py');
  const ci=read('.github/workflows/python-selenium.yml');
  for(const marker of ['webdriver.Chrome','pytest','requests.get','save_screenshot','test_storefront_cart_journey','test_quality_workbench_exposes_traceable_cases']) assert.ok(p.includes(marker),marker);
  assert.ok(ci.includes('PIXELPROOF_ISOLATED=true'));
  assert.ok(ci.includes('--junitxml'));
});
