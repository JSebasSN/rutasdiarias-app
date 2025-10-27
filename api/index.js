import app from '../backend/hono';

export const handler = async (req, context) => {
  try {
    console.log('[Netlify Function] Received request:', {
      method: req.method,
      url: req.url,
    });
    
    console.log('[Netlify Function] Environment check:', {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    const url = new URL(req.url);
    const originalPath = url.pathname;
    
    let path = url.pathname.replace(/^\/\.netlify\/functions\/api/, '');
    
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    
    if (!path || path === '/') {
      path = '/';
    }
    
    url.pathname = path;
    
    console.log('[Netlify Function] Path transformation:', {
      original: originalPath,
      rewritten: path,
      search: url.search,
      fullUrl: url.toString(),
    });

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      try {
        const text = await req.text();
        if (text) {
          console.log('[Netlify Function] Request body:', text.substring(0, 200));
          body = text;
        }
      } catch (error) {
        console.error('[Netlify Function] Error reading body:', error);
      }
    }
    
    const newReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
    });
    
    const response = await app.fetch(newReq, {}, context);
    
    console.log('[Netlify Function] Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Netlify Function] Error in API handler:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
};
