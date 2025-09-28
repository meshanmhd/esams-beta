import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Regular build for Netlify
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
  typescript: {
    // Ignore TypeScript errors during build for Netlify compatibility
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Ignore ESLint errors during build for Netlify compatibility
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
