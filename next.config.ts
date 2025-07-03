import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'placehold.co',
      'images.pexels.com',
      'firebasestorage.googleapis.com',
    ],
  },
};

export default nextConfig;
