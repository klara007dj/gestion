/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ne pas faire échouer le build de prod sur les erreurs ESLint
  // (ex: react/no-unescaped-entities sur les apostrophes françaises).
  // Le contrôle de types TypeScript reste actif.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
