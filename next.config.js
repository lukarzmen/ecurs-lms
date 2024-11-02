/** @type {import('next').NextConfig} */
module.exports = {
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
