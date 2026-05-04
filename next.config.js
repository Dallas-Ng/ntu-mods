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
    ]
  }
}

module.exports = nextConfig
