'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const css = fs.readFileSync(require('node:path').resolve(__dirname, '../public/styles.css'), 'utf8');
const app = fs.readFileSync(require('node:path').resolve(__dirname, '../public/app.js'), 'utf8');

test('custom product quick-view overrides Bootstrap hidden modal', () => {
  assert.match(css, /\.overlay\s+\.modal\s*\{\s*display\s*:\s*block\s*;/);
  assert.match(app, /data-action="close" aria-label="Close quick view"/);
});
test('admin product Edit controls render on mobile cards', () => {
  assert.match(css, /\.admin-table-scroll\s*\{\s*overflow:\s*visible/);
  assert.match(css, /\.admin-row-button\s*\{[^}]*min-height:\s*44px/);
});
test('all admin tabs remain visible without horizontal scrolling at mobile sizes', () => {
  assert.match(css, /\.admin-tabs\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr/);
});
test('mobile forms avoid iOS zoom and handle device safe area', () => {
  assert.match(css, /textarea, select\s*\{\s*font-size:\s*16px\s*!important/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /safe-area-inset-bottom/);
});
