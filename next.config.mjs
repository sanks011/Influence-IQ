/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Needed for Render
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['yt3.ggpht.com'], // Allow YouTube images
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {}, // Ensure it's an object, not a boolean
  },
};

// Export final configuration
export default nextConfig;
