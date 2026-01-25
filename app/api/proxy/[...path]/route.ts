import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://13.205.127.21:3000'

export async function GET(request: NextRequest) {
    const path = request.nextUrl.pathname.replace('/api/proxy', '')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BACKEND_URL}${path}${searchParams ? `?${searchParams}` : ''}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const path = request.nextUrl.pathname.replace('/api/proxy', '')
    const url = `${BACKEND_URL}${path}`

    try {
        const body = await request.json()
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const path = request.nextUrl.pathname.replace('/api/proxy', '')
    const url = `${BACKEND_URL}${path}`

    try {
        const body = await request.json()
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const path = request.nextUrl.pathname.replace('/api/proxy', '')
    const url = `${BACKEND_URL}${path}`

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}
