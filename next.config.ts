import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    domains: ["avatars.githubusercontent.com"],
  },
};

export default nextConfig;
