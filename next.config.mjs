// Ensure userConfig is always defined
let userConfig = {};

async function loadUserConfig() {
  try {
    userConfig = await import('./v0-user-next.config.mjs').then((mod) => mod.default);
  } catch (e) {
    console.warn("No user config found, using default Next.js config.");
  }
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

// Function to merge user config
function mergeConfig(baseConfig, userConfig) {
  if (!userConfig) return baseConfig;

  for (const key in userConfig) {
    if (typeof baseConfig[key] === "object" && !Array.isArray(baseConfig[key])) {
      baseConfig[key] = {
        ...baseConfig[key],
        ...userConfig[key],
      };
    } else {
      baseConfig[key] = userConfig[key];
    }
  }

  return baseConfig;
}

// Load user config before exporting
await loadUserConfig();
const finalConfig = mergeConfig(nextConfig, userConfig);

export default finalConfig;
