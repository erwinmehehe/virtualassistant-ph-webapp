import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/hire-a-va/", destination: "/find-talent", permanent: true },
      { source: "/virtual-assistant-jobs/", destination: "/jobs", permanent: true },
      { source: "/client-dashboard/", destination: "/workspace/client", permanent: false },
      { source: "/va-dashboard/", destination: "/workspace/va", permanent: false },
      { source: "/account/", destination: "/auth/login", permanent: false }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  }
};

export default nextConfig;
