import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // OpenNext for Cloudflare handles the runtime
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
