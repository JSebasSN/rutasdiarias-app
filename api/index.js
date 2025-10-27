import app from '../backend/hono';

export const handler = async (req, context) => {
  try {
    console.log('[Netlify Function] Received request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
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
    
    url.pathname = path || '/';
    
    console.log('[Netlify Function] Path transformation:', {
      original: originalPath,
      rewritten: path,
      fullUrl: url.toString(),
    });

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        const text = await req.text();
        console.log('[Netlify Function] Request body:', text);
        body = text;
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
    
    console.log('[Netlify Function] Response status:', response.status);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('[Netlify Function] Error in API handler:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
