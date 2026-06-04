// Netlify Blobs — using the injected context token (available at runtime automatically)
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Netlify injects these automatically at runtime — no env vars needed
  const token = process.env.NETLIFY_BLOBS_CONTEXT
    ? JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT, 'base64').toString()).token
    : process.env.NETLIFY_TOKEN;

  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  console.log('siteId:', siteId ? siteId.slice(0,8) + '...' : 'MISSING');
  console.log('token available:', !!token);
  console.log('NETLIFY_BLOBS_CONTEXT available:', !!process.env.NETLIFY_BLOBS_CONTEXT);

  if (!token || !siteId) {
    // Fallback: return empty array so UI still works, just won't persist
    console.error('Missing credentials - token:', !!token, 'siteId:', !!siteId);
    if (event.httpMethod === 'GET') return { statusCode: 200, headers, body: '[]' };
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, warning: 'not persisted' }) };
  }

  const url = `https://blobs.netlify.com/api/v1/sites/${siteId}/stores/tax-data/tax-items`;

  if (event.httpMethod === 'GET') {
    try {
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.status === 404) return { statusCode: 200, headers, body: '[]' };
      if (!resp.ok) {
        console.error('GET failed:', resp.status, await resp.text());
        return { statusCode: 200, headers, body: '[]' };
      }
      const text = await resp.text();
      console.log('GET success, bytes:', text.length);
      return { statusCode: 200, headers, body: text || '[]' };
    } catch(e) {
      console.error('GET error:', e.message);
      return { statusCode: 200, headers, body: '[]' };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { items } = JSON.parse(event.body);
      const resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(items)
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('PUT failed:', resp.status, errText);
        throw new Error(`PUT failed: ${resp.status} ${errText}`);
      }
      console.log('PUT success, items:', items.length);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch(e) {
      console.error('POST error:', e.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
