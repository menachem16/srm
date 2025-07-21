// netlify/functions/proxy.js

export default async (event, context) => {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing url'
    };
  }
  try {
    const fetchRes = await fetch(decodeURIComponent(url), { method: 'GET' });
    if (!fetchRes.ok) {
      return {
        statusCode: fetchRes.status,
        body: 'Upstream error'
      };
    }
    const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream';
    const body = await fetchRes.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType
      },
      body: Buffer.from(body).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Proxy error'
    };
  }
}; 