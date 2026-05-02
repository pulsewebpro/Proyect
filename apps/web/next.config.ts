import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['esbuild'],
  transpilePackages: ['@amable/ui', '@amable/db', '@amable/shared', '@amable/ai'],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
