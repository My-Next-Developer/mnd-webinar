import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://learn.mynextdeveloper.com/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
