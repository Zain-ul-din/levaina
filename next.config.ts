import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Laminar's OpenTelemetry SDK uses Node-only APIs: load it at runtime, don't bundle it.
  serverExternalPackages: ["@lmnr-ai/lmnr"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
