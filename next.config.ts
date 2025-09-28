import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Regular build for Netlify (not static export)
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },

  // Exclude MCP server directory from build
  outputFileTracingExcludes: {
    '*': ['./mcp-server/**/*'],
  },

  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  },

  // Compress output
  compress: true,

  // Disable telemetry (handled via environment variable)
};

export default nextConfig;
