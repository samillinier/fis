/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
    }
    return config
  },
  /** Send users to the custom domain (e.g. pod) when they hit the default *.vercel.app production host. */
  async redirects() {
    const canonical =
      process.env.NEXT_PUBLIC_CANONICAL_URL ||
      process.env.NEXT_PUBLIC_APP_BASE_URL ||
      ''
    const rawHosts =
      process.env.VERCEL_PRODUCTION_VERCEL_HOSTS || 'fis-zeta.vercel.app'
    if (process.env.NODE_ENV !== 'production' || !canonical) {
      return []
    }
    try {
      const origin = new URL(canonical).origin
      const hosts = rawHosts
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
      return hosts.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host', value: host }],
        destination: `${origin}/:path*`,
        permanent: true,
      }))
    } catch {
      return []
    }
  },
}

module.exports = nextConfig


