import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

async function proxyRequest(req: NextRequest, params: { proxy: string[] }) {
  const path = params.proxy.join('/');
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/api/${path}${url.search}`;

  // Forward all headers except host and content-length (will be recalculated)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== 'host' && lower !== 'content-length') {
      headers.set(key, value);
    }
  });
  
  // Prevent ECONNRESET by disabling keep-alive for proxied backend requests
  headers.set('Connection', 'close');

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET/HEAD requests
  // Use arrayBuffer() instead of text() so binary multipart/form-data
  // (file uploads) are forwarded without corruption.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buffer = await req.arrayBuffer();
    if (buffer.byteLength > 0) {
      fetchOptions.body = buffer;
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
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
