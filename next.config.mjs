/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.utilixo.online/api/:path*',
      },
    ];
  },
};

export default nextConfig;
