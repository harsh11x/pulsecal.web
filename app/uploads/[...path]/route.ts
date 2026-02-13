import { NextRequest, NextResponse } from 'next/server';

// Backend URL - MUST be set in Vercel environment variables or .env.local
const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3001';

export const dynamic = 'force-dynamic';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathString = path.join('/');

    // Construct target URL
    const targetUrl = `${BACKEND_URL}/uploads/${pathString}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                // Forward relevant headers if needed
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[Uploads Proxy] Failed to fetch ${targetUrl}: ${response.status} ${response.statusText}`);
            return new NextResponse(`Image not found: ${targetUrl}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error('[Uploads Proxy Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}
