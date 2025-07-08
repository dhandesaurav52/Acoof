
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // ✅ THIS ENABLES STATIC EXPORT
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: [
      'placehold.co',
      'images.pexels.com',
      'firebasestorage.googleapis.com',
    ],
  },
};

export default nextConfig;
