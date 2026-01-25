/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only rewrite to localhost if explicitly set or no env var (dev mode)
    // In production, NEXT_PUBLIC_API_URL should point to the real API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.205.127.21:3000';
    
    // IMPORTANT: In production on Vercel/Netlify, rewrites are server-side.
    // If API is on a different domain, we don't need rewrites if we use absolute URLs in client.
    // However, if we want to proxy /api requests to avoid CORS or hide API URL:
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
