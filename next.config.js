/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    optimizePackageImports: ["lucide-react", "radix-ui", "date-fns"]
  },
  // productionBrowserSourceMaps: true,
  images: {
    formats: ["image/avif", "image/webp"]
  },
  skipTrailingSlashRedirect: true,
  rewrites: async () => {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*"
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*"
      }
    ]
  },
  redirects: () => {
    return [
      {
        source: "/stars",
        destination: "/timetable",
        permanent: true
      },
      {
        source: "/mod",
        destination: "/mods",
        permanent: true
      },
      {
        source: "/help",
        destination: "/faq",
        permanent: true
      },
      {
        source: "/mods",
        has: [{ type: "query", key: "moduleType", value: "GLOAD" }],
        destination: "/bde",
        permanent: true
      }
    ]
  },
  headers: () => {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }]
      },
      {
        source: "/data/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
