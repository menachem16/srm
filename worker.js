addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request).catch(
    (err) => new Response(err.stack, { status: 500 })
  ))
})

async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  
  // 1. Try to get URL from `?url=` query parameter (new method)
  let targetUrl = requestUrl.searchParams.get('url');

  // 2. If not found, get it from the path (old method)
  if (!targetUrl) {
    // The path looks like `/http://domain.com/path?query=1`
    // So we remove the leading `/`
    targetUrl = requestUrl.pathname.substring(1);
    // And append the original query string, if it exists
    if (requestUrl.search) {
      targetUrl += requestUrl.search;
    }
  }

  // The path-based URL might be URI encoded. It's safer to try decoding it.
  // A non-encoded URL will not be affected.
  try {
    if (targetUrl.includes('%')) { // Only decode if there are encoded characters
        targetUrl = decodeURIComponent(targetUrl);
    }
  } catch(e) { /* ignore decode errors, proceed with the URL as is */ }


  if (!targetUrl || !targetUrl.startsWith('http')) {
    const errorMessage = 'Target URL not found or invalid. ' + 
      'Use the format `?url=ENCODED_TARGET_URL` or `/TARGET_URL`. ' +
      `Received: "${targetUrl}"`;
    return new Response(errorMessage, { status: 400 });
  }

  // Recreate the request to the target URL.
  // This is important to avoid various Cloudflare-specific header issues.
  const newRequest = new Request(targetUrl, {
      headers: request.headers,
      method: request.method,
      body: request.body,
      redirect: 'follow'
  });
  
  // Set a common user-agent to avoid being blocked by IPTV services.
  newRequest.headers.set('User-Agent', 'VLC/3.0.18 LibVLC/3.0.18');
  
  const response = await fetch(newRequest);

  // Create a new response with mutable headers and proper CORS configuration.
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  // Allow all headers requested by the client in a preflight request.
  const reqHeaders = request.headers.get('Access-Control-Request-Headers');
  if (reqHeaders) {
    newHeaders.set('Access-Control-Allow-Headers', reqHeaders);
  }

  // Handle CORS preflight (OPTIONS) requests.
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: newHeaders });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}