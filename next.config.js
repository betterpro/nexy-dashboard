/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };

    // Fix for minimatch type definition issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
  images: {
    domains: [
      "maps.googleapis.com",
      "lh3.googleusercontent.com",
      "maps.gstatic.com",
      "firebasestorage.googleapis.com",
    ],
  },
  // Fix for multiple lockfiles warning
  outputFileTracingRoot: process.cwd(),
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
