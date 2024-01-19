/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true
  },
  redirects: () => {
    return [
      {
        source: "/stars",
        destination: "/timetable",
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig
