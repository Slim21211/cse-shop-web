import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  assetPrefix: isProd ? 'https://cse-shop-web.vercel.app' : '',
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
