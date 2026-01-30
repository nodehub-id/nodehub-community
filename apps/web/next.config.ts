import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@nodehub/core', '@nodehub/db', '@nodehub/shared'],
};

export default nextConfig;
