exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const body = JSON.parse(event.body);

    // Log request size to help diagnose issues
    const bodySize = event.body.length;
    console.log(`Request size: ${(bodySize/1024).toFixed(1)}KB`);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    // Log the response for debugging
    if (!resp.ok) {
      console.error('Anthropic API error:', resp.status, JSON.stringify(data));
    } else {
      console.log('Success, response type:', data.content?.[0]?.type);
    }

    return {
      statusCode: resp.status,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 500,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
