/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The assignment names the endpoints GET /feed, POST /swipe, GET /matches.
  // Next.js serves route handlers under /api, so we expose both paths.
  async rewrites() {
    return [
      { source: '/feed', destination: '/api/feed' },
      { source: '/swipe', destination: '/api/swipe' },
      { source: '/matches', destination: '/api/matches' },
    ];
  },
};

export default nextConfig;
