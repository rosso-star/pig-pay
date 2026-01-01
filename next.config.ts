/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pagesで動かすためにこれが必要な場合があります
  // output: 'export', // 静的書き出しモードにしているか確認
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;