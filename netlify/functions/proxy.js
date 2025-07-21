// netlify/functions/proxy.js

export default async (req, res) => {
  const url = req.query.url || req.url.split('url=')[1];
  if (!url) {
    res.status(400).send('Missing url');
    return;
  }
  try {
    const fetchRes = await fetch(decodeURIComponent(url), { method: 'GET' });
    if (!fetchRes.ok) {
      res.status(fetchRes.status).send('Upstream error');
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/octet-stream');
    fetchRes.body.pipe(res);
  } catch (err) {
    res.status(500).send('Proxy error');
  }
}; 