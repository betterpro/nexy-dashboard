/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
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
};

module.exports = nextConfig;
