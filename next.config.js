/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/gestio/:path*',
        destination: '/:path*',
      },
    ]
  },
}


module.exports = nextConfig
