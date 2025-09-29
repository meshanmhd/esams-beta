import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized for Vercel deployment
  images: {
    // Use Vercel's image optimization
    formats: ['image/webp', 'image/avif'],
  },

  // Exclude MCP server directory from build
  outputFileTracingExcludes: {
    '*': ['./mcp-server/**/*'],
  },

  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  },

  // Enable compression
  compress: true,

  // TypeScript configuration
  typescript: {
    // Allow TypeScript errors during build for faster deployment
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Allow ESLint errors during build for faster deployment
    ignoreDuringBuilds: false,
  },

  // Vercel-specific optimizations
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
