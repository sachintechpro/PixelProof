'use strict';
/** Generates machine-readable test evidence from real Node TAP execution.
 * No static/fabricated pass counts. Fails the build on syntax/test failure.
 */
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const checks=['server.js','qa-live-runner.js','commerce.js','admin-auth.js','public/app.js','public/admin.js','public/react-lab.js','public/qa-center.js'];
for(const file of checks){const out=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});if(out.status!==0){process.stderr.write(out.stdout+out.stderr);process.exit(out.status||1);}}
const files=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.js')).sort().map(f=>'tests/'+f);
const run=spawnSync(process.execPath,['--test','--test-reporter=tap',...files],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,FORCE_COLOR:'0'}});
if(run.error)throw run.error;
const output=run.stdout||'';process.stdout.write(output);if(run.stderr)process.stderr.write(run.stderr);
const records=[];let current=null;
for(const line of output.split(/\r?\n/)){
  let m=line.match(/^(ok|not ok) \d+ - (.+?)(?:\s+#.*)?$/);
  if(m){current={id:'AT-'+String(records.length+1).padStart(3,'0'),title:m[2],status:m[1]==='ok'?'passed':'failed',durationMs:null};records.push(current);continue;}
  m=line.match(/^\s+duration_ms:\s*([\d.]+)/);if(m&&current)current.durationMs=Number(m[1]);
}
const summary={};for(const k of ['tests','pass','fail','skip','todo','cancelled']){const m=output.match(new RegExp(`^# ${k} (\\d+)`,'m'));summary[k]=m?Number(m[1]):null;}
const duration=output.match(/^# duration_ms ([\d.]+)/m);summary.durationMs=duration?Number(duration[1]):null;
function level(name){
 if(/mobile|iOS|breakpoints|quick-view|modal|Edit controls|tabs remain|UI|styles|form|website loads|homepage served/i.test(name))return 'UI & responsive';
 if(/admin login|credentials|require authentication|unauthorized|auth|cross-site|origin|path traversal|cookie|security|session/i.test(name))return 'Security';
 if(/product validation|SKU|price boundary|inventory boundary|label renderer|unit:|catalog sort/i.test(name))return 'Unit';
 if(/checkout|order|stock|inventory|fulfill|dispatch|label|customer|visitor|product|catalog/i.test(name))return 'API & integration';
 return 'API & integration';
}
function priority(name){return /payment|checkout|stock|oversell|dispatch|security|auth|label|incorrect shipping|inventory|cross-site/i.test(name)?'P0':/mobile|modal|validation|order|product/i.test(name)?'P1':'P2';}
const result={schemaVersion:1,generatedAt:new Date().toISOString(),source:'Node.js built-in test runner (TAP)',commit:process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||null,summary,
 tests:records.map(r=>({...r,level:level(r.title),priority:priority(r.title)}))};
const dest=path.join(root,'public','qa-ci-results.json');fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
console.log(`\nQA evidence: ${dest} (${records.length} executed cases, ${summary.pass} passed, ${summary.fail} failed)`);
if(run.status!==0||summary.tests!==records.length||summary.fail!==0||summary.tests===0)process.exit(1);
