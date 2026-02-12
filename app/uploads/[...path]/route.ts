import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3001'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const path = params.path.join('/')
    const url = `${BACKEND_URL}/uploads/${path}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // Forward cookie or auth if needed? Usually uploads are public or token in url?
                // Backend serves static files via express.static, so no auth needed usually.
                // But let's forward headers just in case.
                'Authorization': request.headers.get('Authorization') || '',
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'File not found' }, { status: response.status })
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Uploads proxy error:', error)
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}
