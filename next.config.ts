import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Family DB migrations are read from disk at runtime.
  outputFileTracingIncludes: { "/**": ["./drizzle/family/**/*"] },
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
