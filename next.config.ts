import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude MCP server directory from build
  outputFileTracingExcludes: {
    '*': ['./mcp-server/**/*'],
  },
};

export default nextConfig;
