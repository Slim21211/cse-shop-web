import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wjjwuljhrjxpqytsbstd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'cse-shop.ru',
        'www.cse-shop.ru',
        'cse-shop-web.vercel.app',
      ],
    },
  },
};

export default nextConfig;
