// Tiny client for the local Rive MCP (streamable HTTP, JSON replies).
const URL_ = 'http://127.0.0.1:9791/mcp';
let sid = null, id = 0;
async function rpc(method, params, notify) {
  const body = { jsonrpc: '2.0', method, params };
  if (!notify) body.id = ++id;
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sid ? { 'mcp-session-id': sid } : {}) },
    body: JSON.stringify(body)
  });
  const s = res.headers.get('mcp-session-id'); if (s) sid = s;
  if (notify) return null;
  const txt = await res.text();
  const line = txt.startsWith('{') ? txt : (txt.split('\n').find(l => l.startsWith('data:')) || '').slice(5);
  return JSON.parse(line);
}
export async function init() {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'gen', version: '0' } });
  await rpc('notifications/initialized', {}, true);
}
export async function tools() { return (await rpc('tools/list', {})).result.tools; }
export async function call(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  if (r.error) throw new Error(name + ': ' + JSON.stringify(r.error));
  const t = r.result.content.map(c => c.text || '').join('');
  try { return JSON.parse(t); } catch (e) { return t; }
}
