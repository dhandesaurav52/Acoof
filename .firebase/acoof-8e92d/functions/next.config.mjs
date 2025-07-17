// next.config.mjs
var nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      }
    ]
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
