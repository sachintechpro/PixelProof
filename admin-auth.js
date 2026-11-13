'use strict';
/* PixelProof demonstration-only authentication.
 * Credentials are intentionally published on the login screen. Never store real
 * customer or production data behind this public demonstration account.
 */
const crypto = require('node:crypto');

const DEMO_USERNAME = 'demo.admin';
const DEMO_PASSWORD = 'PixelProof@2026';
const TTL_MS = 4 * 60 * 60 * 1000;
const tokens = new Map();

function matches(value, expected) {
  const a = crypto.createHash('sha256').update(String(value ?? '')).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
function sessionToken(req) {
  return String(req.headers.cookie || '').match(/(?:^|;\s*)pp_admin=([a-f0-9]{64})(?:;|$)/)?.[1] || null;
}
function isAuthenticated(req, workspace) {
  const token = sessionToken(req);
  if (!token) return false;
  const session = tokens.get(token);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) { tokens.delete(token); return false; }
  return session.workspaceId === workspace.id;
}
function setCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(existing) ? existing : existing ? [existing] : []), cookie]);
}
function cookieOptions(req) {
  const secure = String(req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https';
  return `Path=/api/admin; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}
function login(req, res, workspace, credentials) {
  if (!credentials || !matches(credentials.username, DEMO_USERNAME) || !matches(credentials.password, DEMO_PASSWORD)) return false;
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, {workspaceId: workspace.id, expiresAt: Date.now() + TTL_MS});
  setCookie(res, `pp_admin=${token}; ${cookieOptions(req)}; Max-Age=${TTL_MS / 1000}`);
  return true;
}
function logout(req, res) {
  const token = sessionToken(req);
  if (token) tokens.delete(token);
  setCookie(res, `pp_admin=; ${cookieOptions(req)}; Max-Age=0`);
}
module.exports = {DEMO_USERNAME, DEMO_PASSWORD, isAuthenticated, login, logout};
