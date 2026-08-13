import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

async function proxyRequest(req: NextRequest, params: { proxy: string[] }) {
  const path = params.proxy.join('/');
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/${path}${url.search}`;

  // Forward all headers except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Do not forward host, or content-length (since we are streaming the body and fetch will handle it)
    if (lower !== 'host' && lower !== 'content-length') {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit & { duplex?: string } = {
    method: req.method,
    headers,
    cache: 'no-store',
    duplex: 'half',
  };

  // Forward body stream directly for non-GET/HEAD requests
  // This prevents memory bloat and avoids Next.js body parser limits crashing the proxy
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = req.body;
  }

  let response;
  try {
    response = await fetch(targetUrl, fetchOptions);
  } catch (error: any) {
    if (error.cause?.code === 'ECONNRESET' || error.code === 'ECONNRESET') {
      console.log(`[Proxy] Retrying request to ${targetUrl} due to ECONNRESET`);
      // Add a tiny delay to let backend finish restarting
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        response = await fetch(targetUrl, fetchOptions);
      } catch (retryError) {
        console.error('Proxy retry failed:', retryError);
        return NextResponse.json({ error: 'Backend server is restarting or unavailable (ECONNREFUSED)' }, { status: 502 });
      }
    } else {
      console.error('Proxy fetch failed:', error);
      return NextResponse.json({ error: 'Proxy fetch failed: ' + (error.message || 'Unknown error') }, { status: 502 });
    }
  }

  try {
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip hop-by-hop headers and compression headers since fetch auto-decompresses
      const lower = key.toLowerCase();
      if (!['transfer-encoding', 'connection', 'keep-alive', 'content-encoding', 'content-length'].includes(lower)) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(req, await params);
}
