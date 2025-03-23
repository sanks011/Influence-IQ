let userConfig = {}; // Ensure userConfig is always defined

try {
  userConfig = await import('./v0-user-next.config.mjs'); // Explicitly add .mjs extension
} catch (e) {
  console.warn("No user config found, using default Next.js config."); // Debugging info
}

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
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

mergeConfig(nextConfig, userConfig); // userConfig is now always defined

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) return;

  for (const key in userConfig) {
    if (typeof nextConfig[key] === "object" && !Array.isArray(nextConfig[key])) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;
