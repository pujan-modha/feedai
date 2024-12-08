/** @type {import('next').NextConfig} */
const nextConfig: import("next").NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  images: {
    domains: ["feedai.anvit.tech", "feedai.prakshi.in"],
  },
};

module.exports = nextConfig;
