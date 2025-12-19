/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Skip static optimization - render all pages dynamically
  experimental: {
    dynamicIO: true,
  },
}

export default nextConfig
