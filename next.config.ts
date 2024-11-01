import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '12mb',
  },
};

export default nextConfig;
