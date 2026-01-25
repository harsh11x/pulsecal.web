/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Removed rewrites - using API routes for proxying instead
  // This avoids conflicts between rewrites and API routes
}

export default nextConfig
