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
    if (lower !== 'host') {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit & { duplex?: string } = {
    method: req.method,
    headers,
    cache: 'no-store',
    duplex: 'half',
  };

  // Forward body for non-GET/HEAD requests
  // Use Buffer to ensure fetch calculates content-length properly and sends without chunking issues
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buffer = await req.arrayBuffer();
    if (buffer.byteLength > 0) {
      fetchOptions.body = Buffer.from(buffer);
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
