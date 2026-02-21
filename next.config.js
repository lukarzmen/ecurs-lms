/** @type {import('next').NextConfig} */
module.exports = {
  // Allows Server Actions requests when the Origin host differs from Host/x-forwarded-host.
  // Useful in local dev (localhost vs 127.0.0.1) and behind reverse proxies.
  serverActions: {
    allowedOrigins: [
      'localhost:3000',
      '127.0.0.1:3000',
      'ecurs.pl',
      'clerk.ecurs.pl',
      'accounts.ecurs.pl',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ecurs.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://ecurs.pl,https://clerk.ecurs.pl,https://accounts.ecurs.pl' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, X-Clerk-Auth-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};
