/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static optimization for all pages
  experimental: {
    dynamicIO: true,
  },
}

export default nextConfig
