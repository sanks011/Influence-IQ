/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains for external images
  images: {
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com'],
    // Add a placeholder service for fallback images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  
  // Optimize for Vercel deployment
  experimental: {
    // Enable server actions
    serverActions: true,
    // Optimize for Vercel deployment
    optimizeCss: true,
    // Optimize bundle size
    optimizePackageImports: ['lucide-react'],
  },
  
  // Configure headers for better security and caching
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  redirects: async () => {
    return [
      {
        source: '/analyze',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

