const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const store = getStore({
      name: 'tax-data',
      consistency: 'strong'
    });

    if (event.httpMethod === 'GET') {
      const data = await store.get('items');
      console.log('GET items:', data ? 'found' : 'empty');
      return {
        statusCode: 200,
        headers,
        body: data || '[]'
      };
    }

    if (event.httpMethod === 'POST') {
      const { items } = JSON.parse(event.body);
      await store.set('items', JSON.stringify(items));
      console.log('SET items, count:', items.length);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, count: items.length })
      };
    }

  } catch(e) {
    console.error('DB error:', e.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
