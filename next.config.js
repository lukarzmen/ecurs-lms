/** @type {import('next').NextConfig} */
module.exports = {
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
  };
