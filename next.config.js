/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita che Next inferisca la root dal package-lock del repo parent (PERSONALE/)
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
