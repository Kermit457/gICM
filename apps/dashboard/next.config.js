/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking and linting to speed up builds
  // These should be run separately in CI
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't fail on export errors for pages that need auth context
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
