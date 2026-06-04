// Uses Netlify Blobs via REST API — no npm package required
// Netlify automatically injects NETLIFY_TOKEN and SITE_ID as env vars at runtime

const STORE = 'tax-data';
const KEY   = 'items';

function getBlobUrl() {
  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  return `https://blobs.netlify.com/api/v1/sites/${siteId}/blobs/${STORE}/${KEY}`;
}

function getHeaders() {
  const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };

  // GET — load items
  if (event.httpMethod === 'GET') {
    try {
      const resp = await fetch(getBlobUrl(), { headers: getHeaders() });
      if (resp.status === 404) return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: '[]' };
      if (!resp.ok) throw new Error(`Blob GET failed: ${resp.status}`);
      const text = await resp.text();
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: text || '[]' };
    } catch (e) {
      console.error('GET error:', e.message);
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: '[]' };
    }
  }

  // POST — save items
  if (event.httpMethod === 'POST') {
    try {
      const { items } = JSON.parse(event.body);
      const resp = await fetch(getBlobUrl(), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(items)
      });
      if (!resp.ok) throw new Error(`Blob PUT failed: ${resp.status}`);
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      console.error('POST error:', e.message);
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
