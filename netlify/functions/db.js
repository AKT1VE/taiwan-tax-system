const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors(), body: '' };
  }

  const store = getStore({ name: 'tax-data', consistency: 'strong' });

  // GET — load all items
  if (event.httpMethod === 'GET') {
    try {
      const raw = await store.get('items');
      const items = raw ? JSON.parse(raw) : [];
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: JSON.stringify(items) };
    } catch (e) {
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: '[]' };
    }
  }

  // POST — save all items (full replace)
  if (event.httpMethod === 'POST') {
    try {
      const { items } = JSON.parse(event.body);
      await store.set('items', JSON.stringify(items));
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
}
