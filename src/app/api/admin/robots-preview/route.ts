import { generateRobotsText } from '@/utils/robotsGenerator';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.utilixo.online';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get('authorization');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 1. Validate auth and syntax against backend
    const validateRes = await fetch(`${BACKEND_URL}/api/admin/settings/validate-robots`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token 
      },
      body: JSON.stringify({ robots_custom_block: body.robots_custom_block })
    });

    if (!validateRes.ok) {
      const errorData = await validateRes.json();
      return new Response(JSON.stringify(errorData), { 
        status: validateRes.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Generate preview
    const text = await generateRobotsText({
      blockFaceted: body.robots_block_faceted,
      blockAi: body.robots_block_ai,
      customBlock: body.robots_custom_block || ''
    });

    return new Response(text, { 
      headers: { 'Content-Type': 'text/plain' } 
    });
  } catch (err: any) {
    console.error('Error generating preview:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
