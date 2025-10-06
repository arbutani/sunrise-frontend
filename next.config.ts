import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    // NEXT_PUBLIC_ENV: "LOCAL",
    NEXT_API_LOCAL_URL: 'http://localhost:3003/',
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
