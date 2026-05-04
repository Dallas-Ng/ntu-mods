/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // productionBrowserSourceMaps: true,
  images: {
    formats: ["image/avif", "image/webp"]
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
        source: "/(.*)\\.(?:ico|png|svg|jpg|jpeg|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
