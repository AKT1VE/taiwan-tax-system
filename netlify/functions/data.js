const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const store = getStore({ name: 'tax-data', consistency: 'strong' });

  // GET - load all items
  if (event.httpMethod === 'GET') {
    try {
      const raw = await store.get('items');
      const items = raw ? JSON.parse(raw) : [];
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ items }) };
    } catch(e) {
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ items: [] }) };
    }
  }

  // POST - save all items
  if (event.httpMethod === 'POST') {
    try {
      const { items } = JSON.parse(event.body);
      await store.set('items', JSON.stringify(items));
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) };
    } catch(e) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
