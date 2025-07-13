/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'placehold.co',
        },
        {
            protocol: 'https',
            hostname: 'images.pexels.com',
        },
        {
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com',
        },
    ]
  },
};

export default nextConfig;
